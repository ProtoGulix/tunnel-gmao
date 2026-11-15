"""
Pool de connexions PostgreSQL (psycopg2 ThreadedConnectionPool).

Usage dans les repos :
    from api.db import get_connection

    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(...)
    finally:
        release_connection(conn)
"""

import contextvars
import logging
import time
from contextlib import contextmanager
from urllib.parse import urlparse

import psycopg2
from psycopg2 import pool
from psycopg2.extras import register_uuid

from api.errors.exceptions import DatabaseError

# Enable native UUID adaptation for all connections
register_uuid()


logger = logging.getLogger(__name__)

_pool: pool.ThreadedConnectionPool | None = None


def init_pool(
    database_url: str,
    minconn: int = 2,
    maxconn: int = 10,
    retries: int = 20,
    retry_delay: float = 5.0,
) -> None:
    """Initialise le pool au démarrage de l'application.

    Réessaie jusqu'à `retries` fois avec un délai de `retry_delay` secondes
    entre chaque tentative, afin de tolérer un démarrage tardif de PostgreSQL.
    """
    global _pool
    parsed = urlparse(database_url)
    conn_kwargs = dict(
        minconn=minconn,
        maxconn=maxconn,
        host=parsed.hostname,
        port=parsed.port or 5432,
        user=parsed.username,
        password=parsed.password,
        dbname=parsed.path.lstrip("/"),
        connect_timeout=5,
        options="-c statement_timeout=30000",  # 30s max par requête
    )
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            _pool = pool.ThreadedConnectionPool(**conn_kwargs)
            logger.info("Pool DB initialisé (%d-%d connexions)", minconn, maxconn)
            return
        except psycopg2.OperationalError as e:
            last_error = e
            logger.warning(
                "Tentative %d/%d : PostgreSQL indisponible, nouvel essai dans %.0fs — %s",
                attempt,
                retries,
                retry_delay,
                e,
            )
            if attempt < retries:
                time.sleep(retry_delay)
    logger.error("Impossible d'initialiser le pool DB après %d tentatives", retries)
    raise DatabaseError(f"Connexion PostgreSQL impossible : {last_error}") from last_error


class RequestConnection:
    """Connexion de l'unité de travail d'une requête qui modifie (ADR 0018, point 1).

    Enveloppe la vraie connexion empruntée par le middleware de transaction : les repos
    la reçoivent de get_connection() sans le savoir. commit() ne valide rien et
    release_connection() ne rend rien : seul le middleware valide ou annule, à la fin de
    la requête. rollback() annule réellement (la suite de la requête repart d'une
    transaction saine) mais marque la requête en échec : le middleware annulera alors
    tout, même si la route a avalé l'exception et répond 2xx (ADR 0018, point 1 bis).
    """

    def __init__(self, real: psycopg2.extensions.connection):
        self._real = real
        self.failed = False
        self.closed = False

    def __getattr__(self, name):
        # Délègue cursor(), info, status... à la vraie connexion.
        return getattr(self._real, name)

    def commit(self) -> None:
        """Sans effet : la validation appartient au middleware de transaction."""

    def rollback(self) -> None:
        self.failed = True
        self._real.rollback()

    @property
    def real(self) -> psycopg2.extensions.connection:
        return self._real

    def is_healthy(self) -> bool:
        """Vrai si la requête peut être validée : aucun rollback() et transaction saine."""
        if self.failed:
            return False
        # psycopg2 ne lève rien sur un COMMIT d'une transaction en erreur : il annule en
        # silence. On refuse donc de valider une transaction en erreur ou une connexion cassée.
        return self._real.info.transaction_status in (
            psycopg2.extensions.TRANSACTION_STATUS_IDLE,
            psycopg2.extensions.TRANSACTION_STATUS_INTRANS,
        )


# Connexion de la requête en cours, posée par le middleware de transaction. Hors requête
# qui modifie (GET, scripts, démarrage, tests de repo), elle reste vide : comportement inchangé.
_request_connection: contextvars.ContextVar[RequestConnection | None] = contextvars.ContextVar(
    "request_connection", default=None
)


def open_request_connection() -> RequestConnection:
    """Emprunte une vraie connexion du pool pour une requête qui modifie (bloquant)."""
    return RequestConnection(_borrow())


def bind_request_connection(conn: RequestConnection) -> contextvars.Token:
    """Rend la connexion visible de get_connection() dans le contexte courant."""
    return _request_connection.set(conn)


def unbind_request_connection(token: contextvars.Token) -> None:
    _request_connection.reset(token)


def close_request_connection(conn: RequestConnection, commit: bool) -> None:
    """Valide ou annule, puis rend la vraie connexion au pool (bloquant).

    Marque la connexion fermée : une tâche de fond démarrée après la validation hérite du
    ContextVar mais ne reçoit plus cette connexion, elle emprunte la sienne.
    """
    conn.closed = True
    try:
        if commit:
            conn.real.commit()
        else:
            conn.real.rollback()
    finally:
        release_connection(conn.real)


def _borrow() -> psycopg2.extensions.connection:
    if _pool is None:
        raise DatabaseError("Pool DB non initialisé")
    try:
        conn = _pool.getconn()
        conn.autocommit = False
        return conn
    except pool.PoolError as e:
        raise DatabaseError(f"Pool saturé ou indisponible : {e}") from e


def get_connection():
    """Connexion de la requête en cours si elle existe, sinon emprunte une connexion du pool."""
    current = _request_connection.get()
    if current is not None and not current.closed:
        return current
    return _borrow()


def release_connection(conn) -> None:
    """Restitue la connexion au pool (même en cas d'erreur). Sans effet sur celle d'une requête."""
    if isinstance(conn, RequestConnection):
        return
    if _pool is None or conn is None:
        return
    try:
        if conn.status == psycopg2.extensions.STATUS_IN_TRANSACTION:
            conn.rollback()
        _pool.putconn(conn)
    except Exception:
        # En dernier recours, ferme la connexion
        try:
            conn.close()
        except Exception:
            pass


@contextmanager
def db_connection():
    """
    Context manager pour utilisation avec `with` :

        with db_connection() as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(...)
            conn.commit()
    """
    conn = get_connection()
    try:
        yield conn
    except Exception:
        conn.rollback()
        raise
    finally:
        release_connection(conn)


def close_pool() -> None:
    """Ferme toutes les connexions du pool (arrêt de l'application)."""
    global _pool
    if _pool:
        _pool.closeall()
        _pool = None
        logger.info("Pool DB fermé")


def check_connection() -> str:
    """Vérifie que le pool fonctionne. Retourne 'connected' ou message d'erreur."""
    try:
        with db_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT 1")
        return "connected"
    except Exception as e:
        return f"error: {type(e).__name__}"
