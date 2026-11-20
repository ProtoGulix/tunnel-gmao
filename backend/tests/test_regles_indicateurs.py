"""Règles exposées par l'API (ADR 0030) : fonctions pures, sans base."""

import pytest

from api.intervention_actions.validators import can_delete_action, has_dispatched_pr
from api.intervention_tasks.validators import task_capabilities, task_delete_blocker
from api.interventions.validators import is_intervention_locked


@pytest.mark.parametrize(
    "statut,attendu",
    [("ferme", True), (" Ferme ", True), ("ouvert", False), ("in_progress", False), (None, False)],
)
def test_is_intervention_locked(statut, attendu):
    assert is_intervention_locked(statut) is attendu


def _pr(code):
    return {"derived_status": {"code": code}}


def test_da_non_repartie_ne_bloque_pas():
    assert has_dispatched_pr([_pr("TO_QUALIFY"), _pr("PENDING_DISPATCH")]) is False
    assert can_delete_action(False, [_pr("NO_SUPPLIER_REF")]) is True
    assert can_delete_action(False, []) is True


def test_da_repartie_ou_intervention_fermee_bloque():
    assert has_dispatched_pr([_pr("ORDERED")]) is True
    assert can_delete_action(False, [_pr("TO_QUALIFY"), _pr("ORDERED")]) is False
    assert can_delete_action(True, []) is False


def test_tache_supprimable_seulement_a_faire_sans_action_non_verrouillee():
    assert task_delete_blocker("todo", 0, False) is None
    assert task_delete_blocker("done", 0, False)
    assert task_delete_blocker("in_progress", 0, False)
    assert task_delete_blocker("skipped", 0, False)
    assert "2 actions" in task_delete_blocker("todo", 2, False)
    assert task_delete_blocker("todo", 0, True)


@pytest.mark.parametrize(
    "role,attendu",
    [("ADMIN", True), ("RESP", True), ("TECH", False), ("ACHETEUR", False), (None, False)],
)
def test_capacites_sur_les_taches(role, attendu):
    assert task_capabilities(role) == {
        "skip_obligatory_step": attendu,
        "close_task_without_action": attendu,
    }
