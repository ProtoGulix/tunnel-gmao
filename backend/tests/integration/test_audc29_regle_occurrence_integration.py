"""Règle d'audit de l'occurrence préventive (migration 0008, AUDC-29) : présente après
bootstrap, et ROUTINE couvre l'entité."""

import pytest

pytestmark = pytest.mark.integration


def test_regle_occurrence_preventive_existe_apres_bootstrap(instance):
    lignes = instance.sql(
        "SELECT is_routine, default_reason_code FROM audit_rule "
        "WHERE entity_type = 'preventive_occurrence' AND field IS NULL"
    )
    assert lignes == [(True, "ROUTINE")]


def test_routine_couvre_preventive_occurrence(instance):
    lignes = instance.sql(
        "SELECT 'preventive_occurrence' = ANY(entity_types) FROM audit_reason_code "
        "WHERE code = 'ROUTINE'"
    )
    assert lignes == [(True,)]
