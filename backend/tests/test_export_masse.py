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
        "priority": "normal",
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
    etat = {"codes": ["INT-1", "INT-2"], "appels": [], "include_printed": []}

    def liste(self, date_from, date_to, equipement_id, limit, include_printed=False):
        etat["appels"].append((date_from, date_to, equipement_id, limit))
        etat["include_printed"].append(include_printed)
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
        # Numérotés dans l'ordre de sortie, assainis et uniques.
        assert z.namelist() == ["001_INT_1.pdf", "002_INT_1_2.pdf", "003_INT-3.pdf"]
        assert all(z.read(n).startswith(b"%PDF") for n in z.namelist())


def test_imprimees_exclues_par_defaut_incluses_sur_demande(client, depot):
    assert client.get(URL, params=PERIODE).status_code == 200
    assert client.get(URL, params={**PERIODE, "include_printed": "true"}).status_code == 200
    assert depot["include_printed"] == [False, True]


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


# --- Marquage imprimées (IMPR-01) ---

MARK_URL = "/exports/interventions/closed/mark-printed"
MARK_BODY = {"date_from": "2026-01-01", "date_to": "2026-01-31"}
MARK = Endpoint("exports:mark_closed_interventions_printed", "POST", MARK_URL, "exports")


def test_marquage_ouvert_a_admin_et_resp_seulement():
    assert default_allowed("ADMIN", MARK)
    assert default_allowed("RESP", MARK)
    for role in ("TECH", "ACHETEUR", "MCP"):
        assert not default_allowed(role, MARK), role


@pytest.fixture
def marquage(monkeypatch, depot):
    """Enregistre les identifiants transmis au marquage ; 1 fiche déjà imprimée sur 2."""
    recu = []

    def marque(self, ids):
        recu.append(list(ids))
        return len(ids) - 1

    monkeypatch.setattr(ExportRepository, "mark_interventions_printed", marque)
    return recu


def test_marquage_utilise_la_selection_de_l_export(client, depot, marquage):
    r = client.post(
        MARK_URL, json={**MARK_BODY, "equipement_id": "9b2f1c64-7c1a-4e1d-8f3a-1a2b3c4d5e6f"}
    )
    assert r.status_code == 200, r.text
    assert r.json() == {"data": {"marked": 1, "total": 2}}
    assert marquage == [["id-0", "id-1"]]
    assert depot["appels"][0][2] == "9b2f1c64-7c1a-4e1d-8f3a-1a2b3c4d5e6f"
    assert depot["appels"][0][3] == export_routes.MAX_BULK_SHEETS + 1


@pytest.mark.parametrize(
    "body",
    [
        {"date_from": "2026-02-01", "date_to": "2026-01-01"},
        {"date_from": "pas-une-date", "date_to": "2026-01-01"},
        {**MARK_BODY, "equipement_id": "pas-un-uuid"},
    ],
)
def test_marquage_valide_comme_l_export(client, depot, marquage, body):
    assert client.post(MARK_URL, json=body).status_code == 400
    assert marquage == []


def test_marquage_plafond_et_aucune_fiche(client, depot, marquage):
    depot["codes"] = [f"INT-{i}" for i in range(export_routes.MAX_BULK_SHEETS + 1)]
    assert client.post(MARK_URL, json=MARK_BODY).status_code == 400
    depot["codes"] = []
    assert client.post(MARK_URL, json=MARK_BODY).status_code == 404
    assert marquage == []


# --- Audit du marquage (IMPR-01) ---


class _FakeCursor:
    """Curseur qui renvoie seulement les fiches « pas encore imprimées » (ici : 2 sur 3)."""

    def __init__(self, rows):
        self._rows = rows

    def execute(self, sql, params):
        self.sql = sql

    def fetchall(self):
        return self._rows


class _FakeConn:
    def __init__(self, rows):
        self._cur = _FakeCursor(rows)
        self.commits = 0

    def cursor(self):
        return self._cur

    def commit(self):
        self.commits += 1


