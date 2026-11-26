"""Constat après intervention (CST-02, ADR 0043) : validators et autorisation, sans base."""

import pytest

from api.constats.routes import router
from api.constats.validators import (
    ConstatValidator,
    ensure_correction_reason,
)
from api.errors.exceptions import AuditReasonRequiredError, ForbiddenError, ValidationError
from db.default_permissions import Endpoint, default_allowed
from tests.helpers import make_client


def _choice(code, order, active=True, type_code=None, creates=False, exclusive=False):
    return {
        "creates_request": creates,
        "is_exclusive": exclusive,
        "code": code,
        "label": code.title(),
        "sort_order": order,
        "is_active": active,
        "suggested_type_inter": type_code,
    }


def _question(code, order, choices, multiple=False, parent=None, active=True):
    return {
        "code": code,
        "label": f"Q {code}",
        "is_multiple": multiple,
        "parent_choice_code": parent,
        "sort_order": order,
        "is_active": active,
        "choices": choices,
    }


@pytest.fixture
def form():
    return [
        _question(
            "LEVER",
            1,
            [
                _choice("TASK", 1, type_code="PRE", creates=True),
                _choice("PROJECT", 2, type_code="PRO", creates=True),
                _choice("TRAINING", 3),
                _choice("OLD", 4, active=False),
                _choice("NOTHING", 5, exclusive=True),
            ],
            multiple=True,
        ),
        _question("FREQUENCY", 2, [_choice("FREQ_W", 1), _choice("FREQ_M", 2)], parent="TASK"),
        _question("DOMAIN", 3, [_choice("DOM_E", 1), _choice("DOM_M", 2)], True, parent="TRAINING"),
        _question("SIGNAL", 4, [_choice("SIGNAL_SEEN", 1), _choice("SIGNAL_NONE", 2)]),
        _question("PART", 5, [_choice("PART_PLC", 1), _choice("PART_MECH", 2)], multiple=True),
    ]


def _prepare(codes, form):
    return ConstatValidator.validate_and_prepare(codes, form)


def test_constat_valide_et_type_du_premier_levier_type(form):
    result = _prepare(["PROJECT", "TASK", "FREQ_W", "SIGNAL_NONE", "PART_PLC"], form)
    # Ordre de l'écran : TASK (PRE) passe avant PROJECT (PRO)
    assert result["suggested_type_inter"] == "PRE"
    assert [s["choice"]["code"] for s in result["selected"]] == [
        "TASK",
        "PROJECT",
        "FREQ_W",
        "SIGNAL_NONE",
        "PART_PLC",
    ]


def test_demande_generee_si_un_choix_coche_la_genere(form):
    assert _prepare(["TASK", "FREQ_W", "SIGNAL_NONE", "PART_PLC"], form)["creates_request"]
    assert _prepare(["TRAINING", "TASK", "FREQ_W", "DOM_E", "SIGNAL_NONE", "PART_PLC"], form)[
        "creates_request"
    ]


def test_aucune_demande_si_aucun_choix_ne_la_genere(form):
    assert not _prepare(["TRAINING", "DOM_E", "SIGNAL_NONE", "PART_PLC"], form)["creates_request"]


def test_choix_exclusif_seul_accepte(form):
    result = _prepare(["NOTHING", "SIGNAL_NONE", "PART_PLC"], form)
    assert result["creates_request"] is False and result["suggested_type_inter"] is None


def test_choix_exclusif_combine_refuse(form):
    with pytest.raises(ValidationError) as e:
        _prepare(["NOTHING", "TRAINING", "DOM_E", "SIGNAL_NONE", "PART_PLC"], form)
    assert "Choix exclusif : Nothing" in str(e.value.detail)


def test_sans_levier_type_pas_de_type_preconise(form):
    result = _prepare(["TRAINING", "DOM_E", "SIGNAL_NONE", "PART_PLC"], form)
    assert result["suggested_type_inter"] is None


@pytest.mark.parametrize("missing", ["LEVER", "SIGNAL", "PART"])
def test_question_racine_obligatoire(form, missing):
    codes = {
        "LEVER": "TRAINING",
        "SIGNAL": "SIGNAL_NONE",
        "PART": "PART_PLC",
    }
    codes.pop(missing)
    chosen = list(codes.values()) + ["DOM_E"]
    with pytest.raises(ValidationError) as e:
        _prepare(chosen, form)
    assert f"Q {missing}" in str(e.value.detail)


def test_choix_inconnu_refuse(form):
    with pytest.raises(ValidationError):
        _prepare(["INCONNU"], form)


def test_choix_inactif_refuse(form):
    with pytest.raises(ValidationError):
        _prepare(["OLD", "SIGNAL_NONE", "PART_PLC"], form)


def test_choix_d_une_question_inactive_refuse(form):
    form[3]["is_active"] = False
    with pytest.raises(ValidationError):
        _prepare(["TRAINING", "DOM_E", "SIGNAL_NONE", "PART_PLC"], form)


def test_choix_unique_respecte(form):
    with pytest.raises(ValidationError):
        _prepare(["TRAINING", "DOM_E", "SIGNAL_SEEN", "SIGNAL_NONE", "PART_PLC"], form)


def test_choix_multiple_accepte_plusieurs_reponses(form):
    _prepare(["TRAINING", "DOM_E", "DOM_M", "SIGNAL_NONE", "PART_PLC", "PART_MECH"], form)


def test_sous_question_exigee_si_le_parent_est_coche(form):
    with pytest.raises(ValidationError):
        _prepare(["TASK", "SIGNAL_NONE", "PART_PLC"], form)


