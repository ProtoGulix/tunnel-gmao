"""AUDC-34 : familles de stock (uuid déterministe du code), sous-familles, liens articles-
fournisseurs, lignes de commande (liens demandes d'achat), migration 0011."""

import secrets

import pytest

from api.audits.entity_ids import stock_family_entity_id
from tests.integration.etape2_helpers import MOTIF, lignes_audit

pytestmark = pytest.mark.integration


def _data(resp):
    corps = resp.json()
    return corps.get("data", corps)


def _ecrit(instance, entity_id):
    return instance.sql(
        "SELECT decision_type, old_value, new_value, changed_by::text FROM audit_log "
        "WHERE entity_id = %s ORDER BY logged_at, decision_type",
        (entity_id,),
    )


def test_migration_0011_regle_routiniere_famille(instance):
    assert instance.sql(
        "SELECT is_routine, default_reason_code FROM audit_rule "
        "WHERE entity_type = 'stock_family' AND field IS NULL"
    ) == [(True, "ROUTINE")]
    assert instance.sql(
        "SELECT 'stock_family' = ANY(entity_types) FROM audit_reason_code WHERE code = 'ROUTINE'"
    ) == [(True,)]


def test_famille_creee_et_renommee_sous_uuid_du_code(instance, client, admin):
    code = f"FAM{secrets.token_hex(3)}".upper()
    resp = client.post(
        "/stock-families", headers=admin.headers, json={"code": code, "label": "Famille"}
    )
    assert resp.status_code == 201, resp.text
    lignes = _ecrit(instance, str(stock_family_entity_id(code)))
    assert [lg[0] for lg in lignes] == ["created"]
    assert lignes[0][2]["code"] == code
    assert lignes[0][3] == admin.id

    resp = client.patch(
        f"/stock-families/{code}", headers=admin.headers, json={"code": code, "label": "Autre"}
    )
    assert resp.status_code == 200, resp.text
    lignes = _ecrit(instance, str(stock_family_entity_id(code)))
    assert [lg[0] for lg in lignes] == ["created", "label_changed"]
    assert lignes[1][1] == {"code": code, "label": "Famille"}
    assert lignes[1][2] == {"code": code, "label": "Autre"}


def test_famille_renommee_garde_l_ancien_code_comme_identifiant(instance, client, admin):
    ancien = f"AN{secrets.token_hex(3)}".upper()
    nouveau = f"NV{secrets.token_hex(3)}".upper()
    client.post("/stock-families", headers=admin.headers, json={"code": ancien, "label": "L"})
    resp = client.patch(
        f"/stock-families/{ancien}", headers=admin.headers, json={"code": nouveau, "label": "L"}
    )
    assert resp.status_code == 200, resp.text
    lignes = _ecrit(instance, str(stock_family_entity_id(ancien)))
    assert [lg[0] for lg in lignes] == ["created", "code_changed"]
    assert lignes[1][1]["code"] == ancien and lignes[1][2]["code"] == nouveau


def test_famille_refusee_ne_laisse_aucune_trace(instance, client, admin):
    code = f"DB{secrets.token_hex(3)}".upper()
    client.post("/stock-families", headers=admin.headers, json={"code": code, "label": "L"})
    resp = client.post("/stock-families", headers=admin.headers, json={"code": code, "label": "L"})
    assert resp.status_code >= 400
    assert len(_ecrit(instance, str(stock_family_entity_id(code)))) == 1


def test_sous_famille_creee_et_modifiee_sous_son_uuid(instance, client, admin):
    code = f"SF{secrets.token_hex(3)}".upper()
    client.post("/stock-families", headers=admin.headers, json={"code": code, "label": "L"})
    resp = client.post(
        f"/stock-sub-families/{code}", headers=admin.headers, json={"code": "S1", "label": "Un"}
    )
    assert resp.status_code == 201, resp.text
    sous_famille = instance.sql(
        "SELECT id::text FROM stock_sub_family WHERE family_code = %s AND code = 'S1'", (code,)
    )[0][0]
    assert [lg[1] for lg in lignes_audit(instance, sous_famille)] == ["created"]

    resp = client.patch(
        f"/stock-sub-families/{code}/S1", headers=admin.headers, json={"label": "Deux"}
    )
    assert resp.status_code == 200, resp.text
    assert [lg[1] for lg in lignes_audit(instance, sous_famille)] == ["created", "label_changed"]


