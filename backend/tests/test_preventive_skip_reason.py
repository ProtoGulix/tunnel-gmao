"""Libellé de skip_reason déduit du motif choisi pour ignorer une occurrence (CONT-03)."""

import pytest

from api.errors.exceptions import ValidationError
from api.preventive_occurrences.validators import skip_reason_from_choice

MOTIFS = [
    {
        "code": "OCCURRENCE_MACHINE_DOWN",
        "label": "Machine arrêtée",
        "category": "user",
        "decision_types": ["occurrence_skipped"],
    },
    {
        "code": "OTHER",
        "label": "Autre raison",
        "category": "user",
        "decision_types": ["task_done", "occurrence_skipped"],
    },
    {"code": "ROUTINE", "label": "Routine", "category": "auto", "decision_types": None},
    {
        "code": "TASK_DUPLICATE",
        "label": "Doublon",
        "category": "user",
        "decision_types": ["task_skipped"],
    },
]


def test_libelle_du_motif():
    assert skip_reason_from_choice("OCCURRENCE_MACHINE_DOWN", None, MOTIFS) == "Machine arrêtée"


def test_autre_retourne_le_texte_libre():
    assert skip_reason_from_choice("OTHER", "  Travaux  ", MOTIFS) == "Travaux"


@pytest.mark.parametrize("code", [None, "", "INCONNU", "ROUTINE", "TASK_DUPLICATE"])
def test_motif_absent_ou_inadapte_refuse(code):
    with pytest.raises(ValidationError):
        skip_reason_from_choice(code, None, MOTIFS)


def test_autre_sans_texte_refuse():
    with pytest.raises(ValidationError):
        skip_reason_from_choice("OTHER", " ", MOTIFS)
