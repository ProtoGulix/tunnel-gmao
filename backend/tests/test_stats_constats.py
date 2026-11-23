"""Indicateurs des constats (DIR-01, ADR 0044) : route, schéma et droits."""

from datetime import date

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from api.app import app as real_app
from api.endpoints_catalog import endpoint_code
from api.errors.handlers import register_error_handlers
from api.limiter import limiter
from api.stats import routes as stats_routes
from api.stats.constats_repo import ConstatsStatsRepository
from api.stats.schemas import ConstatsResponse
from db.default_permissions import Endpoint, default_allowed

CODE = "stats:get_constats"
ENDPOINT = Endpoint(CODE, "GET", "/stats/constats", "stats")


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(limiter, "enabled", False)
    app = FastAPI()
    app.state.limiter = limiter

    @app.middleware("http")
    async def _faux_auth(request: Request, call_next):
        request.state.user_id = "u1"
        request.state.role = "TECH"
        return await call_next(request)

    register_error_handlers(app)
    app.include_router(stats_routes.router)
    return TestClient(app)


def _reponse(start, end):
    return {
        "period": {"start_date": start, "end_date": end},
        "total": 0,
        "by_month": [],
        "levers": [],
        "signals": [],
        "known_since": [],
        "outcomes": [],
    }


def test_route_transmet_la_periode(client, monkeypatch):
    appels = []

    def faux(self, start, end):
        appels.append((start, end))
        return _reponse(start, end)

    monkeypatch.setattr(ConstatsStatsRepository, "get_constats", faux)
    r = client.get("/stats/constats", params={"start_date": "2026-01-01", "end_date": "2026-03-31"})
    assert r.status_code == 200, r.text
    assert appels == [(date(2026, 1, 1), date(2026, 3, 31))]
    assert r.json()["period"] == {"start_date": "2026-01-01", "end_date": "2026-03-31"}


def test_route_periode_invalide_en_400_sans_appeler_le_depot(client, monkeypatch):
    def jamais(*a, **k):
        raise AssertionError("le dépôt ne doit pas être appelé")

    monkeypatch.setattr(ConstatsStatsRepository, "get_constats", jamais)
    for params in (
        {"start_date": "2026-02-01", "end_date": "2026-01-01"},
        {"start_date": "2010-01-01", "end_date": "2026-01-01"},
    ):
        assert client.get("/stats/constats", params=params).status_code == 400


def test_schema_sans_auteur_ni_technicien():
    cles = set(ConstatsResponse.model_fields)
    for modele in (
        ConstatsResponse,
        *(
            a
            for f in ConstatsResponse.model_fields.values()
            for a in getattr(f.annotation, "__args__", ())
        ),
    ):
        cles |= set(getattr(modele, "model_fields", {}))
    for cle in cles:
        assert not any(m in cle for m in ("author", "created_by", "tech", "user")), cle


def test_code_de_droit_au_catalogue_et_matrice_par_defaut():
    codes = [
        endpoint_code(r, m)
        for r in real_app.routes
        if hasattr(r, "methods") and hasattr(r, "path")
        for m in r.methods
    ]
    assert CODE in codes
    for role in ("ADMIN", "RESP", "TECH", "ACHETEUR", "MCP"):
        assert default_allowed(role, ENDPOINT), role
