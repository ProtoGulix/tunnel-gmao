"""Prototype AUDC-00 : une transaction par requête portée par un BaseHTTPMiddleware.

Rien ici n'est du code de production. Les fonctions get_connection, release_connection
et db_connection reprennent le contrat de api/db.py ; en production, la logique du
ContextVar vivrait DANS api/db.py (les repos font `from api.db import get_connection`,
le nom est lié à l'import : on ne peut donc pas le remplacer de l'extérieur).
"""

import asyncio
import contextvars
from contextlib import contextmanager

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.middleware.base import BaseHTTPMiddleware

from api import db

_current: contextvars.ContextVar["TxConnection | None"] = contextvars.ContextVar(
    "spike_tx", default=None
)
# Autre ContextVar posé PAR une route, pour vérifier qu'il ne remonte pas au middleware.
route_marker: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "route_marker", default=None
)

# Compteurs observés par les tests.
stats = {"tx_opened": 0, "fake_commits": 0, "fake_releases": 0}


class TxConnection:
    """Connexion psycopg2 enveloppée : commit différé, release sans effet.

    mode "savepoint" : chaque get_connection() pose un SAVEPOINT ; rollback() du repo
    revient à ce point et n'efface que SON travail. mode "naive" : rollback() réel,
    qui annule tout ce que la requête a écrit jusque-là.
    """

    def __init__(self, real, mode: str = "savepoint"):
        self._real = real
        self.mode = mode
        self.closed = False
        self.events: list[dict] = []  # événements d'audit déposés par les routes
        self._sp = 0
        self._active_sp: list[str] = []

    # Délégation de tout ce que les repos utilisent (cursor, status...).
    def __getattr__(self, name):
        return getattr(self._real, name)

    def begin_scope(self):
        """Appelé par get_connection : un SAVEPOINT par emprunt (mode savepoint)."""
        if self.mode == "savepoint":
            self._sp += 1
            name = f"sp_{self._sp}"
            with self._real.cursor() as cur:
                cur.execute(f"SAVEPOINT {name}")  # nom interne, pas une entrée utilisateur
            self._active_sp.append(name)

    def commit(self):
        stats["fake_commits"] += 1  # ne valide rien

    def rollback(self):
        if self.mode == "naive":
            self._real.rollback()
            return
        if self._active_sp:
            with self._real.cursor() as cur:
                cur.execute(f"ROLLBACK TO SAVEPOINT {self._active_sp[-1]}")
        else:
            self._real.rollback()


def get_connection():
    tx = _current.get()
    if tx is not None and not tx.closed:
        tx.begin_scope()
        return tx
    return db.get_connection()


def release_connection(conn):
    if isinstance(conn, TxConnection):
        stats["fake_releases"] += 1
        return
    db.release_connection(conn)


@contextmanager
def db_connection():
    """Même contrat que api.db.db_connection, sur le get_connection du prototype."""
    conn = get_connection()
    try:
        yield conn
    except Exception:
        conn.rollback()
        raise
    finally:
        release_connection(conn)


def tx_connection() -> "TxConnection | None":
    return _current.get()


class TransactionMiddleware(BaseHTTPMiddleware):
    """Ouvre la transaction des requêtes qui modifient, écrit l'audit, valide ou annule."""

    def __init__(self, app, mode: str = "savepoint", audit_sql: str | None = None):
        super().__init__(app)
        self.mode = mode
        self.audit_sql = audit_sql or ("INSERT INTO spike_audit (path, detail) VALUES (%s, %s)")

    async def dispatch(self, request: Request, call_next):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return await call_next(request)

        # psycopg2 est bloquant : emprunt, audit, commit passent par le threadpool.
        real = await run_in_threadpool(db.get_connection)
        tx = TxConnection(real, self.mode)
        stats["tx_opened"] += 1
        token = _current.set(tx)
        try:
            try:
                response = await call_next(request)
            except Exception:
                await run_in_threadpool(real.rollback)
                raise
            if response.status_code >= 400:
                await run_in_threadpool(real.rollback)
                return response
            try:
                await run_in_threadpool(self._write_audit_and_commit, tx, request)
            except Exception:
                await run_in_threadpool(real.rollback)
                return JSONResponse({"detail": "Erreur d'audit"}, status_code=500)
            return response
        finally:
            tx.closed = True
            _current.reset(token)
            await run_in_threadpool(db.release_connection, real)

    def _write_audit_and_commit(self, tx: TxConnection, request: Request):
        with tx._real.cursor() as cur:
            for ev in tx.events or [{"detail": "-"}]:
                cur.execute(self.audit_sql, (request.url.path, ev.get("detail", "-")))
        tx._real.commit()


