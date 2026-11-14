"""Étape 3 de l'audit centralisé (AUDC-31) : catalogue, stock, fournisseurs et lignes de commande.

Décision 8 : tout est routinier (aucun motif envoyé à la création ni à la modification), sauf la
suppression qui exige un motif explicite. Un échantillon par domaine. Les tests supposent les
règles d'audit de la migration 0010 (AUDC-32) et la déclaration des routes (AUDC-33, AUDC-34).
"""

import secrets

import pytest

from tests.integration.etape2_helpers import MOTIF, lignes_audit

pytestmark = pytest.mark.integration

MOTIF_SUPPRESSION = "DELETE_CREATED_BY_MISTAKE"


def _data(resp):
    corps = resp.json()
    return corps.get("data", corps)


def _types(instance, entity_id):
    return [lg[1] for lg in lignes_audit(instance, entity_id)]


def _verifie_creation(instance, admin, entity_id, entity_type):
    lignes = [lg for lg in lignes_audit(instance, entity_id) if lg[1] == "created"]
    assert len(lignes) == 1, lignes
    assert (lignes[0][0], lignes[0][3], lignes[0][4]) == (entity_type, False, admin.id)


def _verifie_modification(instance, entity_id):
    types = _types(instance, entity_id)
    modifs = [t for t in types if t != "created"]
    assert modifs and all(t.endswith("_changed") for t in modifs), types


def _supprime(client, admin, chemin, existe, instance, entity_id, status=200):
    """Sans motif : 400 et rien supprimé ; avec le motif : `deleted` portant l'état avant."""
    sans_motif = client.request("DELETE", chemin, headers=admin.headers)
    assert sans_motif.status_code == 400, sans_motif.text
    assert existe()
    assert "deleted" not in _types(instance, entity_id)

    resp = client.request(
        "DELETE", chemin, headers=admin.headers, json={"reason_code": MOTIF_SUPPRESSION}
    )
    assert resp.status_code == status, resp.text
    (ligne,) = instance.sql(
        "SELECT r.code, l.changed_by::text, l.old_value FROM audit_log l "
        "JOIN audit_reason_code r ON r.id = l.reason_code_id "
        "WHERE l.entity_id = %s AND l.decision_type = 'deleted'",
        (entity_id,),
    )
    assert ligne[:2] == (MOTIF_SUPPRESSION, admin.id)
    assert ligne[2], "l'état avant la suppression doit être conservé"


@pytest.fixture
def famille(instance):
    code = f"F{secrets.token_hex(3)}"
    instance.sql("INSERT INTO stock_family (code, label) VALUES (%s, 'Famille AUDC-31')", (code,))
    instance.sql(
        "INSERT INTO stock_sub_family (family_code, code, label) VALUES (%s, 'S', 'Sous-famille')",
        (code,),
    )
    return code


def _fournisseur(instance):
    return instance.sql(
        "INSERT INTO supplier (name) VALUES (%s) RETURNING id::text",
        (f"Fourn AUDC-31 {secrets.token_hex(3)}",),
    )[0][0]


# ── Plan préventif (AUDC-33) ────────────────────────────────────────────────


def test_plan_preventif_cree_modifie_supprime_est_trace(instance, client, admin):
    classe = instance.sql(
        "INSERT INTO equipement_class (code, label) VALUES (%s, 'Classe AUDC-31') RETURNING id::text",
        (f"C31-{secrets.token_hex(3)}",),
    )[0][0]
    resp = client.post(
        "/preventive-plans",
        headers=admin.headers,
        json={
            "code": f"P31-{secrets.token_hex(3)}",
            "label": "Graissage",
            "equipement_class_id": classe,
            "trigger_type": "periodicity",
            "periodicity_days": 30,
        },
    )
    assert resp.status_code == 201, resp.text
    plan = _data(resp)["id"]
    _verifie_creation(instance, admin, plan, "preventive_plan")

    resp = client.put(
        f"/preventive-plans/{plan}",
        headers=admin.headers,
        json={"label": "Graissage mensuel", "periodicity_days": 45},
    )
    assert resp.status_code == 200, resp.text
    _verifie_modification(instance, plan)

    _supprime(
        client,
        admin,
        f"/preventive-plans/{plan}",
        # Suppression logique : le plan reste en base tant qu'il est actif.
        lambda: instance.sql("SELECT 1 FROM preventive_plan WHERE id = %s AND active", (plan,)),
        instance,
        plan,
        status=204,
    )


# ── Pièce (AUDC-33) ─────────────────────────────────────────────────────────


