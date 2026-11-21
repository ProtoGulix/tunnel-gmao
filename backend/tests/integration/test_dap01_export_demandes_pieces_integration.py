"""Export de la fiche d'intervention : les demandes d'achat liées à une pièce (DAP-01).

Les demandes sont liées aux pièces par part_id (cahier fonctionnel 1.6) ; l'export ne
joignait que l'ancien stock_item et laissait vides référence, désignation, fabricant et
fournisseur.
"""

import secrets

import pytest

pytestmark = pytest.mark.integration


def _piece_avec_references(instance):
    """Crée une pièce avec deux références fabricant, la préférée portant un fournisseur préféré."""
    famille = f"D{secrets.token_hex(3)}".upper()
    instance.sql("INSERT INTO stock_family (code, label) VALUES (%s, 'Essai')", (famille,))
    instance.sql(
        "INSERT INTO stock_sub_family (family_code, code, label) VALUES (%s, %s, 'Essai')",
        (famille, famille),
    )
    part_id, internal_ref = instance.sql(
        "INSERT INTO part (family_code, sub_family_code) VALUES (%s, %s) "
        "RETURNING id, internal_ref",
        (famille, famille),
    )[0]
    instance.sql(
        "INSERT INTO part_manufacturer_ref (part_id, manufacturer_name, manufacturer_ref, label) "
        "VALUES (%s, 'AutreFab', 'AUTRE-1', 'Autre libellé')",
        (part_id,),
    )
    mfr_id = instance.sql(
        "INSERT INTO part_manufacturer_ref "
        "(part_id, manufacturer_name, manufacturer_ref, label, is_preferred) "
        "VALUES (%s, 'SKF', 'SKF-6205', 'Roulement 6205', true) RETURNING id",
        (part_id,),
    )[0][0]
    supplier_id = instance.sql(
        "INSERT INTO supplier (name, code) VALUES (%s, %s) RETURNING id",
        (f"Fournisseur {secrets.token_hex(3)}", f"F{secrets.token_hex(3)}"),
    )[0][0]
    instance.sql(
        "INSERT INTO part_supplier_ref "
        "(part_manufacturer_ref_id, supplier_id, supplier_ref, is_preferred) "
        "VALUES (%s, %s, 'FOUR-6205', true)",
        (mfr_id, supplier_id),
    )
    return part_id, internal_ref


def test_export_demande_liee_a_une_piece(instance, client):
    from api.exports.repo import ExportRepository

    part_id, internal_ref = _piece_avec_references(instance)
    machine_id = instance.sql(
        "INSERT INTO machine (code, name) VALUES (%s, 'Presse export') RETURNING id",
        (f"EXP{secrets.token_hex(3)}".upper(),),
    )[0][0]
    inter_id = instance.sql(
        "INSERT INTO intervention (title, type_inter, machine_id, tech_initials) "
        "VALUES ('Essai export', 'CUR', %s, 'TT') RETURNING id",
        (machine_id,),
    )[0][0]
    action_id = instance.sql(
        "INSERT INTO intervention_action (intervention_id, description, time_spent) "
        "VALUES (%s, 'Essai', 0.5) RETURNING id",
        (inter_id,),
    )[0][0]
    pr_id = instance.sql(
        "INSERT INTO purchase_request (item_label, quantity, part_id) "
        "VALUES ('Roulement', 2, %s) RETURNING id",
        (part_id,),
    )[0][0]
    instance.sql(
        "INSERT INTO intervention_action_purchase_request "
        "(intervention_action_id, purchase_request_id) VALUES (%s, %s)",
        (action_id, pr_id),
    )

    data = ExportRepository().get_intervention_export_data(str(inter_id))

    assert len(data["purchase_requests"]) == 1
    pr = data["purchase_requests"][0]
    assert pr["stock_item_ref"] == internal_ref
    assert pr["stock_item_name"] == "Roulement 6205"
    assert pr["manufacturer_name"] == "SKF"
    assert pr["manufacturer_ref"] == "SKF-6205"
    assert pr["supplier_ref"] == "FOUR-6205"
    assert pr["supplier_name"].startswith("Fournisseur ")