def test_sous_question_refusee_si_le_parent_n_est_pas_coche(form):
    with pytest.raises(ValidationError):
        _prepare(["TRAINING", "DOM_E", "FREQ_W", "SIGNAL_NONE", "PART_PLC"], form)


def test_description_construite_depuis_les_libelles_seulement(form):
    selected = _prepare(["TASK", "FREQ_M", "SIGNAL_NONE", "PART_PLC"], form)["selected"]
    text = ConstatValidator.build_description("INT-1", selected)
    assert text.splitlines()[0] == "Constat après l'intervention INT-1"
    assert "Q LEVER : Task" in text and "Q FREQUENCY : Freq_M" in text


def test_intervention_archivee_refuse_le_constat():
    with pytest.raises(ValidationError):
        ConstatValidator.ensure_intervention_open_to_constat(True)
    ConstatValidator.ensure_intervention_open_to_constat(False)


@pytest.mark.parametrize(
    "author,user,role,ok",
    [("u1", "u1", "TECH", True), ("u1", "u2", "TECH", False), ("u1", "u2", "RESP", True)],
)
def test_correction_par_l_auteur_ou_le_referent(author, user, role, ok):
    assert ConstatValidator.can_correct(author, user, role, "nouvelle") is ok
    if ok:
        ConstatValidator.ensure_can_correct(author, user, role, "nouvelle")
    else:
        with pytest.raises(ForbiddenError):
            ConstatValidator.ensure_can_correct(author, user, role, "nouvelle")


def test_correction_sans_demande_par_l_auteur_ou_le_referent():
    assert ConstatValidator.can_correct("u1", "u1", "TECH", None) is True
    assert ConstatValidator.can_correct("u1", "u2", "RESP", None) is True
    assert ConstatValidator.can_correct("u1", "u2", "TECH", None) is False
    ConstatValidator.ensure_can_correct("u1", "u1", "TECH", None)
    with pytest.raises(ForbiddenError):
        ConstatValidator.ensure_can_correct("u1", "u2", "TECH", None)


def test_correction_refusee_si_l_intervention_est_archivee():
    assert ConstatValidator.can_correct("u1", "u1", "ADMIN", None, archived=True) is False
    assert ConstatValidator.can_correct("u1", "u1", "ADMIN", "nouvelle", archived=True) is False


@pytest.mark.parametrize("statut", ["en_attente", "acceptee", "rejetee", "cloturee"])
def test_correction_seulement_si_la_demande_est_nouvelle(statut):
    assert ConstatValidator.can_correct("u1", "u1", "ADMIN", statut) is False
    with pytest.raises(ValidationError):
        ConstatValidator.ensure_can_correct("u1", "u1", "ADMIN", statut)


REASONS = [
    {"code": "ROUTINE", "label": "Routine", "category": "auto", "decision_types": None},
    {
        "code": "CONSTAT_CORRECTION",
        "label": "Correction",
        "category": "user",
        "decision_types": ["constat_corrected"],
    },
    {"code": "OTHER", "label": "Autre", "category": "user", "decision_types": None},
]


def test_motif_de_correction_accepte():
    ensure_correction_reason("CONSTAT_CORRECTION", None, REASONS)


def test_sans_motif_choisi_la_liste_est_demandee():
    with pytest.raises(AuditReasonRequiredError) as e:
        ensure_correction_reason("ROUTINE", None, REASONS)
    assert [r["code"] for r in e.value.audit["reasons"]] == ["CONSTAT_CORRECTION"]


def test_motif_hors_decision_refuse():
    with pytest.raises(ValidationError):
        ensure_correction_reason("OTHER", "texte", REASONS)
    with pytest.raises(ValidationError):
        ensure_correction_reason("INCONNU", None, REASONS)


# --- Autorisation des routes en écriture ---------------------------------------------

ID = "22222222-2222-2222-2222-222222222222"
WRITES = [
    ("post", f"/interventions/{ID}/constats", {"choices": []}),
    ("post", f"/constats/{ID}/corrections", {"choices": []}),
    ("post", f"/constats/{ID}/link", {"request_id": ID}),
]


@pytest.mark.parametrize("role", ["ACHETEUR", "MCP"])
@pytest.mark.parametrize("method,path,body", WRITES)
def test_acheteur_et_mcp_refuses_en_ecriture(role, method, path, body):
    client = make_client(router, role=role)
    assert getattr(client, method)(path, json=body).status_code == 403


def test_tech_refuse_au_rattachement():
    client = make_client(router, role="TECH")
    assert client.post(f"/constats/{ID}/link", json={"request_id": ID}).status_code == 403


def _ep(method, path):
    return Endpoint("x:y", method, path, "constats")


def test_droits_par_defaut():
    create = _ep("POST", "/interventions/{intervention_id}/constats")
    correct = _ep("POST", "/constats/{constat_id}/corrections")
    link = _ep("POST", "/constats/{constat_id}/link")
    for role in ("TECH", "RESP", "ADMIN"):
        assert default_allowed(role, create) and default_allowed(role, correct)
    for role in ("ACHETEUR", "MCP"):
        assert not default_allowed(role, create) and not default_allowed(role, correct)
        assert not default_allowed(role, link)
    assert default_allowed("RESP", link) and not default_allowed("TECH", link)
    for role in ("TECH", "RESP", "ACHETEUR", "MCP"):
        assert default_allowed(role, _ep("GET", "/constats/questions"))