def test_piece_creee_et_modifiee_est_tracee(instance, client, admin, famille):
    resp = client.post(
        "/parts",
        headers=admin.headers,
        json={"family_code": famille, "sub_family_code": "S", "unit": "pce"},
    )
    assert resp.status_code in (200, 201), resp.text
    part = _data(resp)["id"]
    _verifie_creation(instance, admin, part, "part")

    resp = client.patch(f"/parts/{part}", headers=admin.headers, json={"location": "Rack 3"})
    assert resp.status_code == 200, resp.text
    _verifie_modification(instance, part)


def test_reference_fabricant_supprimee_exige_un_motif(instance, client, admin, famille):
    part = instance.sql(
        "INSERT INTO part (family_code, sub_family_code) VALUES (%s, 'S') RETURNING id::text",
        (famille,),
    )[0][0]
    reference = secrets.token_hex(3)
    resp = client.post(
        f"/parts/{part}/manufacturer-refs",
        headers=admin.headers,
        json={"manufacturer_name": "Fab", "manufacturer_ref": reference},
    )
    assert resp.status_code in (200, 201), resp.text
    # La réponse est la pièce (PartDetail) : la référence créée est dans manufacturer_refs.
    (ref,) = [
        r["id"] for r in _data(resp)["manufacturer_refs"] if r["manufacturer_ref"] == reference
    ]
    _verifie_creation(instance, admin, ref, "part_manufacturer_ref")

    _supprime(
        client,
        admin,
        f"/parts/manufacturer-refs/{ref}",
        lambda: instance.sql("SELECT 1 FROM part_manufacturer_ref WHERE id = %s", (ref,)),
        instance,
        ref,
        status=200,  # la route renvoie la pièce mise à jour
    )


# ── Article de stock (AUDC-34) ──────────────────────────────────────────────


def _article(client, admin, famille, nom=None):
    resp = client.post(
        "/stock-items",
        headers=admin.headers,
        json={
            "name": nom or f"Roulement {secrets.token_hex(3)}",
            "family_code": famille,
            "sub_family_code": "S",
            "quantity": 5,
            "dimension": "6x12",
        },
    )
    assert resp.status_code in (200, 201), resp.text
    return _data(resp)["id"]


def test_article_de_stock_cree_modifie_supprime_est_trace(instance, client, admin, famille):
    article = _article(client, admin, famille)
    _verifie_creation(instance, admin, article, "stock_item")

    resp = client.patch(
        f"/stock-items/{article}/quantity", headers=admin.headers, json={"quantity": 9}
    )
    assert resp.status_code == 200, resp.text
    _verifie_modification(instance, article)

    _supprime(
        client,
        admin,
        f"/stock-items/{article}",
        lambda: instance.sql("SELECT 1 FROM stock_item WHERE id = %s", (article,)),
        instance,
        article,
    )


# ── Fournisseur (AUDC-34) ───────────────────────────────────────────────────


def test_fournisseur_cree_modifie_supprime_est_trace(instance, client, admin):
    resp = client.post("/suppliers", headers=admin.headers, json={"name": "Fourn AUDC-31"})
    assert resp.status_code in (200, 201), resp.text
    fournisseur = _data(resp)["id"]
    _verifie_creation(instance, admin, fournisseur, "supplier")

    resp = client.put(
        f"/suppliers/{fournisseur}",
        headers=admin.headers,
        json={"name": "Fourn AUDC-31", "phone": "0102030405"},
    )
    assert resp.status_code == 200, resp.text
    _verifie_modification(instance, fournisseur)

    _supprime(
        client,
        admin,
        f"/suppliers/{fournisseur}",
        lambda: instance.sql("SELECT 1 FROM supplier WHERE id = %s", (fournisseur,)),
        instance,
        fournisseur,
    )


# ── Ligne de commande fournisseur (AUDC-34) ─────────────────────────────────


def test_ligne_de_commande_creee_modifiee_supprimee_est_tracee(instance, client, admin, famille):
    article = _article(client, admin, famille)
    resp = client.post(
        "/supplier-orders",
        headers=admin.headers,
        json={"supplier_id": _fournisseur(instance), "reason_code": MOTIF},
    )
    assert resp.status_code in (200, 201), resp.text
    commande = _data(resp)["id"]

    resp = client.post(
        "/supplier-order-lines",
        headers=admin.headers,
        json={"supplier_order_id": commande, "stock_item_id": article, "quantity": 3},
    )
    assert resp.status_code in (200, 201), resp.text
    ligne = _data(resp)["id"]
    _verifie_creation(instance, admin, ligne, "supplier_order_line")

    resp = client.patch(
        f"/supplier-order-lines/{ligne}", headers=admin.headers, json={"quantity": 4}
    )
    assert resp.status_code == 200, resp.text
    _verifie_modification(instance, ligne)

    _supprime(
        client,
        admin,
        f"/supplier-order-lines/{ligne}",
        lambda: instance.sql("SELECT 1 FROM supplier_order_line WHERE id = %s", (ligne,)),
        instance,
        ligne,
    )
