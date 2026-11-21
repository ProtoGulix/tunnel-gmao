"""Contrôle des droits avant les middlewares de transaction et d'audit (ADR 0018, point 2).

La matrice de permissions (ADR 0007) est aussi appliquée par la dépendance globale
enforce_permission_matrix, mais celle-ci s'exécute dans la route, après le middleware
d'audit : un rôle sans droit qui omet le motif recevait un 400 au lieu d'un 403. Ce
middleware refuse plus tôt, avec la même règle (check_matrix) ; la dépendance reste en
place comme seconde barrière.
"""

from __future__ import annotations

from fastapi import Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.routing import Match

from api.auth.demo_mode import DEMO_LOCKED_MESSAGE, DEMO_MODE_LOCKED, is_demo_locked
from api.auth.permissions import check_matrix
from api.errors.exceptions import ForbiddenError


def _match_route(request: Request):
    """Route qui correspond complètement à la requête (méthode comprise), ou None."""
    for route in request.app.router.routes:
        match, _child_scope = route.matches(request.scope)
        if match == Match.FULL:
            return route
    return None


class PermissionMiddleware(BaseHTTPMiddleware):
    """Applique la matrice de permissions avant la validation du motif d'audit."""

    async def dispatch(self, request: Request, call_next):
        route = _match_route(request)
        if route is None:
            # Route inconnue ou méthode non permise : le routeur répondra 404/405.
            return await call_next(request)
        try:
            # check_matrix peut recharger le cache depuis la base (bloquant).
            await run_in_threadpool(check_matrix, request, route)
        except ForbiddenError as exc:
            return JSONResponse(
                status_code=403,
                content={"detail": exc.detail, "error_type": "ForbiddenError"},
            )
        if is_demo_locked(request.method, request.url.path):
            return JSONResponse(
                status_code=403,
                content={
                    "detail": DEMO_LOCKED_MESSAGE,
                    "error_type": "ForbiddenError",
                    "code": DEMO_MODE_LOCKED,
                },
            )
        return await call_next(request)