def _article_et_fournisseurs(instance, client, admin):
    famille = f"F{secrets.token_hex(3)}"
    instance.sql("INSERT INTO stock_family (code, label) VALUES (%s, 'F')", (famille,))
    instance.sql(
        "INSERT INTO stock_sub_family (family_code, code, label) VALUES (%s, 'S', 'S')", (famille,)
    )
    article = _data(
        client.post(
            "/stock-items",
            headers=admin.headers,
            json={
                "name": f"Art {secrets.token_hex(3)}",
                "family_code": famille,
                "sub_family_code": "S",
                "quantity": 1,
                "dimension": "d",
            },
        )
    )["id"]
    fournisseur = _data(
        client.post(
            "/suppliers", headers=admin.headers, json={"name": f"Fo {secrets.token_hex(3)}"}
        )
    )["id"]
    return article, fournisseur


def _lien(client, admin, article, fournisseur, preferred=False):
    resp = client.post(
        "/stock-item-suppliers",
        headers=admin.headers,
        json={
            "stock_item_id": article,
            "supplier_id": fournisseur,
            "supplier_ref": f"REF{secrets.token_hex(3)}",
            "is_preferred": preferred,
        },
    )
    assert resp.status_code in (200, 201), resp.text
    return _data(resp)["id"]


def test_lien_article_fournisseur_cree_prefere_supprime(instance, client, admin):
    article, fournisseur = _article_et_fournisseurs(instance, client, admin)
    premier = _lien(client, admin, article, fournisseur, preferred=True)
    autre = _data(
        client.post(
            "/suppliers", headers=admin.headers, json={"name": f"Fo {secrets.token_hex(3)}"}
        )
    )["id"]
    second = _lien(client, admin, article, autre)
    assert [lg[1] for lg in lignes_audit(instance, premier)] == ["created"]

    resp = client.post(f"/stock-item-suppliers/{second}/set-preferred", headers=admin.headers)
    assert resp.status_code == 200, resp.text
    # Le lien qui perd le statut préféré est tracé lui aussi.
    assert "is_preferred_changed" in [lg[1] for lg in lignes_audit(instance, premier)]
    assert "is_preferred_changed" in [lg[1] for lg in lignes_audit(instance, second)]

    resp = client.request(
        "DELETE",
        f"/stock-item-suppliers/{premier}",
        headers=admin.headers,
        json={"reason_code": "DELETE_CREATED_BY_MISTAKE"},
    )
    assert resp.status_code == 204, resp.text
    assert "deleted" in [lg[1] for lg in lignes_audit(instance, premier)]


def test_ligne_de_commande_liens_demandes_d_achat_traces(instance, client, admin):
    article, fournisseur = _article_et_fournisseurs(instance, client, admin)
    commande = _data(
        client.post(
            "/supplier-orders",
            headers=admin.headers,
            json={"supplier_id": fournisseur, "reason_code": MOTIF},
        )
    )["id"]
    ligne = _data(
        client.post(
            "/supplier-order-lines",
            headers=admin.headers,
            json={"supplier_order_id": commande, "stock_item_id": article, "quantity": 2},
        )
    )["id"]
    demande = instance.sql(
        "INSERT INTO purchase_request (item_label, quantity) VALUES ('x', 1) RETURNING id::text"
    )[0][0]

    resp = client.post(
        f"/supplier-order-lines/{ligne}/purchase-requests",
        headers=admin.headers,
        json={"purchase_request_id": demande, "quantity": 1},
    )
    assert resp.status_code == 200, resp.text
    resp = client.request(
        "DELETE",
        f"/supplier-order-lines/{ligne}/purchase-requests/{demande}",
        headers=admin.headers,
        json={"reason_code": "DELETE_CREATED_BY_MISTAKE"},
    )
    assert resp.status_code == 200, resp.text
    types = [lg[1] for lg in lignes_audit(instance, ligne)]
    # Retirer un lien n'est pas supprimer la ligne : aucune ligne « deleted ».
    assert sorted(types) == ["created", "purchase_requests_changed", "purchase_requests_changed"]
