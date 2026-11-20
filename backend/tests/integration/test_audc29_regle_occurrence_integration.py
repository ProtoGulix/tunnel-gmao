"""Règle d'audit de l'occurrence préventive (migration 0008, AUDC-29) : présente après
bootstrap. Depuis la migration 0019 (CONT-03), elle n'est plus routinière : ignorer une
occurrence exige un motif choisi, et ROUTINE ne couvre plus l'entité."""

import pytest

pytestmark = pytest.mark.integration


def test_regle_occurrence_preventive_existe_apres_bootstrap(instance):
    lignes = instance.sql(
        "SELECT is_routine, default_reason_code FROM audit_rule "
        "WHERE entity_type = 'preventive_occurrence' AND field IS NULL"
    )
    assert lignes == [(False, None)]


def test_routine_ne_couvre_plus_preventive_occurrence(instance):
    lignes = instance.sql(
        "SELECT 'preventive_occurrence' = ANY(entity_types) FROM audit_reason_code "
        "WHERE code = 'ROUTINE'"
    )
    assert lignes == [(False,)]
