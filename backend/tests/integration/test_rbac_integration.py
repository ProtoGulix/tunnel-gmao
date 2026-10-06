"""Autorisation par rôle avec le vrai JWTMiddleware (ADR 0005) et clé d'API MCP."""

import secrets
from uuid import uuid4

import pytest

pytestmark = pytest.mark.integration


def _new_user_body(role="TECH"):
    suffix = secrets.token_hex(4)
    return {
        "email": f"cible-{suffix}@example.org",
        "password": f"Pw-{secrets.token_hex(8)}",
        "first_name": "Cible",
        "initial": suffix[:3].upper(),
        "role_code": role,
    }


def _ecritures(cible_id):
    """Les six écritures sur /admin/users, avec des corps valides."""
    return [
        ("POST", "/admin/users", _new_user_body()),
        ("PUT", f"/admin/users/{cible_id}", {"first_name": "Renomme"}),
        ("PATCH", f"/admin/users/{cible_id}/role", {"role_code": "ACHETEUR"}),
        ("PATCH", f"/admin/users/{cible_id}/active", {"is_active": True}),
        ("POST", f"/admin/users/{cible_id}/reset-password", None),
        ("DELETE", f"/admin/users/{cible_id}", None),
    ]


def test_resp_refuse_sur_les_six_ecritures_admin_users(client, make_user, instance):
    resp_user = make_user("RESP")
    cible = make_user("TECH")
    for method, path, body in _ecritures(cible.id):
        r = client.request(method, path, headers=resp_user.headers, json=body)
        assert r.status_code == 403, f"{method} {path} : {r.status_code} {r.text}"
    # Rien n'a changé pour la cible.
    ligne = instance.sql(
        "SELECT r.code, u.is_active FROM tunnel_user u JOIN tunnel_role r ON r.id = u.role_id "
        "WHERE u.id = %s",
        (cible.id,),
    )
    assert ligne == [("TECH", True)]


def test_resp_ne_peut_pas_se_promouvoir_admin(client, make_user):
    resp_user = make_user("RESP")
    r = client.patch(
        f"/admin/users/{resp_user.id}/role", headers=resp_user.headers, json={"role_code": "ADMIN"}
    )
    assert r.status_code == 403


def test_admin_reussit_les_six_ecritures(client, admin, make_user):
    cible = make_user("TECH")
    for method, path, body in _ecritures(cible.id):
        r = client.request(method, path, headers=admin.headers, json=body)
        assert r.status_code in (200, 201), f"{method} {path} : {r.status_code} {r.text}"


def test_resp_lit_la_liste_des_utilisateurs(client, make_user):
    resp_user = make_user("RESP")
    r = client.get("/admin/users", headers=resp_user.headers)
    assert r.status_code == 200
    assert any(u["email"] == resp_user.email for u in r.json())


def test_tech_ne_lit_pas_la_liste_des_utilisateurs(client, make_user):
    tech = make_user("TECH")
    assert client.get("/admin/users", headers=tech.headers).status_code == 403


def _log_body():
    return {
        "entity_type": "intervention",
        "entity_id": str(uuid4()),
        "decision_type": "manual_note",
        "new_value": {"note": "test"},
        "reason_code": "OTHER",
        "reason_text": "test d'intégration",
    }


def test_audit_log_manuel_refuse_au_tech(client, make_user):
    tech = make_user("TECH")
    r = client.post("/audit/log", headers=tech.headers, json=_log_body())
    assert r.status_code == 403


def test_audit_log_manuel_accepte_pour_resp(client, make_user):
    resp_user = make_user("RESP")
    r = client.post("/audit/log", headers=resp_user.headers, json=_log_body())
    assert r.status_code == 201, r.text


@pytest.fixture
def cle_mcp(client, admin):
    r = client.post("/api-keys", headers=admin.headers, json={"name": f"it-{secrets.token_hex(3)}"})
    assert r.status_code == 201, r.text
    return {"X-API-Key": r.json()["secret"]}


def test_cle_mcp_peut_lire(client, cle_mcp):
    assert client.get("/suppliers", headers=cle_mcp).status_code == 200


def test_cle_invalide_refusee(client):
    assert client.get("/suppliers", headers={"X-API-Key": "gmao_inconnue"}).status_code == 401


@pytest.mark.xfail(
    strict=True,
    reason="RBAC étape 5 : la clé MCP doit être en lecture seule (CLAUDE.md 6.3), "
    "mais require_authenticated accepte la clé sur POST /suppliers",
)
def test_cle_mcp_ne_peut_pas_ecrire(client, cle_mcp):
    r = client.post("/suppliers", headers=cle_mcp, json={"name": "Fournisseur via MCP"})
    assert r.status_code == 403
