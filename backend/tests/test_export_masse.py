"""Export de masse des fiches fermées : validation, plafond, ZIP, PDF unique, droits (EXPM-01)."""

import io
import zipfile
from datetime import date

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from weasyprint.document import Document

from api.errors.handlers import register_error_handlers
from api.exports import routes as export_routes
from api.exports.repo import ExportRepository
from api.limiter import limiter
from db.default_permissions import Endpoint, default_allowed

URL = "/exports/interventions/closed"
PERIODE = {"date_from": "2026-01-01", "date_to": "2026-01-31", "format": "zip"}
BULK = Endpoint("exports:export_closed_interventions", "GET", URL, "exports")


def _fiche(code):
    """Données minimales au format de get_intervention_export_data."""
    return {
        "code": code,
        "title": f"Fiche {code}",
        "priority": "normale",
        "status_actual": "ferme",
        "reported_date": "2026-01-02",
        "reported_by": "Test",
        "type_inter": "CUR",
        "tech_initials": "TT",
        "tech_full_name": "Tech Test",
        "equipements": {"code": "EQ-1", "name": "Presse"},
        "request": None,
        "tasks": [],
        "actions": [],
        "status_logs": [],
        "purchase_requests": [],
        "stats": {
            "action_count": 0,
            "total_time": 0,
            "purchase_requests_count": 0,
            "task_total": 0,
            "task_done": 0,
            "task_skipped": 0,
        },
    }


@pytest.fixture
def depot(monkeypatch):
    """Faux dépôt : liste de codes configurable, enregistre les paramètres reçus."""
    etat = {"codes": ["INT-1", "INT-2"], "appels": []}

    def liste(self, date_from, date_to, equipement_id, limit):
        etat["appels"].append((date_from, date_to, equipement_id, limit))
        return [
            {"id": f"id-{i}", "code": c, "closed_at": None}
            for i, c in enumerate(etat["codes"][:limit])
        ]

    monkeypatch.setattr(ExportRepository, "list_closed_interventions", liste)
    monkeypatch.setattr(
        ExportRepository,
        "get_intervention_export_data",
        lambda self, iid: _fiche(etat["codes"][int(iid.split("-")[1])]),
    )
    return etat


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(limiter, "enabled", False)
    app = FastAPI()
    app.state.limiter = limiter

    @app.middleware("http")
    async def _faux_auth(request: Request, call_next):
        request.state.user_id = "u1"
        request.state.role = "RESP"
        return await call_next(request)

    register_error_handlers(app)
    app.include_router(export_routes.router)
    return TestClient(app)


# --- Droits (matrice par défaut) ---


def test_export_de_masse_ouvert_a_admin_et_resp_seulement():
    assert default_allowed("ADMIN", BULK)
    assert default_allowed("RESP", BULK)
    for role in ("TECH", "ACHETEUR", "MCP"):
        assert not default_allowed(role, BULK), role


def test_export_unitaire_reste_ouvert_en_lecture_a_tous():
    unitaire = Endpoint("x:y", "GET", "/exports/interventions/{intervention_id}/pdf", "exports")
    for role in ("RESP", "TECH", "ACHETEUR", "MCP"):
        assert default_allowed(role, unitaire), role


def test_la_route_est_declaree_avant_la_route_unitaire():
    chemins = [getattr(r, "path", "") for r in export_routes.router.routes]
    assert chemins.index("/exports/interventions/closed") < chemins.index(
        "/exports/interventions/{intervention_id}/pdf"
    )


# --- Validation ---


@pytest.mark.parametrize(
    "params",
    [
        {"date_from": "2026-02-01", "date_to": "2026-01-01", "format": "zip"},
        {"date_from": "pas-une-date", "date_to": "2026-01-01", "format": "zip"},
        {"date_from": "2026-01-01", "date_to": "2026-01-31", "format": "zip", "equipement_id": "x"},
    ],
)
def test_parametres_invalides_refuses_en_400(client, depot, params):
    assert client.get(URL, params=params).status_code == 400
    assert depot["appels"] == []


def test_dates_obligatoires_et_format_connu(client, depot):
    assert client.get(URL, params={"format": "zip"}).status_code in (400, 422)
    assert client.get(URL, params={**PERIODE, "format": "docx"}).status_code in (400, 422)
    assert depot["appels"] == []


def test_filtre_equipement_et_bornes_transmis(client, depot):
    eq = "11111111-1111-1111-1111-111111111111"
    r = client.get(URL, params={**PERIODE, "equipement_id": eq})
    assert r.status_code == 200
    assert depot["appels"][0] == (date(2026, 1, 1), date(2026, 1, 31), eq, 101)


# --- Plafond et liste vide ---


def test_plafond_refuse_explicitement_sans_troncature(client, depot):
    depot["codes"] = [f"I-{i}" for i in range(101)]
    r = client.get(URL, params=PERIODE)
    assert r.status_code == 400
    assert "réduisez" in str(r.json())


def test_aucune_fiche_donne_404(client, depot):
    depot["codes"] = []
    assert client.get(URL, params=PERIODE).status_code == 404


# --- Contenu ---


def test_zip_un_pdf_par_fiche_noms_assainis_et_uniques(client, depot):
    depot["codes"] = ["INT/1", "INT/1", "INT-3"]
    r = client.get(URL, params=PERIODE)
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/zip"
    assert r.headers["content-disposition"] == (
        'attachment; filename="fiches-fermees_2026-01-01_2026-01-31.zip"'
    )
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        assert z.namelist() == ["INT_1.pdf", "INT_1_2.pdf", "INT-3.pdf"]
        assert all(z.read(n).startswith(b"%PDF") for n in z.namelist())


def test_pdf_unique_avec_au_moins_une_page_par_fiche(client, depot, monkeypatch):
    # Les pages sont dans des flux compressés : on observe l'assemblage plutôt que le binaire.
    assemblees = []
    copie_d_origine = Document.copy

    def copie_espionne(self, pages="all"):
        assemblees.append(len(pages))
        return copie_d_origine(self, pages)

    monkeypatch.setattr(Document, "copy", copie_espionne)
    depot["codes"] = ["INT-1", "INT-2", "INT-3"]
    r = client.get(URL, params={**PERIODE, "format": "pdf"})
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.headers["content-disposition"] == (
        'inline; filename="fiches-fermees_2026-01-01_2026-01-31.pdf"'
    )
    assert r.content.startswith(b"%PDF")
    assert assemblees and assemblees[0] >= 3
