"""Qualité des données : une demande d'achat liée à une pièce n'est pas « sans article ».

Les demandes d'achat sont liées aux pièces par part_id (cahier fonctionnel 1.6) ; le
détecteur testait l'ancien stock_item_id et signalait presque toutes les demandes
(backlog qualite-demande-sans-piece).
"""

import secrets

import pytest

pytestmark = pytest.mark.integration


def _data(resp):
    corps = resp.json()
    return corps.get("data", corps)


def _demande(instance, part_id=None):
    return str(
        instance.sql(
            "INSERT INTO purchase_request (item_label, quantity, part_id) "
            "VALUES (%s, 1, %s) RETURNING id",
            (f"Essai {secrets.token_hex(3)}", part_id),
        )[0][0]
    )


def _piece(instance):
    famille = f"Q{secrets.token_hex(3)}".upper()
    instance.sql("INSERT INTO stock_family (code, label) VALUES (%s, 'Essai')", (famille,))
    instance.sql(
        "INSERT INTO stock_sub_family (family_code, code, label) VALUES (%s, %s, 'Essai')",
        (famille, famille),
    )
    return instance.sql(
        "INSERT INTO part (family_code, sub_family_code) VALUES (%s, %s) RETURNING id",
        (famille, famille),
    )[0][0]


def test_seule_la_demande_sans_piece_est_signalee(instance, client, admin):
    avec_piece = _demande(instance, _piece(instance))
    sans_piece = _demande(instance)
    resp = client.get("/stats/qualite-donnees", headers=admin.headers)
    assert resp.status_code == 200, resp.text
    signalees = {
        p["entite_id"] for p in _data(resp)["problemes"] if p["code"] == "demande_sans_stock_item"
    }
    assert sans_piece in signalees
    assert avec_piece not in signalees
