"""Tableau de bord d'un équipement et filtres de GET /interventions (TDB-01) : unités."""

from datetime import date

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from api.endpoints_catalog import endpoint_code
from api.equipements import routes as eq_routes
from api.equipements.repo import EquipementRepository
from api.equipements.validators import month_keys, resolve_dashboard_period
from api.errors.exceptions import NotFoundError
from api.errors.handlers import register_error_handlers
from api.interventions.repo import InterventionRepository
from api.limiter import limiter
from db.default_permissions import Endpoint, default_allowed

EQ = "11111111-1111-1111-1111-111111111111"
CODE = "equipements:get_equipement_dashboard"
ENDPOINT = Endpoint(CODE, "GET", "/equipements/{equipement_id}/dashboard", "equipements")


# --- Période ---


def test_periode_par_defaut_douze_mois_calendaires_mois_courant_inclus():
    assert resolve_dashboard_period(None, None, today=date(2026, 11, 16)) == (
        date(2025, 12, 1),
        date(2026, 11, 16),
    )
    # Passage d'année : janvier remonte à février de l'année précédente.
    assert resolve_dashboard_period(None, None, today=date(2026, 1, 5))[0] == date(2025, 2, 1)


def test_periode_par_defaut_depuis_une_fin_donnee():
    start, end = resolve_dashboard_period(None, date(2024, 3, 31))
    assert (start, end) == (date(2023, 4, 1), date(2024, 3, 31))


def test_periode_inversee_ou_trop_longue_refusee():
    from api.errors.exceptions import ValidationError

    with pytest.raises(ValidationError):
        resolve_dashboard_period(date(2026, 2, 1), date(2026, 1, 1))
    with pytest.raises(ValidationError):
        resolve_dashboard_period(date(2010, 1, 1), date(2026, 1, 1))
    # Même jour et dix ans pile : acceptés.
    assert resolve_dashboard_period(date(2026, 1, 1), date(2026, 1, 1))
    assert resolve_dashboard_period(date(2016, 1, 1), date(2026, 1, 1))


def test_tous_les_mois_de_la_periode_meme_vides():
    assert month_keys(date(2025, 11, 20), date(2026, 2, 1)) == [
        "2025-11",
        "2025-12",
        "2026-01",
        "2026-02",
    ]
    assert month_keys(date(2026, 3, 1), date(2026, 3, 31)) == ["2026-03"]


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
    app.include_router(eq_routes.router)
    return TestClient(app)


def _vide(start, end):
    return {
        "period": {"start": start, "end": end},
        "scope": {"equipement_id": EQ, "include_descendants": False, "equipement_count": 1},
        "kpis": {
            "interventions_reported": 0,
            "interventions_closed": 0,
            "interventions_open_now": 0,
            "time_spent_hours": 0.0,
            "actions_count": 0,
            "avg_complexity": None,
            "avg_close_delay_days": None,
        },
        "monthly": [],
        "by_type": [],
        "by_action_category": [],
        "by_complexity_factor": [],
    }


def test_route_transmet_periode_et_perimetre_au_depot(client, monkeypatch):
    appels = []

    def faux(self, equipement_id, start, end, include_descendants=False):
        appels.append((equipement_id, start, end, include_descendants))
        return _vide(start, end)

    monkeypatch.setattr(EquipementRepository, "get_dashboard", faux)
    r = client.get(
        f"/equipements/{EQ}/dashboard",
        params={
            "start_date": "2026-01-01",
            "end_date": "2026-03-31",
            "include_descendants": "true",
        },
    )
    assert r.status_code == 200, r.text
    assert appels == [(EQ, date(2026, 1, 1), date(2026, 3, 31), True)]
    assert r.json()["data"]["kpis"]["avg_complexity"] is None


def test_route_defauts_include_descendants_faux(client, monkeypatch):
    appels = []

    def faux(self, equipement_id, start, end, include_descendants=False):
        appels.append((start <= end, include_descendants))
        return _vide(start, end)

    monkeypatch.setattr(EquipementRepository, "get_dashboard", faux)
    assert client.get(f"/equipements/{EQ}/dashboard").status_code == 200
    assert appels == [(True, False)]


