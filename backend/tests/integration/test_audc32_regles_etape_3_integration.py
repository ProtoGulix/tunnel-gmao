"""Règles d'audit de l'étape 3 (migration 0010, AUDC-32) : présentes après bootstrap, et
ROUTINE couvre chaque entité."""

import pytest

pytestmark = pytest.mark.integration

ENTITES = (
    'preventive_plan',
    'part',
    'part_manufacturer_ref',
    'part_supplier_ref',
    'manufacturer_item',
    'stock_item',
    'stock_sub_family',
    'stock_item_supplier',
    'supplier',
    'supplier_order_line',
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
