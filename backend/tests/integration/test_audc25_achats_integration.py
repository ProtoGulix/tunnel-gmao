"""Achats, commandes fournisseurs et équipements sous l'audit centralisé (ADR 0018, AUDC-25).

Import CSV et répartition : toutes les lignes sont validées avant d'écrire ; l'import est tout
ou rien avec son rapport complet, la répartition ne touche que les demandes répartissables.
Création, modification et suppression tracées par le middleware, sans doublon.
"""

import secrets
import uuid

import pytest

from api.db import get_connection
from api.purchase_requests.repo import PurchaseRequestRepository
from tests.integration.etape2_helpers import MOTIF, lignes_audit

pytestmark = pytest.mark.integration


def _import(client, admin, contenu: str, dry_run=False):
    return client.post(
        "/purchase-requests/import",
        headers=admin.headers,
        files={"file": ("demandes.csv", contenu.encode(), "text/csv")},
        data={
            "intervention_id": str(uuid.uuid4()),
            "col_ref": "ref",
            "col_qty": "qte",
            "dry_run": "true" if dry_run else "false",
        },
    )


def _ids(instance, libelle):
    return [
        r[0]
        for r in instance.sql(
            "SELECT id::text FROM purchase_request WHERE item_label = %s", (libelle,)
        )
    ]


# ── Import CSV : tout ou rien ───────────────────────────────────────────────


def test_import_avec_lignes_invalides_n_ecrit_rien_et_rapporte_toutes_les_erreurs(
    instance, client, admin
):
    s = secrets.token_hex(3)
    csv = (
        "ref;qte\n"
        f"OK1-{s};2\n"
        ";3\n"  # référence vide
        f"KO-{s};abc\n"  # quantité illisible
        f"OK2-{s};3\n"
        f"KO2-{s};99999999999\n"  # hors limites d'un entier SQL
    )

    resp = _import(client, admin, csv)

    assert resp.status_code == 422, resp.text
    body = resp.json()
    assert (body["created"], body["errors"], body["total"]) == (0, 3, 5)
    statuts = {ligne["row"]: ligne["status"] for ligne in body["lines"]}
    assert [statuts[r] for r in (2, 3, 5)] == ["error"] * 3
    assert statuts[1] != "created" and statuts[4] != "created"
    for libelle in (f"OK1-{s}", f"OK2-{s}", f"KO-{s}", f"KO2-{s}"):
        assert _ids(instance, libelle) == []


def test_import_valide_cree_chaque_demande_avec_sa_ligne_created_au_nom_du_jeton(
    instance, client, admin
):
    s = secrets.token_hex(3)

    resp = _import(client, admin, f"ref;qte\nA-{s};2\nB-{s};5\n")

    assert resp.status_code == 201, resp.text
    assert resp.json()["created"] == 2
    for libelle in (f"A-{s}", f"B-{s}"):
        (demande,) = _ids(instance, libelle)
        lignes = [lg for lg in lignes_audit(instance, demande) if lg[1] == "created"]
        assert len(lignes) == 1, lignes
        assert (lignes[0][0], lignes[0][3], lignes[0][4]) == ("purchase_request", False, admin.id)


def test_apercu_dry_run_n_ecrit_rien(instance, client, admin):
    s = secrets.token_hex(3)
    resp = _import(client, admin, f"ref;qte\nA-{s};2\n", dry_run=True)
    assert resp.status_code == 201, resp.text
    assert _ids(instance, f"A-{s}") == []


# ── Répartition ─────────────────────────────────────────────────────────────


@pytest.fixture
def famille(instance):
    code = f"F{secrets.token_hex(3)}"
    instance.sql("INSERT INTO stock_family (code, label) VALUES (%s, 'Famille AUDC-25')", (code,))
    instance.sql(
        "INSERT INTO stock_sub_family (family_code, code, label) VALUES (%s, 'S', 'Sous-famille')",
        (code,),
    )
    return code


def _fournisseur(instance):
    return instance.sql(
        "INSERT INTO supplier (name) VALUES (%s) RETURNING id::text",
        (f"Fourn AUDC-25 {secrets.token_hex(3)}",),
    )[0][0]