def test_route_periode_inversee_ou_trop_longue_en_400(client, monkeypatch):
    def jamais(*a, **k):
        raise AssertionError("le dépôt ne doit pas être appelé")

    monkeypatch.setattr(EquipementRepository, "get_dashboard", jamais)
    for params in (
        {"start_date": "2026-02-01", "end_date": "2026-01-01"},
        {"start_date": "2010-01-01", "end_date": "2026-01-01"},
    ):
        assert client.get(f"/equipements/{EQ}/dashboard", params=params).status_code == 400


def test_route_equipement_inconnu_en_404_sans_message_brut(client, monkeypatch):
    def inconnu(*a, **k):
        raise NotFoundError("Équipement introuvable")

    monkeypatch.setattr(EquipementRepository, "get_dashboard", inconnu)
    r = client.get(f"/equipements/{EQ}/dashboard")
    assert r.status_code == 404
    assert "psycopg2" not in r.text and "SELECT" not in r.text


# --- Droits ---


def test_code_de_droit_au_catalogue_et_matrice_par_defaut():
    from api.app import app

    codes = [
        endpoint_code(r, m)
        for r in app.routes
        if hasattr(r, "methods") and hasattr(r, "path")
        for m in r.methods
    ]
    assert CODE in codes
    for role in ("ADMIN", "RESP", "TECH", "ACHETEUR", "MCP"):
        assert default_allowed(role, ENDPOINT), role


# --- Filtres de GET /interventions ---


def test_filtre_type_inter_valide_et_invalide(monkeypatch):
    from api.errors.exceptions import ValidationError
    from api.interventions import types as types_module

    # Les types viennent de la base : on simule le référentiel.
    monkeypatch.setattr(
        types_module,
        "list_types",
        lambda include_inactive=False: [{"id": c, "is_active": True} for c in ("CUR", "PRE")],
    )

    clauses, params = InterventionRepository._type_and_date_filters(["CUR", "PRE"], None, None)
    assert params == ["CUR", "PRE"] and "i.type_inter IN (%s,%s)" in clauses
    with pytest.raises(ValidationError):
        InterventionRepository._type_and_date_filters(["CUR", "XXX"], None, None)
    assert InterventionRepository._type_and_date_filters(None, None, None) == ([], [])


def test_filtre_dates_bornes_incluses_et_inversion_refusee():
    from api.errors.exceptions import ValidationError

    clauses, params = InterventionRepository._type_and_date_filters(
        None, date(2026, 1, 1), date(2026, 1, 31)
    )
    assert clauses == ["i.reported_date >= %s", "i.reported_date <= %s"]
    assert params == [date(2026, 1, 1), date(2026, 1, 31)]
    with pytest.raises(ValidationError):
        InterventionRepository._type_and_date_filters(None, date(2026, 2, 1), date(2026, 1, 1))


def test_route_interventions_sans_nouveaux_parametres_inchangee(monkeypatch):
    from api.interventions import routes as int_routes

    vus = {}

    def get_all(self, **kw):
        vus.update(kw)
        return []

    monkeypatch.setattr(InterventionRepository, "get_all", get_all)
    monkeypatch.setattr(InterventionRepository, "count_all", lambda self, **kw: 0)
    # Le gabarit d'audit lit la base : hors sujet ici.
    monkeypatch.setattr(int_routes, "paginated", lambda items, **kw: {"data": items})
    app = FastAPI()

    @app.middleware("http")
    async def _faux_auth(request: Request, call_next):
        request.state.user_id = "u1"
        request.state.role = "TECH"
        return await call_next(request)

    register_error_handlers(app)
    app.include_router(int_routes.router)
    c = TestClient(app)
    assert c.get("/interventions").status_code == 200
    assert vus["printed"] is False
    assert (vus["types"], vus["reported_from"], vus["reported_to"]) == (None, None, None)
    c.get("/interventions", params={"type_inter": "CUR, PRE", "reported_from": "2026-01-01"})
    assert vus["types"] == ["CUR", "PRE"] and vus["reported_from"] == date(2026, 1, 1)
    # Historique d'un équipement : archivées comprises, prioritaire sur printed
    c.get("/interventions", params={"include_printed": "true", "printed": "false"})
    assert vus["printed"] is None
