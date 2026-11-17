"""Indicateurs d'organisation de l'équipe (ORG-01, ADR 0021) : unités et route."""

from datetime import date

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from api.app import app as real_app
from api.endpoints_catalog import endpoint_code
from api.errors.handlers import register_error_handlers
from api.limiter import limiter
from api.stats import organisation_repo as repo_module
from api.stats import routes as stats_routes
from api.stats.organisation_repo import OrganisationRepository, _finish, _share, _sum_months
from api.stats.schemas import OrganisationResponse
from db.default_permissions import Endpoint, default_allowed

CODE = "stats:get_organisation"
ENDPOINT = Endpoint(CODE, "GET", "/stats/organisation", "stats")


# --- Parts et moyennes ---


def test_part_arrondie_a_une_decimale_et_null_sans_denominateur():
    assert _share(1, 3) == 33.3
    assert _share(2, 3) == 66.7
    assert _share(0, 5) == 0.0  # un vrai zéro reste 0
    assert _share(0, 0) is None  # jamais 0 à la place d'une absence de donnée


def test_mois_vide_donne_des_parts_null_et_des_heures_a_zero():
    mois = _finish(repo_module._empty_month("2034-02"))
    assert mois["urgent_share"] is None and mois["interrupted_share"] is None
    assert mois["avg_interventions_per_tech_day"] is None and mois["scattered_days_share"] is None
    assert mois["hours"] == {"CUR": 0.0, "PRE": 0.0, "PRO": 0.0, "other": 0.0, "total": 0.0}
    assert "sum_interventions" not in mois and "scattered_days" not in mois


def test_totaux_recalcules_sur_les_compteurs_et_non_moyennes_de_parts():
    a = repo_module._empty_month("2034-01")
    a.update(interventions_reported=1, urgent_count=1, tech_days=1, sum_interventions=3)
    a.update(scattered_days=1)
    a["hours"]["CUR"] = 1.005
    b = repo_module._empty_month("2034-02")
    b.update(interventions_reported=3, urgent_count=0, tech_days=3, sum_interventions=3)
    total = _finish(_sum_months([a, b]))
    assert "month" not in total
    assert total["urgent_share"] == 25.0  # 1 sur 4, pas la moyenne de 100 % et 0 %
    assert total["avg_interventions_per_tech_day"] == 1.5
    assert total["scattered_days_share"] == 25.0
    assert total["hours"]["total"] == 1.0


# --- Route ---


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
    vide = _finish(repo_module._empty_month("x"))
    mois = {k: v for k, v in vide.items() if k != "month"}
    return {
        "period": {"start": start, "end": end},
        "monthly": [{"month": "2026-01", **mois}],
        "totals": mois,
        "projects": {"count": 0},
        "preventive": {
            "active_plans": 0,
            "occurrences_not_started": 0,
            "pending_requests": 0,
        },
        "waiting_parts": {"count": 0},
    }


def test_route_transmet_la_periode_et_la_renvoie(client, monkeypatch):
    appels = []

    def faux(self, start, end, today=None):
        appels.append((start, end))
        return _reponse(start, end)

    monkeypatch.setattr(OrganisationRepository, "get_organisation", faux)
    r = client.get(
        "/stats/organisation", params={"start_date": "2026-01-01", "end_date": "2026-03-31"}
    )
    assert r.status_code == 200, r.text
    assert appels == [(date(2026, 1, 1), date(2026, 3, 31))]
    assert r.json()["totals"]["urgent_share"] is None


def test_route_defaut_douze_mois_calendaires(client, monkeypatch):
    vus = []

    def faux(self, start, end, today=None):
        vus.append((start, end))
        return _reponse(start, end)

    monkeypatch.setattr(OrganisationRepository, "get_organisation", faux)
    assert client.get("/stats/organisation").status_code == 200
    start, end = vus[0]
    assert start.day == 1 and end == date.today() and start < end


def test_route_periode_inversee_ou_trop_longue_en_400(client, monkeypatch):
    def jamais(*a, **k):
        raise AssertionError("le dépôt ne doit pas être appelé")

    monkeypatch.setattr(OrganisationRepository, "get_organisation", jamais)
    for params in (
        {"start_date": "2026-02-01", "end_date": "2026-01-01"},
        {"start_date": "2010-01-01", "end_date": "2026-01-01"},
    ):
        assert client.get("/stats/organisation", params=params).status_code == 400


# --- ADR 0021, point 2 : aucune donnée par technicien ---

_MOTS_INTERDITS = ("tech_id", "tech_initials", "technician", "initial", "name", "nom", "user")


def _cles(schema, vu=None):
    """Toutes les clés déclarées par un modèle Pydantic, sous-modèles compris."""
    vu = set() if vu is None else vu
    for nom, champ in schema.model_fields.items():
        vu.add(nom)
        for t in (champ.annotation, *getattr(champ.annotation, "__args__", ())):
            if hasattr(t, "model_fields"):
                _cles(t, vu)
    return vu


def test_schema_sans_cle_identifiant_ou_nom_de_technicien():
    cles = _cles(OrganisationResponse)
    assert "monthly" in cles and "tech_days" in cles
    for cle in cles:
        assert not any(mot in cle.lower() for mot in _MOTS_INTERDITS), cle


# --- Droits ---


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
