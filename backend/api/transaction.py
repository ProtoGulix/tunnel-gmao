"""Middleware de transaction par requête (ADR 0018, points 1, 1 bis, 1 quater, 1 quinquies).

Pour une requête POST, PUT, PATCH ou DELETE, il emprunte une connexion, la rend visible
de api.db.get_connection() (ContextVar), puis en fin de requête valide tout (mutation et
audit) ou annule tout. La validation exige : réponse < 400, aucun rollback() de repo et
transaction saine. Une requête qui répondait 2xx mais ne peut pas être validée reçoit
une erreur 500 : jamais de succès affiché pour une écriture perdue.

Ordre dans la pile (de l'extérieur vers la route) :
  CORS → JWT → droits → transaction → audit → route

Pourquoi un middleware ASGI pur et non un BaseHTTPMiddleware : avec plusieurs
BaseHTTPMiddleware empilés (l'audit est sous la transaction), le corps de la réponse et les
BackgroundTasks de la route partent sans attendre le retour du middleware extérieur
(vérifié avec Starlette 0.35.1 : la tâche de fond s'exécutait avant la validation et héritait
de la connexion). Ici la décision est prise au moment où la route envoie l'en-tête de la
réponse (http.response.start) : à ce stade la route et l'écriture d'audit sont terminées, et
rien d'autre (corps, tâches de fond) ne part avant la validation. Le statut décide : < 400 et
transaction saine, on valide ; sinon on annule (et une réponse 2xx devient une erreur 500).

Tâches de fond : elles démarrent donc après la validation. Elles héritent du ContextVar mais
la connexion est marquée fermée : get_connection() leur en donne une propre du pool. Si la
requête est annulée après un 2xx, la suite de la route est interrompue (les tâches de fond
ne partent pas).
"""

from __future__ import annotations

import logging

import anyio
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse

from api.db import (
    bind_request_connection,
    close_request_connection,
    open_request_connection,
    unbind_request_connection,
)

logger = logging.getLogger(__name__)

_MUTATING_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})

# Exception déclarée (ADR 0018, point 1 quinquies) : l'authentification écrit sa trace
# (tentatives, jetons révoqués) puis répond 4xx ; cette trace doit survivre à la réponse.
# Elle est tenue dans security_log, hors audit_log.
_EXCLUDED_PATHS = frozenset({"/auth/login", "/auth/refresh", "/auth/logout"})

# Exclusions TEMPORAIRES (AUDC-15), distinctes des exclusions permanentes ci-dessus : une route
# y tolérerait un succès partiel avec ses propres connexions. La liste est vide depuis AUDC-25
# (import CSV : tout ou rien) ; le mécanisme reste, un test fige son contenu : toute entrée
# ajoutée est refusée.
_TEMPORARY_EXCLUSIONS: frozenset = frozenset()


class _RequestAborted(Exception):
    """Levée dans send() après l'envoi de l'erreur 500 : interrompt la suite de la route."""


def _internal_error() -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Une erreur interne s'est produite",
            "error_type": "InternalServerError",
        },
    )


class TransactionMiddleware:
    """Ouvre l'unité de travail des requêtes qui modifient, puis valide ou annule."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if (
            scope["type"] != "http"
            or scope["method"] not in _MUTATING_METHODS
            or scope["path"] in _EXCLUDED_PATHS
            or (scope["method"], scope["path"]) in _TEMPORARY_EXCLUSIONS
        ):
            await self.app(scope, receive, send)
            return

        # psycopg2 est bloquant : emprunt, validation et annulation passent par le threadpool.
        conn = await run_in_threadpool(open_request_connection)
        token = bind_request_connection(conn)
        decided = False
        aborted = False

        async def guarded_send(message):
            nonlocal decided, aborted
            if message["type"] == "http.response.start" and not decided:
                decided = True
                if not await _decide(conn, scope, message["status"]):
                    aborted = True
                    await _internal_error()(scope, receive, send)
                    raise _RequestAborted()
            await send(message)

        try:
            await self.app(scope, receive, guarded_send)
        except BaseException:
            # Le groupe de tâches d'un BaseHTTPMiddleware peut envelopper _RequestAborted.
            if not aborted:
                raise
        finally:
            unbind_request_connection(token)
            if not decided:
                # Exception de route, ou aucune réponse : tout est annulé.
                # Bouclier : sous une annulation anyio (déconnexion, arrêt), le rollback et le
                # retour au pool doivent quand même avoir lieu, sinon la connexion est perdue.
                with anyio.CancelScope(shield=True):
                    await run_in_threadpool(close_request_connection, conn, False)


async def _decide(conn, scope, status: int) -> bool:
    """Valide ou annule la transaction. Retourne False si la réponse doit devenir une 500."""
    if status >= 400:
        await run_in_threadpool(close_request_connection, conn, False)
        return True
    if not conn.is_healthy():
        logger.error(
            "Transaction annulée sur %s %s : réponse %s mais transaction en échec "
            "(rollback() de repo ou erreur SQL avalée)",
            scope["method"],
            scope["path"],
            status,
        )
        await run_in_threadpool(close_request_connection, conn, False)
        return False
    try:
        await run_in_threadpool(close_request_connection, conn, True)
    except Exception:
        logger.exception("Échec de la validation de la transaction de requête")
        return False
    return True
