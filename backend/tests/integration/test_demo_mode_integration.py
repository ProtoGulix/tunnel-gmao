"""Mode démonstration avec les vrais middlewares (ADR 0036, DEMO-04)."""

import secrets

import pytest

from api.settings import settings

pytestmark = pytest.mark.integration


@pytest.fixture
def demo(monkeypatch):
    monkeypatch.setattr(settings, "DEMO_MODE", True)


def test_admin_verrouille_sur_les_comptes_et_la_securite(demo, client, admin, make_user):
    # make_user crée via l'API : à faire avant d'activer le mode ; ici on vise un id fictif.
    for method, path in [
        ("POST", "/admin/users"),
        ("PATCH", "/admin/users/00000000-0000-0000-0000-000000000000/role"),
        ("POST", "/admin/ip-blocklist"),
        ("POST", "/admin/email-domain-rules"),
        ("POST", "/api-keys"),
        ("PUT", "/home-view/admin/assignments/00000000-0000-0000-0000-000000000000"),
        ("PATCH", "/admin/permissions/00000000-0000-0000-0000-000000000000"),
    ]:
        r = client.request(method, path, headers=admin.headers, json={})
        assert r.status_code == 403, f"{method} {path} : {r.status_code} {r.text}"
        assert r.json()["code"] == "DEMO_MODE_LOCKED"


def test_mot_de_passe_verrouille_mais_lectures_et_connexion_permises(demo, instance, client, admin):
    r = client.post(
        "/users/me/password",
        headers=admin.headers,
        json={"current_password": admin.password, "new_password": "Autre-mdp-12345"},
    )
    assert r.status_code == 403 and r.json()["code"] == "DEMO_MODE_LOCKED"
    assert client.get("/admin/users", headers=admin.headers).status_code == 200
    assert client.get("/api-keys", headers=admin.headers).status_code == 200
    instance.sql("DELETE FROM auth_attempt")
    login = client.post("/auth/login", json={"email": admin.email, "password": admin.password})
    assert login.status_code == 200


def test_ecriture_metier_permise(demo, client, admin):
    code = f"DM{secrets.token_hex(3)}".upper()
    r = client.post("/stock-families", headers=admin.headers, json={"code": code, "label": "L"})
    assert r.status_code in (200, 201), r.text


def test_profil_partage_verrouille(demo, client, admin):
    r = client.patch("/users/me/profile", headers=admin.headers, json={"first_name": "Demo"})
    assert r.status_code == 403 and r.json()["code"] == "DEMO_MODE_LOCKED"
