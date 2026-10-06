"""POST /audit/log est réservé à RESP et ADMIN (audit 2026-10-06, constat F)."""

import pytest

from api.audits import routes as audit_routes
from tests.helpers import make_client

ENTITE = "33333333-3333-3333-3333-333333333333"
CORPS = {
    "entity_type": "intervention",
    "entity_id": ENTITE,
    "decision_type": "status_changed",
    "reason_code": "ROUTINE",
}


class _FauxAuditRepo:
    """Remplace AuditRepository : aucune base n'est touchée."""

    def call_fn_audit_log_decision(self, **kwargs):
        return "44444444-4444-4444-4444-444444444444"


@pytest.fixture(autouse=True)
def _faux_repo(monkeypatch):
    monkeypatch.setattr(audit_routes, "AuditRepository", _FauxAuditRepo)


@pytest.mark.parametrize("role", ["TECH", "ACHETEUR", "MCP"])
def test_les_autres_roles_ne_peuvent_pas_creer_un_log(role):
    client = make_client(audit_routes.router, role=role)
    assert client.post("/audit/log", json=CORPS).status_code == 403


@pytest.mark.parametrize("role", ["RESP", "ADMIN"])
def test_resp_et_admin_peuvent_creer_un_log(role):
    client = make_client(audit_routes.router, role=role)
    reponse = client.post("/audit/log", json=CORPS)
    assert reponse.status_code == 201, reponse.text