def _piece(instance, famille, fournisseur=None):
    """Pièce du catalogue, avec une référence fournisseur si un fournisseur est donné."""
    part = instance.sql(
        "INSERT INTO part (family_code, sub_family_code) VALUES (%s, 'S') RETURNING id::text",
        (famille,),
    )[0][0]
    if fournisseur:
        mfr = instance.sql(
            "INSERT INTO part_manufacturer_ref (part_id, manufacturer_name, manufacturer_ref) "
            "VALUES (%s, 'Fab', %s) RETURNING id",
            (part, secrets.token_hex(3)),
        )[0][0]
        instance.sql(
            "INSERT INTO part_supplier_ref (part_manufacturer_ref_id, supplier_id, supplier_ref) "
            "VALUES (%s, %s, %s)",
            (mfr, fournisseur, secrets.token_hex(3)),
        )
    return part


def _demande_a_repartir(client, admin, part_id):
    resp = client.post(
        "/purchase-requests",
        headers=admin.headers,
        json={
            "part_id": part_id,
            "item_label": f"Pièce {secrets.token_hex(3)}",
            "quantity": 2,
            "reason_code": MOTIF,
        },
    )
    assert resp.status_code in (200, 201), resp.text
    return resp.json().get("data", resp.json())["id"]


def _lignes_commande(instance, demande):
    return instance.sql(
        "SELECT count(*) FROM supplier_order_line_purchase_request WHERE purchase_request_id = %s",
        (demande,),
    )[0][0]


def test_repartition_signale_les_demandes_non_repartissables_sans_ecriture(
    instance, client, admin, famille, monkeypatch
):
    fournisseur = _fournisseur(instance)
    bonne = _demande_a_repartir(client, admin, _piece(instance, famille, fournisseur))
    sans_fournisseur = str(uuid.uuid4())
    piece_sans_ref = _piece(instance, famille)
    original = PurchaseRequestRepository.get_list

    def liste(self, *args, **kwargs):
        # Demande « à répartir » dont la pièce n'a aucune référence fournisseur.
        return original(self, *args, **kwargs) + [
            {
                "id": sans_fournisseur,
                "derived_status": {"code": "PENDING_DISPATCH"},
                "part_id": piece_sans_ref,
                "quantity": 1,
                "item_label": "Sans fournisseur",
            }
        ]

    monkeypatch.setattr(PurchaseRequestRepository, "get_list", liste)

    resp = client.post("/purchase-requests/dispatch", headers=admin.headers)

    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert [e["purchase_request_id"] for e in data["errors"]] == [sans_fournisseur]
    assert _lignes_commande(instance, bonne) == 1
    assert _lignes_commande(instance, sans_fournisseur) == 0
    # Trace : la commande créée porte `created` (système), la demande répartie `dispatched`.
    commandes = [d["supplier_orders"][0]["supplier_order_id"] for d in data["details"]]
    assert len(commandes) >= 1
    assert any(lg[1] == "dispatched" for lg in lignes_audit(instance, bonne))
    creees = [lg for c in commandes for lg in lignes_audit(instance, c) if lg[1] == "created"]
    assert creees and all(lg[2:] == ("SYSTEM_CASCADE", True, admin.id) for lg in creees)


def test_erreur_sql_pendant_la_repartition_donne_500_et_rien_n_est_reparti(
    instance, client, admin, famille, monkeypatch
):
    f1, f2 = _fournisseur(instance), _fournisseur(instance)
    d1 = _demande_a_repartir(client, admin, _piece(instance, famille, f1))
    d2 = _demande_a_repartir(client, admin, _piece(instance, famille, f2))
    original = PurchaseRequestRepository._dispatch_to_supplier
    appels = {"n": 0}

    def echoue_au_second(self, *args, **kwargs):
        appels["n"] += 1
        original(self, *args, **kwargs)
        if appels["n"] == 2:
            get_connection().cursor().execute("SELECT 1/0")

    monkeypatch.setattr(PurchaseRequestRepository, "_dispatch_to_supplier", echoue_au_second)

    resp = client.post("/purchase-requests/dispatch", headers=admin.headers)

    assert resp.status_code == 500, resp.text
    assert appels["n"] >= 2
    assert _lignes_commande(instance, d1) == 0
    assert _lignes_commande(instance, d2) == 0
    assert not instance.sql("SELECT 1 FROM supplier_order WHERE supplier_id IN (%s, %s)", (f1, f2))


# ── Création, modification, suppression ─────────────────────────────────────


