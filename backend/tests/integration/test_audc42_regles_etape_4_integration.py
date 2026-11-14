"""Règles d'audit de l'étape 4 (migration 0012, AUDC-42) : présentes après bootstrap, et
ROUTINE couvre chaque entité."""

import pytest

pytestmark = pytest.mark.integration

ENTITES = (
    'user',
    'permission',
    'endpoint',
    'ip_block',
    'email_domain_rule',
    'api_key',
    'equipement_class',
    'service',
    'role_home_view',
    'action_category',
    'action_subcategory',
    'intervention_type',
    'intervention_status',
    'audit_reason',
    'audit_rule',
)


@pytest.mark.parametrize("entite", ENTITES)
def test_regle_routiniere_existe_apres_bootstrap(instance, entite):
    lignes = instance.sql(
        "SELECT is_routine, default_reason_code FROM audit_rule "
        f"WHERE entity_type = '{entite}' AND field IS NULL"
    )
    assert lignes == [(True, "ROUTINE")]


@pytest.mark.parametrize("entite", ENTITES)
def test_routine_couvre_entite(instance, entite):
    lignes = instance.sql(
        f"SELECT '{entite}' = ANY(entity_types) FROM audit_reason_code WHERE code = 'ROUTINE'"
    )
    assert lignes == [(True,)]


def test_motifs_suppression_sans_restriction_d_entite(instance):
    lignes = instance.sql(
        "SELECT code FROM audit_reason_code WHERE code IN "
        "('DELETE_CREATED_BY_MISTAKE', 'DELETE_DUPLICATE', 'OTHER') "
        "AND entity_types IS NOT NULL"
    )
    assert lignes == []
