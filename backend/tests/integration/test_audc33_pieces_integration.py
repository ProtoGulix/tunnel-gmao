"""AUDC-33 : références fabricant et fournisseur des pièces, plan préventif (événements d'audit).

Complète test_audc31_etape3_integration : l'identifiant d'une référence créée se lit dans
manufacturer_refs de la pièce renvoyée (la réponse est la pièce, pas la référence).
"""

import secrets

import pytest

from tests.integration.etape2_helpers import lignes_audit

pytestmark = pytest.mark.integration

MOTIF_SUPPRESSION = "DELETE_CREATED_BY_MISTAKE"


def _data(resp):
    corps = resp.json()
    return corps.get("data", corps)


@pytest.fixture
def piece(instance):
    code = f"F{secrets.token_hex(3)}"
    instance.sql("INSERT INTO stock_family (code, label) VALUES (%s, 'Famille AUDC-33')", (code,))
    instance.sql(
        "INSERT INTO stock_sub_family (family_code, code, label) VALUES (%s, 'S', 'Sous-famille')",
        (code,),
    )
    return instance.sql(
        "INSERT INTO part (family_code, sub_family_code) VALUES (%s, 'S') RETURNING id::text",
        (code,),
    )[0][0]


def _ajoute_ref(client, admin, piece, preferred=False):
    resp = client.post(
        f"/parts/{piece}/manufacturer-refs",
        headers=admin.headers,
        json={
            "manufacturer_name": "Fab",
            "manufacturer_ref": secrets.token_hex(3),
            "is_preferred": preferred,
        },
    )
    assert resp.status_code == 201, resp.text
    return max(_data(resp)["manufacturer_refs"], key=lambda r: r["created_at"] or "")["id"]


def test_reference_fabricant_creee_et_preferee_trace_les_soeurs(instance, client, admin, piece):
    premiere = _ajoute_ref(client, admin, piece, preferred=True)
    assert [lg[1] for lg in lignes_audit(instance, premiere)] == ["created"]

    seconde = _ajoute_ref(client, admin, piece)
    resp = client.post(f"/parts/manufacturer-refs/{seconde}/set-preferred", headers=admin.headers)
    assert resp.status_code == 200, resp.text
    # La visée gagne le statut, la sœur le perd : une ligne chacune, auteur du jeton.
    assert "is_preferred_changed" in [lg[1] for lg in lignes_audit(instance, seconde)]
    perdue = [lg for lg in lignes_audit(instance, premiere) if lg[1] == "is_preferred_changed"]
    assert len(perdue) == 1 and perdue[0][4] == admin.id


def test_suppression_reference_fabricant_trace_les_references_fournisseur(
    instance, client, admin, piece
):
    ref = _ajoute_ref(client, admin, piece)
    fournisseur = instance.sql(
        "INSERT INTO supplier (name) VALUES (%s) RETURNING id::text",
        (f"Fourn AUDC-33 {secrets.token_hex(3)}",),
    )[0][0]
    resp = client.post(
        f"/parts/manufacturer-refs/{ref}/supplier-refs",
        headers=admin.headers,
        json={"supplier_id": fournisseur, "supplier_ref": "S-1"},
    )
    assert resp.status_code == 201, resp.text
    (sref,) = instance.sql(
        "SELECT id::text FROM part_supplier_ref WHERE part_manufacturer_ref_id = %s", (ref,)
    )[0]
    assert [lg[1] for lg in lignes_audit(instance, sref)] == ["created"]

    resp = client.request(
        "DELETE",
        f"/parts/manufacturer-refs/{ref}",
        headers=admin.headers,
        json={"reason_code": MOTIF_SUPPRESSION},
    )
    assert resp.status_code == 200, resp.text
    assert "deleted" in [lg[1] for lg in lignes_audit(instance, ref)]
    assert "deleted" in [lg[1] for lg in lignes_audit(instance, sref)]


def test_remplacement_des_etapes_d_un_plan_est_trace(instance, client, admin):
    classe = instance.sql(
        "INSERT INTO equipement_class (code, label) VALUES (%s, 'Classe AUDC-33') RETURNING id::text",
        (f"C33-{secrets.token_hex(3)}",),
    )[0][0]
    resp = client.post(
        "/preventive-plans",
        headers=admin.headers,
        json={
            "code": f"P33-{secrets.token_hex(3)}",
            "label": "Plan",
            "equipement_class_id": classe,
            "trigger_type": "periodicity",
            "periodicity_days": 30,
        },
    )
    assert resp.status_code == 201, resp.text
    plan = _data(resp)["id"]

    resp = client.patch(
        f"/preventive-plans/{plan}/steps",
        headers=admin.headers,
        json=[{"label": "Graisser", "sort_order": 1, "optional": False}],
    )
    assert resp.status_code == 200, resp.text
    assert "steps_changed" in [lg[1] for lg in lignes_audit(instance, plan)]


def test_rendre_preferee_une_reference_deja_preferee_n_ecrit_pas_de_faux_evenement(
    instance, client, admin, piece
):
    """La référence visée est laissée hors de la remise à false (relecture de l'étape 3) :
    aucun événement true → false sur elle."""
    ref = _ajoute_ref(client, admin, piece, preferred=True)
    resp = client.post(f"/parts/manufacturer-refs/{ref}/set-preferred", headers=admin.headers)
    assert resp.status_code == 200, resp.text
    assert [lg[1] for lg in lignes_audit(instance, ref)] == ["created"]
