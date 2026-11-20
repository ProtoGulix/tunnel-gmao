"""Transitions permises d'une demande : fonction unique et refus de clôture (CASC-02)."""

import pytest

from api.errors.exceptions import ValidationError
from api.intervention_requests.validators import (
    CLOSE_VIA_INTERVENTION_MESSAGE,
    InterventionRequestValidator,
    compute_allowed_transitions,
)


@pytest.mark.parametrize(
    "statut, attendu",
    [
        ("nouvelle", ["en_attente", "acceptee", "rejetee"]),
        ("en_attente", ["acceptee", "rejetee"]),
        ("rejetee", []),
        ("cloturee", []),
    ],
)
def test_statuts_sans_cloture_ne_dependent_pas_de_l_intervention(statut, attendu):
    assert compute_allowed_transitions(statut, False, None, True) == attendu
    assert compute_allowed_transitions(statut, True, "en_cours", True) == attendu


def test_acceptee_sans_intervention_peut_etre_cloturee():
    assert compute_allowed_transitions("acceptee", False, None, True) == ["cloturee"]


def test_acceptee_avec_intervention_fermee_peut_etre_cloturee():
    assert compute_allowed_transitions("acceptee", True, "ferme", True) == ["cloturee"]


def test_acceptee_avec_intervention_ouverte_ne_peut_pas_etre_cloturee():
    assert compute_allowed_transitions("acceptee", True, "en_cours", True) == []


@pytest.mark.parametrize("statut", ["nouvelle", "en_attente", "acceptee"])
def test_sans_permission_aucune_transition(statut):
    assert compute_allowed_transitions(statut, False, None, False) == []


def test_validator_refuse_la_cloture_avec_intervention_ouverte():
    with pytest.raises(ValidationError) as err:
        InterventionRequestValidator.validate_transition(
            "acceptee",
            "cloturee",
            None,
            None,
            current_intervention_id="x",
            intervention_status="en_cours",
        )
    assert CLOSE_VIA_INTERVENTION_MESSAGE in str(err.value)


def test_validator_accepte_la_cloture_sans_ou_avec_intervention_fermee():
    InterventionRequestValidator.validate_transition("acceptee", "cloturee", None, None)
    InterventionRequestValidator.validate_transition(
        "acceptee",
        "cloturee",
        None,
        None,
        current_intervention_id="x",
        intervention_status="ferme",
    )
