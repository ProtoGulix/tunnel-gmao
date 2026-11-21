"""Mode démonstration (ADR 0036, DEMO-04) : verrous d'écriture et coupure des courriels."""

import asyncio
import subprocess
import sys

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.auth import permission_middleware
from api.auth.demo_mode import DEMO_LOCKED_PREFIXES, DEMO_MODE_LOCKED, is_demo_locked
from api.mail import service
from api.settings import settings

# Une écriture par famille de routes verrouillées.
FAMILLES = [
    ("POST", "/users/me/password"),
    ("POST", "/admin/users"),
    ("PUT", "/admin/users/abc"),
    ("PATCH", "/admin/users/abc/role"),
    ("DELETE", "/admin/users/abc"),
    ("PATCH", "/admin/permissions/abc"),
    ("PATCH", "/admin/endpoints/abc"),
    ("POST", "/api-keys"),
    ("PATCH", "/api-keys/abc"),
    ("DELETE", "/api-keys/abc"),
    ("PUT", "/home-view/admin/assignments/abc"),
    ("DELETE", "/home-view/admin/assignments/abc"),
    ("POST", "/admin/ip-blocklist"),
    ("DELETE", "/admin/ip-blocklist/abc"),
    ("POST", "/admin/email-domain-rules"),
    ("DELETE", "/admin/email-domain-rules/abc"),
    ("PATCH", "/users/me/profile"),
    ("POST", "/admin/settings/mail/test"),
]
LECTURES = [
    "/admin/users",
    "/admin/permissions",
    "/api-keys",
    "/home-view/admin/assignments",
    "/admin/ip-blocklist",
    "/admin/email-domain-rules",
]
PERMIS = [
    ("POST", "/auth/login"),
    ("POST", "/auth/refresh"),
    ("POST", "/auth/logout"),
    ("POST", "/intervention-requests"),
    ("POST", "/admin/audit-reasons"),
]


@pytest.fixture
def demo(monkeypatch):
    monkeypatch.setattr(settings, "DEMO_MODE", True)


@pytest.fixture
def client(monkeypatch):
    """Mini-application avec le vrai PermissionMiddleware (matrice neutralisée)."""
    monkeypatch.setattr(permission_middleware, "check_matrix", lambda request, route: None)
    app = FastAPI()
    app.add_middleware(permission_middleware.PermissionMiddleware)

    def _ok():
        return {"ok": True}

    chemins = {p for _, p in FAMILLES + PERMIS} | set(LECTURES)
    for chemin in sorted(chemins):
        app.add_api_route(chemin, _ok, methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    for chemin in ("/admin/users/{x}", "/admin/permissions/{x}", "/admin/endpoints/{x}"):
        app.add_api_route(chemin, _ok, methods=["PUT", "PATCH", "DELETE"])
    for chemin in ("/api-keys/{x}", "/admin/ip-blocklist/{x}", "/admin/email-domain-rules/{x}"):
        app.add_api_route(chemin, _ok, methods=["PATCH", "DELETE"])
    app.add_api_route("/admin/users/{x}/role", _ok, methods=["PATCH"])
    app.add_api_route("/home-view/admin/assignments/{x}", _ok, methods=["PUT", "DELETE"])
    return TestClient(app)


def test_inactif_par_defaut_sans_la_valeur_true():
    code = (
        "import os; os.environ['API_ENV']='test'; "
        "os.environ['JWT_SECRET_KEY']='cle-de-test-uniquement-pour-pytest-0123456789'; "
        "os.environ['DATABASE_URL']='postgresql://t:t@127.0.0.1:1/x'; "
        "os.environ['DEMO_MODE']='{}'; from api.settings import settings; print(settings.DEMO_MODE)"
    )
    for valeur, attendu in [("", "False"), ("1", "False"), ("false", "False"), ("true", "True")]:
        sortie = subprocess.run(
            [sys.executable, "-c", code.format(valeur)], capture_output=True, text=True, check=True
        ).stdout.strip()
        assert sortie == attendu, valeur


@pytest.mark.parametrize("method,path", FAMILLES)
def test_inactif_aucune_ecriture_verrouillee(client, method, path):
    assert client.request(method, path).status_code == 200


@pytest.mark.parametrize("method,path", FAMILLES)
def test_actif_ecriture_verrouillee_403_avec_code(demo, client, method, path):
    r = client.request(method, path)
    assert r.status_code == 403
    assert r.json()["code"] == DEMO_MODE_LOCKED
    assert r.json()["detail"] == "Action désactivée sur la démonstration"


@pytest.mark.parametrize("path", LECTURES)
def test_actif_lecture_des_routes_verrouillees_permise(demo, client, path):
    assert client.get(path).status_code == 200


@pytest.mark.parametrize("method,path", PERMIS)
def test_actif_connexion_et_ecritures_metier_permises(demo, client, method, path):
    assert client.request(method, path).status_code == 200


def test_prefixe_sur_segment_entier():
    settings.DEMO_MODE = True
    try:
        assert is_demo_locked("POST", "/admin/users/")
        assert not is_demo_locked("POST", "/admin/users-export")
        assert not is_demo_locked("POST", "/api-keysfoo")
        assert all(p.startswith("/") for p in DEMO_LOCKED_PREFIXES)
    finally:
        settings.DEMO_MODE = False


def test_actif_aucun_courriel_meme_avec_mail_enabled(demo, monkeypatch):
    monkeypatch.setattr(settings, "MAIL_ENABLED", True)
    # Si l'envoi n'était pas coupé, l'import d'aiosmtplib ou la connexion serait tenté.
    appels = []
    monkeypatch.setitem(sys.modules, "aiosmtplib", type("M", (), {"send": appels.append}))
    asyncio.run(service.send_mail("a@example.org", "sujet", "corps"))
    assert appels == []


def test_inactif_le_courriel_part_avec_mail_enabled(monkeypatch):
    monkeypatch.setattr(settings, "MAIL_ENABLED", True)
    appels = []

    async def _send(msg, **kwargs):
        appels.append(msg)

    monkeypatch.setitem(sys.modules, "aiosmtplib", type("M", (), {"send": staticmethod(_send)}))
    asyncio.run(service.send_mail("a@example.org", "sujet", "corps"))
    assert len(appels) == 1
