"""Priorité d'une intervention (ADR 0039) : règle du validator, sans base."""

import pytest

from api.constants import PRIORITY_TYPES
from api.errors.exceptions import ValidationError
from api.interventions.validators import InterventionValidator


@pytest.mark.parametrize("priorite", [p["id"] for p in PRIORITY_TYPES] + [None])
def test_une_priorite_de_la_liste_ou_absente_est_acceptee(priorite):
    InterventionValidator.validate_priority(priorite)


@pytest.mark.parametrize("priorite", ["normale", "", "URGENT", "critique"])
def test_une_priorite_hors_liste_est_refusee_avec_les_valeurs_permises(priorite):
    with pytest.raises(ValidationError) as exc:
        InterventionValidator.validate_priority(priorite)
    assert "normal" in str(exc.value.message if hasattr(exc.value, "message") else exc.value)
