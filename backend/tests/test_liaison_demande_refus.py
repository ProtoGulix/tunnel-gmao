"""Refus de liaison d'une demande à une intervention : erreurs métier, pas des 500.

`_link_request` testée seule, curseur simulé (aucune base). Avant le correctif, chaque refus
levait une DatabaseError, donc une 500 au message masqué.
"""

from unittest.mock import MagicMock

import pytest

from api.errors.exceptions import ConflictError, DatabaseError, NotFoundError, ValidationError
from api.interventions.repo import InterventionRepository

REQUEST_ID = "11111111-1111-1111-1111-111111111111"
INTERVENTION_ID = "22222222-2222-2222-2222-222222222222"


def _cursor(*fetchone_results):
    cur = MagicMock()
    cur.fetchone.side_effect = list(fetchone_results)
    return cur


def _link(cur):
    InterventionRepository()._link_request(cur, INTERVENTION_ID, REQUEST_ID, user_id=None)


@pytest.mark.parametrize(
    "fetchone_results, expected, status",
    [
        ((None,), NotFoundError, 404),
        (((REQUEST_ID, "nouvelle", "33333333-3333-3333-3333-333333333333"),), ConflictError, 409),
        (((REQUEST_ID, "rejetee", None),), ValidationError, 400),
        (
            ((REQUEST_ID, "nouvelle", None), ("44444444-4444-4444-4444-444444444444",)),
            ConflictError,
            409,
        ),
    ],
    ids=["demande_introuvable", "demande_deja_liee", "statut_non_liable", "intervention_deja_liee"],
)
def test_refus_de_liaison_est_une_erreur_metier(fetchone_results, expected, status):
    with pytest.raises(expected) as exc:
        _link(_cursor(*fetchone_results))
    assert not isinstance(exc.value, DatabaseError)
    assert exc.value.status_code == status


def test_refus_de_liaison_ne_modifie_rien():
    cur = _cursor((REQUEST_ID, "rejetee", None))
    with pytest.raises(ValidationError):
        _link(cur)
    assert not any("UPDATE" in str(c.args[0]) for c in cur.execute.call_args_list)
