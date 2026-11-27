"""Archivage à l'unité (FICHE-02) : droits, règle « fermée », refus de printed_fiche."""

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from api.errors.handlers import register_error_handlers
from api.exports.repo import ExportRepository
from api.interventions import routes as int_routes
from api.interventions.repo import InterventionRepository
from db.default_permissions import Endpoint, default_allowed

IID = "9b2f1c64-7c1a-4e1d-8f3a-1a2b3c4d5e6f"
URL = f"/interventions/{IID}/mark-printed"
MARK = Endpoint(
    "interventions:mark_intervention_printed",
    "POST",
    "/interventions/{intervention_id}/mark-printed",
    "interventions",
)


def test_archivage_unitaire_ouvert_a_admin_et_resp_seulement():
    assert default_allowed("ADMIN", MARK)
    assert default_allowed("RESP", MARK)
    for role in ("TECH", "ACHETEUR", "MCP"):
        assert not default_allowed(role, MARK), role


@pytest.fixture
def depot(monkeypatch):
    etat = {"status": "ferme", "marques": [], "retour": 1}
    monkeypatch.setattr(
        InterventionRepository,
        "get_by_id",
        lambda self, iid, include_actions=True: {"status_actual": etat["status"]},
    )

    def marque(self, ids):
        etat["marques"].append(list(ids))
        return etat["retour"]

    monkeypatch.setattr(ExportRepository, "mark_interventions_printed", marque)
    return etat


@pytest.fixture
def client():
    app = FastAPI()

    @app.middleware("http")
    async def _faux_auth(request: Request, call_next):
        request.state.user_id = "u1"
        request.state.role = "RESP"
        return await call_next(request)

    register_error_handlers(app)
    app.include_router(int_routes.router)
    return TestClient(app)


def test_intervention_fermee_marquee(client, depot):
    r = client.post(URL)
    assert r.status_code == 200, r.text
    assert r.json() == {"data": {"marked": 1}}
    assert depot["marques"] == [[IID]]


def test_deja_archivee_sans_effet(client, depot):
    depot["retour"] = 0
    assert client.post(URL).json() == {"data": {"marked": 0}}


@pytest.mark.parametrize("statut", ["ouvert", "en_cours", "en_attente"])
def test_intervention_non_fermee_refusee(client, depot, statut):
    depot["status"] = statut
    assert client.post(URL).status_code == 400
    assert depot["marques"] == []


@pytest.mark.parametrize("methode", ["post", "put"])
def test_printed_fiche_refuse_a_la_creation_et_a_la_mise_a_jour(client, depot, methode):
    corps = {"printed_fiche": True}
    if methode == "post":
        corps.update(machine_id=IID, type_inter="CUR", tech_id=IID, request_id=IID)
        r = client.post("/interventions", json=corps)
    else:
        r = client.put(f"/interventions/{IID}", json=corps)
    assert r.status_code == 400, r.text
    assert "mark-printed" in r.text
