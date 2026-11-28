"""Interventions bloquées (ADT-03, ADR 0047) : route, notes système, droits, seuil."""

import os
import subprocess
import sys

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from api.app import app as real_app
from api.endpoints_catalog import endpoint_code
from api.errors.handlers import register_error_handlers
from api.limiter import limiter
from api.stats import routes as stats_routes
from api.stats.blocages_repo import (
    PURCHASE_COUNTERS,
    SYSTEM_NOTES,
    BlocagesStatsRepository,
    clean_note,
)
from api.stats.schemas import BlocagesResponse
from db.default_permissions import Endpoint, default_allowed

_ENV = {k: v for k, v in os.environ.items() if k != "BLOCKED_ALERT_DAYS"}
CODE = "stats:get_blocages"
ENDPOINT = Endpoint(CODE, "GET", "/stats/blocages", "stats")


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


def test_notes_systeme_ecartees():
    for note in SYSTEM_NOTES:
        assert clean_note(note) is None
    assert clean_note(None) is None and clean_note("  ") is None
    assert clean_note(" Atelier arrêté ") == "Atelier arrêté"


def test_les_notes_systeme_sont_celles_des_declencheurs():
    schema = open("db/schema.sql", encoding="utf-8").read()
    for note in SYSTEM_NOTES:
        assert f"'{note}'" in schema


def test_compteurs_alignes_sur_la_liste_des_interventions():
    source = open("api/interventions/repo.py", encoding="utf-8").read()
    for key, status in PURCHASE_COUNTERS:
        assert f"derived_status = '{status}'" in source and f"AS pr_{key}" in source


def test_route_transmet_le_site(client, monkeypatch):
    appels = []

    def faux(self, site_id=None):
        appels.append(site_id)
        return {"threshold_days": 7, "parts": [], "production": []}

    monkeypatch.setattr(BlocagesStatsRepository, "get_blocages", faux)
    assert client.get("/stats/blocages").json() == {
        "threshold_days": 7,
        "parts": [],
        "production": [],
    }
    assert client.get("/stats/blocages", params={"site_id": "x"}).status_code == 200
    assert appels == [None, "x"]


def test_schema_sans_donnee_par_personne():
    textes = str(BlocagesResponse.model_json_schema())
    for mot in ("author", "created_by", "tech", "user", "changed_by"):
        assert mot not in textes, mot


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


def test_seuil_par_defaut_et_refus_sous_1():
    """Import dans un process neuf : le rechargement du module casserait les autres tests."""
    code = "import api.settings as s; print(s.settings.BLOCKED_ALERT_DAYS)"
    ok = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, env=_ENV)
    assert ok.returncode == 0 and ok.stdout.strip() == "7", ok.stderr
    bad = subprocess.run(
        [sys.executable, "-c", code],
        capture_output=True,
        text=True,
        env={**_ENV, "BLOCKED_ALERT_DAYS": "0"},
    )
    assert bad.returncode == 1