# --- Faux repos : mêmes usages que les vrais (cursor, commit, rollback, finally release) ---


def repo_insert(label: str, fail: bool = False):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO spike_item (label) VALUES (%s)", (label,))
        if fail:
            cur.execute("INSERT INTO spike_item (label) VALUES (NULL)")  # viole NOT NULL
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        release_connection(conn)


def repo_insert_swallow(label: str):
    """Repo qui attrape l'erreur SQL, fait rollback() puis NE relève PAS."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO spike_item (label) VALUES (NULL)")
        conn.commit()
    except Exception:
        conn.rollback()
    finally:
        release_connection(conn)


def repo_backend_pid() -> int:
    with db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT pg_backend_pid()")
        return cur.fetchone()[0]


def repo_count() -> int:
    with db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM spike_item")
        return cur.fetchone()[0]


def build_app(mode: str = "savepoint", audit_sql: str | None = None, barrier=None) -> FastAPI:
    app = FastAPI()
    app.add_middleware(TransactionMiddleware, mode=mode, audit_sql=audit_sql)

    @app.post("/sync/{label}")
    def sync_route(label: str):
        repo_insert(label)
        tx = tx_connection()
        tx.events.append({"detail": f"created {label}"})
        return {"pid": repo_backend_pid(), "same": tx is not None}

    @app.post("/async/{label}")
    async def async_route(label: str):
        # Route async : le repo bloquant tourne ici dans la boucle (comme un appel direct).
        repo_insert(label)
        tx_connection().events.append({"detail": f"created {label}"})
        return {"pid": repo_backend_pid()}

    @app.post("/boom/{label}")
    def boom(label: str):
        repo_insert(label)
        raise RuntimeError("panne de route")

    @app.post("/http-error/{label}")
    def http_error(label: str):
        repo_insert(label)
        raise HTTPException(status_code=409, detail="conflit")

    @app.post("/repo-fails/{label}")
    def repo_fails(label: str):
        repo_insert(label, fail=True)

    @app.post("/multi/{label}")
    def multi(label: str):
        repo_insert(f"{label}-a")
        repo_insert(f"{label}-b")
        tx_connection().events.append({"detail": f"multi {label}"})
        return {"count": repo_count()}

    @app.post("/mid-rollback/{label}")
    def mid_rollback(label: str):
        repo_insert(f"{label}-avant")
        try:
            repo_insert(f"{label}-casse", fail=True)
        except Exception:
            pass  # la route continue malgré l'échec du second repo
        repo_insert(f"{label}-apres")
        tx_connection().events.append({"detail": f"mid {label}"})
        return {"count": repo_count()}

    @app.post("/swallow/{label}")
    def swallow(label: str):
        repo_insert(f"{label}-avant")
        repo_insert_swallow(label)
        repo_insert(f"{label}-apres")  # sans savepoint : transaction avortée ou annulée
        return {"ok": True}

    @app.post("/marker")
    def marker():
        route_marker.set("posé par la route")
        return {"ok": True}

    @app.post("/background/{label}")
    def background(label: str, tasks: BackgroundTasks):
        repo_insert(f"{label}-route")
        tx_connection().events.append({"detail": "bg"})

        def later():
            # Après la réponse : le middleware a déjà validé et fermé la transaction.
            repo_insert(f"{label}-tache")

        tasks.add_task(later)
        return {"ok": True}

    @app.post("/stream/{label}")
    def stream(label: str):
        repo_insert(f"{label}-route")
        tx_connection().events.append({"detail": "stream"})

        def gen():
            yield b"debut;"
            repo_insert(f"{label}-flux")  # écrit pendant l'envoi du corps
            yield b"fin"

        return StreamingResponse(gen())

    @app.post("/slow/{label}")
    async def slow(label: str):
        repo_insert(label)
        tx_connection().events.append({"detail": "slow"})
        await asyncio.sleep(0.5)
        return {"ok": True}

    @app.post("/rendezvous")
    def rendezvous():
        """Deux requêtes simultanées s'attendent : prouve le vrai parallélisme."""
        pid = repo_backend_pid()
        barrier.wait(timeout=10)
        tx_connection().events.append({"detail": "rv"})
        return {"pid": pid, "conn_id": id(tx_connection()._real)}

    @app.get("/read")
    def read():
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT count(*) FROM spike_item")
            return {
                "tx": tx_connection() is not None,
                "wrapped": isinstance(conn, TxConnection),
                "used_in_pool": len(db._pool._used),
                "count": cur.fetchone()[0],
            }
        finally:
            release_connection(conn)

    return app
