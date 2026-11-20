"""Motif exigé pour rouvrir une intervention fermée (ADR 0028) : règles du validator."""

import pytest

from api.errors.exceptions import AuditReasonRequiredError, ValidationError
from api.interventions.validators import ensure_reopen_reason, is_reopening

MOTIFS = [
    {"code": "ROUTINE", "label": "Routine", "category": "auto", "decision_types": None},
    {"code": "SYSTEM_CASCADE", "label": "Cascade", "category": "system", "decision_types": None},
    {
        "code": "INTERVENTION_REWORK",
        "label": "Travail à reprendre",
        "category": "user",
        "decision_types": ["intervention_reopened"],
    },
    {
        "code": "OTHER",
        "label": "Autre",
        "category": "user",
        "decision_types": ["task_done", "intervention_reopened"],
    },
    {
        "code": "EQUIPMENT_FAILURE",
        "label": "Panne",
        "category": "manual",
        "decision_types": None,
    },
]


@pytest.mark.parametrize(
    ("actuel", "nouveau", "attendu"),
    [
        ("ferme", "ouvert", True),
        ("ferme", "attente_pieces", True),
        ("ferme", "ferme", False),
        ("ouvert", "attente_pieces", False),
        ("ferme", None, False),
    ],
)
def test_seule_la_sortie_de_ferme_est_une_reouverture(actuel, nouveau, attendu):
    assert is_reopening(actuel, nouveau) is attendu


@pytest.mark.parametrize("code", ["ROUTINE", "SYSTEM_CASCADE"])
def test_motif_auto_ou_systeme_redemande_les_seuls_motifs_de_reouverture(code):
    with pytest.raises(AuditReasonRequiredError) as erreur:
        ensure_reopen_reason(code, None, MOTIFS)
    proposes = {r["code"] for r in erreur.value.audit["reasons"]}
    assert proposes == {"INTERVENTION_REWORK", "OTHER"}


def test_motif_inconnu_ou_desactive_refuse():
    # La liste reçue ne contient que les motifs actifs : un motif désactivé y est absent.
    with pytest.raises(ValidationError):
        ensure_reopen_reason("INTERVENTION_CLOSED_BY_MISTAKE", None, MOTIFS)


def test_motif_d_une_autre_decision_refuse():
    with pytest.raises(ValidationError):
        ensure_reopen_reason("EQUIPMENT_FAILURE", None, MOTIFS)


def test_autre_exige_un_texte():
    with pytest.raises(ValidationError):
        ensure_reopen_reason("OTHER", "  ", MOTIFS)
    ensure_reopen_reason("OTHER", "Client a rappelé", MOTIFS)


def test_motif_de_reouverture_accepte():
    ensure_reopen_reason("INTERVENTION_REWORK", None, MOTIFS)
