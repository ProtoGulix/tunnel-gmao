"""Contrôle de la matrice tunnel_permission à chaque requête (ADR 0007), sans base."""

import pytest
from fastapi import Depends, FastAPI, Request
from fastapi.testclient import TestClient

from api.auth import permissions as perms
from api.auth.permissions import PERSONAL_ROUTES, PermissionCache, enforce_permission_matrix
from api.endpoints_catalog import endpoint_code, sync_catalog
from api.errors.handlers import register_error_handlers


class _FauxCurseur:
    def __init__(self, codes):
        self._codes = codes

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def execute(self, sql, params=None):
        if "INSERT INTO tunnel_endpoint" in sql:
            self._codes.append(params[0])

    def fetchone(self):
        return ("00000000-0000-0000-0000-000000000000",)


class _FausseConnexion:
    def __init__(self):
        self.codes = []

    def cursor(self):
        return _FauxCurseur(self.codes)

    def commit(self):
        pass


def test_codes_identiques_a_la_synchronisation_pour_toutes_les_routes():
    from api.app import app

    conn = _FausseConnexion()
    sync_catalog(app.routes, conn)
    attendus = []
    for route in app.routes:
        if hasattr(route, "methods") and hasattr(route, "path"):
            attendus += [endpoint_code(route, m) for m in route.methods or {"GET"}]
    assert conn.codes == attendus
    assert len(attendus) > 100


def test_format_du_code_est_inchange():
    from api.app import app

    codes = {}
    for route in app.routes:
        if getattr(route, "path", None) == "/suppliers" and route.methods:
            for m in route.methods:
                codes[m] = endpoint_code(route, m)
    assert codes["POST"] == "suppliers:create_supplier"
    assert codes["GET"] == "suppliers:list_suppliers"


def test_les_routes_personnelles_existent_dans_l_application():
    from api.app import app

    reelles = {
        (m, r.path) for r in app.routes if hasattr(r, "methods") for m in (r.methods or set())
    }
    assert PERSONAL_ROUTES <= reelles


# --- Mini-application avec la dépendance globale ---


@pytest.fixture
def fabrique_client(monkeypatch):
    def _client(role, matrice, auth=True, api_key=False):
        cache = PermissionCache(ttl_seconds=30, loader=lambda: matrice)
        monkeypatch.setattr(perms, "permission_cache", cache)
        app = FastAPI(dependencies=[Depends(enforce_permission_matrix)])

        @app.middleware("http")
        async def _faux_auth(request: Request, call_next):
            request.state.user_id = "u1" if auth and not api_key else None
            request.state.role = role if auth else None
            request.state.api_key_id = "k1" if api_key else None
            return await call_next(request)

        register_error_handlers(app)

        @app.post("/suppliers", tags=["suppliers"])
        def create_supplier():
            return {"ok": True}

        @app.get("/suppliers", tags=["suppliers"])
        def list_suppliers():
            return []

        @app.get("/users/me", tags=["users"])
        def get_current_user():
            return {"me": True}

        @app.get("/health")
        def health():
            return "ok"

        @app.get("/nouveau", tags=["nouveau"])
        def nouveau():
            return {}

        return TestClient(app, raise_server_exceptions=False)

    return _client


MATRICE = {
    "TECH": frozenset({"suppliers:list_suppliers"}),
    "MCP": frozenset({"suppliers:list_suppliers"}),
}


def test_admin_passe_meme_sans_permission_ni_catalogue(fabrique_client):
    client = fabrique_client("ADMIN", {})
    assert client.post("/suppliers").status_code == 200
    assert client.get("/nouveau").status_code == 200


def test_route_personnelle_passe_pour_tech(fabrique_client):
    client = fabrique_client("TECH", {})
    assert client.get("/users/me").status_code == 200


def test_tech_refuse_sur_endpoint_non_autorise(fabrique_client):
    client = fabrique_client("TECH", MATRICE)
    r = client.post("/suppliers")
    assert r.status_code == 403
    assert "suppliers" not in r.text  # message générique, ne révèle pas la matrice
    assert client.get("/suppliers").status_code == 200


def test_permission_accordee_laisse_passer(fabrique_client):
    client = fabrique_client("TECH", {"TECH": frozenset({"suppliers:create_supplier"})})
    assert client.post("/suppliers").status_code == 200


def test_code_inconnu_refuse(fabrique_client):
    client = fabrique_client("TECH", MATRICE)
    assert client.get("/nouveau").status_code == 403


def test_cle_api_mcp_controlee_comme_les_autres(fabrique_client):
    client = fabrique_client("MCP", MATRICE, api_key=True)
    assert client.get("/suppliers").status_code == 200
    assert client.post("/suppliers").status_code == 403


def test_route_publique_ou_non_authentifiee_non_controlee(fabrique_client):
    client = fabrique_client(None, {}, auth=False)
    assert client.get("/health").status_code == 200
    assert client.post("/suppliers").status_code == 200  # AUTH_DISABLED : pas de contrôle


def test_matrice_jamais_chargee_refuse_tout():
    def _echec():
        raise RuntimeError("base indisponible")

    cache = PermissionCache(ttl_seconds=30, loader=_echec)
    assert cache.check("TECH", "suppliers:list_suppliers") is False
    assert cache.permissions_for_role("TECH") == []


# --- Cache : TTL, horloge injectée ---


class _Horloge:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


def test_ttl_recharge_apres_expiration_seulement():
    horloge = _Horloge()
    appels = []

    def loader():
        appels.append(1)
        return {"TECH": frozenset({f"code{len(appels)}"})}

    cache = PermissionCache(ttl_seconds=30, clock=horloge, loader=loader)
    assert cache.check("TECH", "code1")
    horloge.t += 29
    assert cache.check("TECH", "code1")
    assert len(appels) == 1
    horloge.t += 2
    assert cache.check("TECH", "code2")
    assert not cache.check("TECH", "code1")
    assert len(appels) == 2


def test_echec_de_rechargement_garde_la_derniere_matrice():
    horloge = _Horloge()
    etat = {"ok": True}

    def loader():
        if not etat["ok"]:
            raise RuntimeError("panne")
        return {"TECH": frozenset({"a"})}

    cache = PermissionCache(ttl_seconds=30, clock=horloge, loader=loader)
    assert cache.check("TECH", "a")
    etat["ok"] = False
    horloge.t += 31
    assert cache.check("TECH", "a")  # panne : on garde l'ancienne matrice
    assert cache.load() is False


def test_ttl_par_defaut_vient_des_reglages(monkeypatch):
    monkeypatch.setattr(perms.settings, "PERMISSION_CACHE_TTL_SECONDS", 12.0)
    assert PermissionCache(loader=lambda: {}).ttl_seconds == 12.0