def _suppression(client, admin, chemin, corps):
    return client.request("DELETE", chemin, headers=admin.headers, json=corps)


def _data(resp):
    corps = resp.json()
    return corps.get("data", corps)


def test_demande_d_achat_creee_modifiee_supprimee_est_tracee_sans_doublon(instance, client, admin):
    resp = client.post(
        "/purchase-requests",
        headers=admin.headers,
        json={"item_label": "Courroie", "quantity": 1, "reason_code": MOTIF},
    )
    assert resp.status_code in (200, 201), resp.text
    demande = _data(resp)["id"]
    assert [lg[1] for lg in lignes_audit(instance, demande)] == ["created"]

    resp = client.put(
        f"/purchase-requests/{demande}",
        headers=admin.headers,
        json={"item_label": "Courroie", "quantity": 4, "reason_code": MOTIF},
    )
    assert resp.status_code == 200, resp.text
    assert [lg[1] for lg in lignes_audit(instance, demande)] == ["created", "quantity_changed"]

    sans_motif = client.request("DELETE", f"/purchase-requests/{demande}", headers=admin.headers)
    assert sans_motif.status_code == 400, sans_motif.text
    assert _ids(instance, "Courroie")

    resp = _suppression(client, admin, f"/purchase-requests/{demande}", {"reason_code": MOTIF})
    assert resp.status_code == 200, resp.text
    assert [lg[1] for lg in lignes_audit(instance, demande)].count("deleted") == 1
    assert not instance.sql("SELECT 1 FROM purchase_request WHERE id = %s", (demande,))


def test_commande_fournisseur_creee_modifiee_supprimee_est_tracee_sans_doublon(
    instance, client, admin
):
    fournisseur = _fournisseur(instance)
    resp = client.post(
        "/supplier-orders",
        headers=admin.headers,
        json={"supplier_id": fournisseur, "reason_code": MOTIF},
    )
    assert resp.status_code in (200, 201), resp.text
    commande = _data(resp)["id"]
    assert [lg[1] for lg in lignes_audit(instance, commande)] == ["created"]

    resp = client.put(
        f"/supplier-orders/{commande}",
        headers=admin.headers,
        json={"notes": "à relancer", "reason_code": MOTIF},
    )
    assert resp.status_code == 200, resp.text
    assert [lg[1] for lg in lignes_audit(instance, commande)] == ["created", "notes_changed"]

    sans_motif = client.request("DELETE", f"/supplier-orders/{commande}", headers=admin.headers)
    assert sans_motif.status_code == 400, sans_motif.text

    resp = _suppression(client, admin, f"/supplier-orders/{commande}", {"reason_code": MOTIF})
    assert resp.status_code == 200, resp.text
    assert [lg[1] for lg in lignes_audit(instance, commande)].count("deleted") == 1
    assert not instance.sql("SELECT 1 FROM supplier_order WHERE id = %s", (commande,))


def test_equipement_cree_modifie_supprime_est_trace_sans_doublon(instance, client, admin):
    code = f"AU25-{secrets.token_hex(3)}"
    resp = client.post("/equipements", headers=admin.headers, json={"code": code, "name": "Four"})
    assert resp.status_code == 201, resp.text
    equipement = _data(resp)["id"]
    assert [lg[1] for lg in lignes_audit(instance, equipement)] == ["created"]
    assert lignes_audit(instance, equipement)[0][4] == admin.id

    resp = client.patch(
        f"/equipements/{equipement}", headers=admin.headers, json={"name": "Four 2"}
    )
    assert resp.status_code == 200, resp.text
    assert [lg[1] for lg in lignes_audit(instance, equipement)] == ["created", "name_changed"]

    sans_motif = client.request("DELETE", f"/equipements/{equipement}", headers=admin.headers)
    assert sans_motif.status_code == 400, sans_motif.text

    # Seul motif applicable à un équipement dans les données de référence actuelles (voir
    # le compte rendu d'AUDC-25 : aucun motif proposable à l'utilisateur pour supprimer).
    resp = _suppression(
        client, admin, f"/equipements/{equipement}", {"reason_code": "EQUIPMENT_UPDATE"}
    )
    assert resp.status_code == 204, resp.text
    assert [lg[1] for lg in lignes_audit(instance, equipement)].count("deleted") == 1
    assert not instance.sql("SELECT 1 FROM machine WHERE id = %s", (equipement,))
