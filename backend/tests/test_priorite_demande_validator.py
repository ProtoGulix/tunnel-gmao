"""Urgence d'une demande (ADT-02, ADR 0047) : règles du validator, sans base."""

import pytest

from api.constants import PRIORITY_TYPES
from api.errors.exceptions import ValidationError
from api.intervention_requests.validators import InterventionRequestValidator as V


@pytest.mark.parametrize("priorite", [p["id"] for p in PRIORITY_TYPES] + [None])
def test_une_urgence_de_la_liste_ou_absente_est_acceptee(priorite):
    V.validate_priorite(priorite)


@pytest.mark.parametrize("priorite", ["normale", "", "URGENT", "critique"])
def test_une_urgence_hors_liste_est_refusee_avec_les_valeurs_permises(priorite):
    with pytest.raises(ValidationError) as exc:
        V.validate_priorite(priorite)
    assert "faible, normal, important, urgent" in str(exc.value)


@pytest.mark.parametrize("statut", ["nouvelle", "en_attente"])
def test_l_urgence_change_tant_que_la_demande_attend(statut):
    V.validate_priorite_change(statut)


@pytest.mark.parametrize("statut", ["acceptee", "rejetee", "cloturee"])
def test_l_urgence_d_une_demande_fermee_est_refusee(statut):
    with pytest.raises(ValidationError):
        V.validate_priorite_change(statut)
