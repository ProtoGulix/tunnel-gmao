import logging
import threading
import time
from typing import Dict, Set

from fastapi import Request

from api.db import get_connection, release_connection
from api.endpoints_catalog import endpoint_code
from api.errors.exceptions import ForbiddenError, UnauthorizedError
from api.settings import settings

logger = logging.getLogger(__name__)


def _load_matrix_from_db() -> Dict[str, frozenset]:
    """Lit la matrice role_code → endpoints autorisés. Lève en cas d'échec."""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT tr.code AS role_code, te.code AS endpoint_code
                FROM tunnel_permission tp
                JOIN tunnel_role     tr ON tr.id = tp.role_id
                JOIN tunnel_endpoint te ON te.id = tp.endpoint_id
                WHERE tp.allowed = true
                """
            )
            rows = cur.fetchall()
    finally:
        if conn:
            release_connection(conn)
    matrix: Dict[str, Set[str]] = {}
    for role_code, code in rows:
        matrix.setdefault(role_code, set()).add(code)
    return {role: frozenset(codes) for role, codes in matrix.items()}


class PermissionCache:
    """
    Cache mémoire de la matrice role_code → {endpoint_code}.

    Rechargé périodiquement (TTL) pour que chaque worker voie les changements de
    l'admin (ADR 0007). Thread-safe : la matrice est remplacée d'un bloc, un seul
    thread recharge à la fois. Si un rechargement échoue, la dernière matrice
    connue est conservée ; une matrice jamais chargée refuse tout (pas de fail-open).
    """

    # Délai avant nouvelle tentative tant qu'aucune matrice n'a pu être chargée.
    _RETRY_UNLOADED_SECONDS = 5.0

    def __init__(self, ttl_seconds=None, clock=time.monotonic, loader=_load_matrix_from_db):
        self._ttl = ttl_seconds
        self._clock = clock
        self._loader = loader
        self._matrix: Dict[str, frozenset] = {}
        self._loaded = False
        self._next_refresh = 0.0
        self._lock = threading.Lock()

    @property
    def ttl_seconds(self) -> float:
        return settings.PERMISSION_CACHE_TTL_SECONDS if self._ttl is None else self._ttl

    def _refresh(self) -> bool:
        """Recharge (verrou tenu). Renvoie True si la matrice a été remplacée."""
        try:
            matrix = self._loader()
        except Exception as e:
            logger.error("Impossible de recharger PermissionCache : %s", e)
            delay = self.ttl_seconds
            if not self._loaded:
                delay = min(delay, self._RETRY_UNLOADED_SECONDS)
            self._next_refresh = self._clock() + delay
            return False
        self._matrix = matrix
        self._loaded = True
        self._next_refresh = self._clock() + self.ttl_seconds
        logger.info("PermissionCache chargé : %d rôles", len(matrix))
        return True

    def _ensure_fresh(self) -> None:
        if self._clock() < self._next_refresh:
            return
        with self._lock:
            # Un autre thread a pu recharger pendant l'attente du verrou.
            if self._clock() < self._next_refresh:
                return
            self._refresh()

    def load(self) -> bool:
        """Charge maintenant. Ne lève jamais ; garde l'ancienne matrice en cas d'échec."""
        with self._lock:
            return self._refresh()

    def reload(self) -> None:
        self.load()

    def check(self, role_code: str, endpoint_code: str) -> bool:
        self._ensure_fresh()
        return endpoint_code in self._matrix.get(role_code, frozenset())

    def permissions_for_role(self, role_code: str) -> list[str]:
        self._ensure_fresh()
        return sorted(self._matrix.get(role_code, frozenset()))


permission_cache = PermissionCache()


# --- Dépendances FastAPI ---


def _is_authenticated(request: Request) -> bool:
    """Retourne True si la requête est authentifiée par JWT (user_id) ou clé API (api_key_id)."""
    return bool(getattr(request.state, "user_id", None)) or bool(
        getattr(request.state, "api_key_id", None)
    )


def require_authenticated(request: Request) -> str | None:
    """
    Vérifie que la requête est authentifiée (JWT ou clé API).
    Retourne user_id (None pour les clés API — pas d'utilisateur associé).
    """
    if not _is_authenticated(request):
        raise UnauthorizedError("Authentification requise")
    return getattr(request.state, "user_id", None)


def require_role(*roles: str):
    """
    Dépendance FastAPI : restreint l'accès aux rôles listés.
    Accepte JWT et clés API (le rôle est porté par les deux).

    Usage : Depends(require_role("RESP", "ADMIN"))
    """

    def _check(request: Request) -> str | None:
        if not _is_authenticated(request):
            raise UnauthorizedError("Authentification requise")
        role = getattr(request.state, "role", None)
        if role not in roles:
            raise ForbiddenError(f"Rôle requis : {', '.join(roles)}")
        return getattr(request.state, "user_id", None)

    return _check


def require_permission(endpoint_code: str):
    """
    Dépendance FastAPI : vérifie qu'un endpoint_code est autorisé pour le rôle.
    Accepte JWT et clés API.

    Usage : Depends(require_permission("interventions:create"))
    """

    def _check(request: Request) -> str | None:
        if not _is_authenticated(request):
            raise UnauthorizedError("Authentification requise")
        role = getattr(request.state, "role", None)
        if not permission_cache.check(role, endpoint_code):
            raise ForbiddenError(f"Permission refusée : {endpoint_code}")
        return getattr(request.state, "user_id", None)

    return _check


def check_permission(role_code: str, endpoint_code: str) -> bool:
    return permission_cache.check(role_code, endpoint_code)


def reload_permissions() -> None:
    permission_cache.reload()


# --- Contrôle global de la matrice (ADR 0007) ---

# Routes personnelles : ouvertes à tout utilisateur authentifié, hors matrice.
# Chacune ne touche que les données de l'utilisateur courant (identifié par son jeton)
# ou sert à ouvrir/fermer sa session ; aucune ne donne accès aux données métier.
# Clé : (méthode, chemin tel que déclaré dans la route, avec ses paramètres {…}).
PERSONAL_ROUTES: frozenset[tuple[str, str]] = frozenset(
    {
        # Session : fin de session et profil de session (login/refresh sont publics).
        ("POST", "/auth/logout"),
        ("GET", "/auth/me"),
        # Profil de l'utilisateur courant.
        ("GET", "/users/me"),
        ("PATCH", "/users/me/profile"),
        ("POST", "/users/me/password"),
        # Nouveautés vues par l'utilisateur courant.
        ("GET", "/users/me/changelog"),
        ("PATCH", "/users/me/changelog-seen"),
        # Notifications de l'utilisateur courant.
        ("GET", "/notifications"),
        ("GET", "/notifications/unread-count"),
        ("PATCH", "/notifications/read-all"),
        ("PATCH", "/notifications/{notification_id}/read"),
        # Page d'accueil de l'utilisateur courant.
        ("GET", "/home-view/me"),
    }
)


def is_personal_route(method: str, route_path: str) -> bool:
    return (method.upper(), route_path) in PERSONAL_ROUTES


def enforce_permission_matrix(request: Request) -> None:
    """
    Dépendance globale (FastAPI(dependencies=[...])) : applique tunnel_permission.

    - requête non authentifiée (route publique, AUTH_DISABLED) : non contrôlée ;
    - ADMIN : toujours autorisé (ne peut pas se bloquer hors de l'écran des permissions) ;
    - route personnelle : autorisée à tout utilisateur authentifié ;
    - sinon : le code d'endpoint doit être accordé au rôle dans la matrice. Un code
      inconnu du catalogue, une route introuvable ou un rôle absent sont refusés.
    Fonction synchrone : FastAPI l'exécute dans un thread, le rechargement du cache
    (accès base) ne bloque donc pas la boucle d'événements.
    """
    if request.method == "OPTIONS" or not _is_authenticated(request):
        return
    role = getattr(request.state, "role", None)
    if role == "ADMIN":
        return
    route = request.scope.get("route")
    if route is None or not hasattr(route, "path") or not getattr(route, "methods", None):
        # Route inconnue : ne pas deviner un code, refuser.
        raise ForbiddenError("Accès refusé")
    if is_personal_route(request.method, route.path):
        return
    code = endpoint_code(route, request.method)
    if not role or not permission_cache.check(role, code):
        logger.warning("Accès refusé par la matrice : role=%s endpoint=%s", role, code)
        raise ForbiddenError("Accès refusé")
