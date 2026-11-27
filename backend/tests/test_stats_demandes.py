"""Bilan des demandes à qualifier (ADB-01, ADR 0046) : route, tranches, semaines, droits."""

from datetime import date

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from api.app import app as real_app
from api.endpoints_catalog import endpoint_code
from api.errors.handlers import register_error_handlers
from api.limiter import limiter
from api.stats import routes as stats_routes
from api.stats.demandes_repo import DemandesStatsRepository, bucket_ages, week_starts
from api.stats.schemas import DemandesResponse
from db.default_permissions import Endpoint, default_allowed

CODE = "stats:get_demandes"
ENDPOINT = Endpoint(CODE, "GET", "/stats/demandes", "stats")


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


def test_tranches_aux_bornes():
    ages = [0, 6, 7, 29, 30, 89, 90, 259]
    par_code = {b["code"]: b for b in bucket_ages(ages)}
    assert [par_code[c]["count"] for c in ("lt_7", "7_30", "30_90", "gt_90")] == [2, 2, 2, 2]
    assert (par_code["7_30"]["min_days"], par_code["7_30"]["max_days"]) == (7, 29)
    assert (par_code["gt_90"]["min_days"], par_code["gt_90"]["max_days"]) == (90, 259)
    assert par_code["gt_90"]["to_days"] is None and par_code["lt_7"]["from_days"] == 0


def test_tranche_vide():
    vide = bucket_ages([])
    assert all(b["count"] == 0 and b["min_days"] is None for b in vide)


def test_semaines_en_lundis():
    starts = week_starts(date(2026, 11, 27), 3)  # vendredi
    assert starts == [date(2026, 11, 9), date(2026, 11, 16), date(2026, 11, 23)]
    assert all(d.weekday() == 0 for d in starts)


def test_route_transmet_weeks_et_site(client, monkeypatch):
    appels = []

    def faux(self, weeks, site_id=None):
        appels.append((weeks, site_id))
        return {
            "weeks": weeks,
            "flow": [],
            "trend": 0,
            "stock": 0,
            "age_buckets": [],
            "sites": [],
            "equipments": [],
            "journal_gaps": 0,
        }

    monkeypatch.setattr(DemandesStatsRepository, "get_demandes", faux)
    assert client.get("/stats/demandes").status_code == 200
    assert client.get("/stats/demandes", params={"weeks": 12, "site_id": "x"}).status_code == 200
    assert appels == [(8, None), (12, "x")]


def test_weeks_hors_bornes_en_400(client, monkeypatch):
    def jamais(*a, **k):
        raise AssertionError("le dépôt ne doit pas être appelé")

    monkeypatch.setattr(DemandesStatsRepository, "get_demandes", jamais)
    for weeks in (0, 53, -1):
        assert client.get("/stats/demandes", params={"weeks": weeks}).status_code == 400


def test_schema_sans_donnee_par_personne():
    cles = set()
    for modele in (DemandesResponse, *(m for m in _modeles(DemandesResponse))):
        cles |= set(modele.model_fields)
    for cle in cles:
        assert not any(m in cle for m in ("author", "created_by", "tech", "user", "demandeur")), cle


def _modeles(modele):
    for f in modele.model_fields.values():
        for a in getattr(f.annotation, "__args__", ()):
            if hasattr(a, "model_fields"):
                yield a


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


def test_tendance_du_stock_stable_sous_trois_demandes():
    from api.stats.trends import compute_request_stock_trend

    # Données de dev du 2026-11-27 : 56 → 58 en 8 semaines, écart estimé sous 1
    assert compute_request_stock_trend([56, 56, 56, 55, 55, 55, 56, 58]) == "stable"
    assert compute_request_stock_trend([10, 12, 14, 16]) == "up"
    assert compute_request_stock_trend([20, 16, 12, 8]) == "down"
    assert compute_request_stock_trend([5, 6]) is None
