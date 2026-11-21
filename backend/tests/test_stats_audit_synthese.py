"""Synthèse de l'audit (SYN-01, ADR 0032) : unités, route et droits, sans base."""

from datetime import date

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from api.app import app as real_app
from api.endpoints_catalog import endpoint_code
from api.errors.handlers import register_error_handlers
from api.limiter import limiter
from api.stats import audit_synthese_repo as repo_module
from api.stats import routes as stats_routes
from api.stats.audit_synthese_repo import AuditSyntheseRepository, _finish, _share, _sum_months
from api.stats.schemas import AuditSyntheseResponse
from db.default_permissions import Endpoint, default_allowed

CODE = "stats:get_audit_synthese"
ENDPOINT = Endpoint(CODE, "GET", "/stats/audit-synthese", "stats")


def test_part_null_sans_denominateur_et_zero_reel():
    assert _share(1, 3) == 33.3
    assert _share(0, 4) == 0.0
    assert _share(0, 0) is None


def test_totaux_recalcules_sur_les_compteurs():
    a = repo_module._empty_month("2035-01")
    a.update(tasks_done_with_guarantor=1, spotted_in_field=1)
    b = repo_module._empty_month("2035-02")
    b.update(tasks_done_with_guarantor=3, spotted_in_field=0)
    total = _finish(_sum_months([a, b]))
    assert total["spotted_in_field_share"] == 25.0  # 1 sur 4, pas la moyenne de 100 % et 0 %
    assert total["system_share"] is None


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
    compteurs = {k: v for k, v in vide.items() if k != "month"}
    return {
        "period": {"start": start, "end": end},
        "cascades_traced_from": date(2026, 11, 20),
        "monthly": [{"month": "2026-01", "incomplete_data": True, **compteurs}],
        "totals": compteurs,
        "decisions": [],
    }


def test_route_defaut_trois_mois_calendaires(client, monkeypatch):
    vus = []

    def faux(self, start, end):
        vus.append((start, end))
        return _reponse(start, end)

    monkeypatch.setattr(AuditSyntheseRepository, "get_synthese", faux)
    assert client.get("/stats/audit-synthese").status_code == 200
    assert client.get("/stats/audit-synthese", params={"months": 1}).status_code == 200
    (start3, end3), (start1, _) = vus
    assert end3 == date.today() and start3.day == 1
    assert (end3.year * 12 + end3.month) - (start3.year * 12 + start3.month) == 2
    assert start1 == date.today().replace(day=1)


def test_route_months_hors_bornes_en_400(client, monkeypatch):
    def jamais(*a, **k):
        raise AssertionError("le dépôt ne doit pas être appelé")

    monkeypatch.setattr(AuditSyntheseRepository, "get_synthese", jamais)
    for months in (0, -3, 121):
        assert client.get("/stats/audit-synthese", params={"months": months}).status_code == 400


_MOTS_INTERDITS = ("tech_id", "tech_initials", "technician", "initial", "name", "nom", "user")


def _cles(schema, vu=None):
    vu = set() if vu is None else vu
    for nom, champ in schema.model_fields.items():
        vu.add(nom)
        for t in (champ.annotation, *getattr(champ.annotation, "__args__", ())):
            if hasattr(t, "model_fields"):
                _cles(t, vu)
    return vu


def test_schema_sans_cle_identifiant_ou_nom_de_personne():
    cles = _cles(AuditSyntheseResponse)
    assert "monthly" in cles and "shared_tasks" in cles
    for cle in cles:
        assert not any(mot in cle.lower() for mot in _MOTS_INTERDITS), cle


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


def _serie(champ, valeurs):
    return [{champ: v} for v in valeurs]


def test_tendance_decisions_stable_sous_deux_decisions():
    from api.stats.trends import compute_audit_trends

    # variation estimée 1 décision (pente 0,5 x 2 intervalles) : stable ; 4 : hausse
    assert compute_audit_trends(_serie("decisions_total", [3, 3, 4]))["decisions_total"] == "stable"
    assert compute_audit_trends(_serie("decisions_total", [3, 5, 7]))["decisions_total"] == "up"
    assert compute_audit_trends(_serie("decisions_total", [7, 5, 3]))["decisions_total"] == "down"


def test_tendance_part_seuil_deux_points_et_part_nulle_ignoree():
    from api.stats.trends import compute_audit_trends

    assert compute_audit_trends(_serie("system_share", [40.0, 40.5, 41.0]))["system_share"] == (
        "stable"
    )
    assert compute_audit_trends(_serie("system_share", [40.0, 42.0, 45.0]))["system_share"] == "up"
    # parts nulles ignorées : deux valeurs seulement, pas de tendance
    assert compute_audit_trends(_serie("system_share", [None, 10.0, 50.0]))["system_share"] is None
    # une part nulle au milieu est ignorée, les trois autres comptent
    quatre = _serie("system_share", [50.0, None, 30.0, 10.0])
    assert compute_audit_trends(quatre)["system_share"] == "down"


def test_tendances_toutes_cles_presentes_et_nulles_sans_assez_de_mois():
    from api.stats.trends import compute_audit_trends

    t = compute_audit_trends([{"decisions_total": 1}])
    assert set(t) == {
        "without_guarantor_share",
        "done_without_guarantor_action_share",
        "spotted_in_field_share",
        "shared_tasks_share",
        "system_share",
        "decisions_total",
    }
    assert all(v is None for v in t.values())
