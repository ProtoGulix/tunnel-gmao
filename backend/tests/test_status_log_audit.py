"""POST /intervention-status-log trace l'auteur réel dans audit_log (ADR 0005, point 3)."""

from uuid import UUID

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from api.audits import middleware as audit_middleware
from api.errors.handlers import register_error_handlers
from api.intervention_status_log import routes as status_routes

TOKEN_USER = "11111111-1111-1111-1111-111111111111"
AUTRE_TECH = "55555555-5555-5555-5555-555555555555"
INTERVENTION = "66666666-6666-6666-6666-666666666666"

# Corps tel que l'envoie web.tunnel-mobile : pas de reason_code.
CORPS_MOBILE = {
    "intervention_id": INTERVENTION,
    "status_from": "ouvert",
    "status_to": "en_cours",
    "technician_id": AUTRE_TECH,
    "date": "2026-10-06T10:00:00",
}


def _sortie_log():
    return {
        "id": "77777777-7777-7777-7777-777777777777",
        "intervention_id": INTERVENTION,
        "status_from": "ouvert",
        "status_to": "en_cours",
        "technician_id": AUTRE_TECH,
        "date": "2026-10-06T10:00:00",
    }


class _FauxStatusRepo:
    """Remplace InterventionStatusLogRepository : aucune base n'est touchée."""

    def add(self, data):
        return _sortie_log()


@pytest.fixture
def appels(monkeypatch):
    """Capture les appels à fn_audit_log_decision et neutralise base et règles."""
    captures = []

    class _FauxAuditRepo:
        def call_fn_audit_log_decision(self, **kwargs):
            captures.append(kwargs)

    monkeypatch.setattr(status_routes, "InterventionStatusLogRepository", _FauxStatusRepo)
    monkeypatch.setattr(audit_middleware, "AuditRepository", _FauxAuditRepo)
    # Le motif routinier et l'état de la ligne viennent de la base : neutralisés ici.
    monkeypatch.setattr(
        "api.utils.audit.resolve_reason_code",
        lambda entity_type, fields: {"default_reason_code": "ROUTINE"},
    )
    monkeypatch.setattr(audit_middleware, "_fetch_entity_state", lambda table, entity_id: {})
    return captures


def make_client(router, user_id, role):
    """Mini-app avec l'AuditMiddleware réel : c'est lui qui écrit désormais l'audit (ADR 0018)."""
    app = FastAPI()
    app.add_middleware(audit_middleware.AuditMiddleware)

    @app.middleware("http")
    async def _fake_auth(request: Request, call_next):
        request.state.user_id = user_id
        request.state.role = role
        request.state.api_key_id = None
        return await call_next(request)

    register_error_handlers(app)
    app.include_router(router)
    return TestClient(app, raise_server_exceptions=False)


def test_l_auteur_trace_est_celui_du_jeton_pas_technician_id(appels):
    client = make_client(status_routes.router, user_id=TOKEN_USER, role="TECH")
    reponse = client.post("/intervention-status-log", json=CORPS_MOBILE)
    assert reponse.status_code == 201, reponse.text
    assert len(appels) == 1
    appel = appels[0]
    assert appel["changed_by"] == UUID(TOKEN_USER)
    assert appel["changed_by"] != UUID(AUTRE_TECH)
    assert appel["entity_type"] == "intervention"
    assert appel["entity_id"] == UUID(INTERVENTION)
    assert appel["reason_code"] == "ROUTINE"
    assert appel["is_system"] is False
    assert appel["old_value"] == {"status": "ouvert"}
    assert appel["new_value"] == {"status": "en_cours"}


def test_une_panne_de_l_audit_fait_echouer_la_requete(monkeypatch, appels):
    """ADR 0018 : l'audit est garanti, sa panne n'est plus avalée (inverse l'ancienne
    règle de l'ADR 0017) ; la transaction de requête annule alors l'écriture."""

    class _AuditEnPanne:
        def call_fn_audit_log_decision(self, **kwargs):
            raise RuntimeError("audit indisponible")

    monkeypatch.setattr(audit_middleware, "AuditRepository", _AuditEnPanne)
    client = make_client(status_routes.router, user_id=TOKEN_USER, role="TECH")
    assert client.post("/intervention-status-log", json=CORPS_MOBILE).status_code == 500