def test_marquage_depose_un_evenement_par_fiche_reellement_marquee(monkeypatch):
    from uuid import uuid4

    from api.audits.events import AuditUnit, bind_audit_unit, unbind_audit_unit

    marquees = [(uuid4(), False), (uuid4(), None)]
    conn = _FakeConn(marquees)
    monkeypatch.setattr(ExportRepository, "_get_connection", lambda self: conn)
    monkeypatch.setattr("api.exports.repo.release_connection", lambda c: None)

    unit = AuditUnit()
    token = bind_audit_unit(unit)
    try:
        n = ExportRepository().mark_interventions_printed([str(uuid4()) for _ in range(3)])
    finally:
        unbind_audit_unit(token)

    assert n == 2
    # Un événement par fiche marquée, rien pour celle déjà imprimée (absente du RETURNING)
    assert [(e.entity_type, e.entity_id, e.decision_type) for e in unit.events] == [
        ("intervention", marquees[0][0], "printed_fiche_changed"),
        ("intervention", marquees[1][0], "printed_fiche_changed"),
    ]
    assert unit.events[0].old_value == {"printed_fiche": False}
    assert unit.events[0].new_value == {"printed_fiche": True}


def test_marquage_sans_fiche_ne_depose_rien(monkeypatch):
    from api.audits.events import AuditUnit, bind_audit_unit, unbind_audit_unit

    unit = AuditUnit()
    token = bind_audit_unit(unit)
    try:
        assert ExportRepository().mark_interventions_printed([]) == 0
    finally:
        unbind_audit_unit(token)
    assert unit.events == []


# --- Aperçu de la sélection (ARCH-03) ---

PREVIEW_URL = "/exports/interventions/closed/preview"
PREVIEW = Endpoint("exports:preview_closed_interventions", "GET", PREVIEW_URL, "exports")


def test_apercu_ouvert_a_admin_et_resp_seulement():
    assert default_allowed("ADMIN", PREVIEW)
    assert default_allowed("RESP", PREVIEW)
    for role in ("TECH", "ACHETEUR", "MCP"):
        assert not default_allowed(role, PREVIEW), role


def test_apercu_declare_avant_la_route_unitaire():
    chemins = [getattr(r, "path", "") for r in export_routes.router.routes]
    assert chemins.index(PREVIEW_URL) < chemins.index(
        "/exports/interventions/{intervention_id}/pdf"
    )


def test_apercu_compte_les_fiches_avec_la_selection_de_l_export(client, depot):
    r = client.get(PREVIEW_URL, params={**PERIODE, "include_printed": "true"})
    assert r.status_code == 200, r.text
    assert r.json() == {"data": {"count": 2, "max": 100, "over_limit": False}}
    assert depot["appels"][0][3] == export_routes.MAX_BULK_SHEETS + 1
    assert depot["include_printed"] == [True]


def test_apercu_zero_fiche_donne_200_sans_404(client, depot):
    depot["codes"] = []
    r = client.get(PREVIEW_URL, params=PERIODE)
    assert r.status_code == 200
    assert r.json() == {"data": {"count": 0, "max": 100, "over_limit": False}}


def test_apercu_au_dela_du_plafond_borne_le_compte(client, depot):
    depot["codes"] = [f"INT-{i}" for i in range(export_routes.MAX_BULK_SHEETS + 1)]
    r = client.get(PREVIEW_URL, params=PERIODE)
    assert r.status_code == 200
    assert r.json() == {"data": {"count": 100, "max": 100, "over_limit": True}}


def test_apercu_plafond_exact_n_est_pas_un_depassement(client, depot):
    depot["codes"] = [f"INT-{i}" for i in range(export_routes.MAX_BULK_SHEETS)]
    data = client.get(PREVIEW_URL, params=PERIODE).json()["data"]
    assert data == {"count": 100, "max": 100, "over_limit": False}


@pytest.mark.parametrize(
    "params",
    [
        {"date_from": "2026-02-01", "date_to": "2026-01-01"},
        {"date_from": "pas-une-date", "date_to": "2026-01-01"},
        {"date_from": "2026-01-01", "date_to": "2026-01-31", "equipement_id": "x"},
    ],
)
def test_apercu_valide_comme_l_export(client, depot, params):
    assert client.get(PREVIEW_URL, params=params).status_code == 400
    assert depot["appels"] == []
