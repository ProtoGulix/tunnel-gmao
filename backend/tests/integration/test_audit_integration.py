"""Traçabilité : audit_log.changed_by vient du jeton (ADR 0005), vrai AuditMiddleware."""

import secrets

import pytest

pytestmark = pytest.mark.integration


@pytest.fixture
def intervention(instance, make_user):
    """Une machine et une intervention (statut initial « ouvert » posé par trigger)."""
    pilote = make_user("TECH")
    machine_id = instance.sql(
        "INSERT INTO machine (code, name) VALUES (%s, 'Presse IT') RETURNING id",
        (f"IT-{secrets.token_hex(3)}",),
    )[0][0]
    inter_id = instance.sql(
        "INSERT INTO intervention (title, machine_id, type_inter, tech_id, tech_initials) "
        "VALUES ('Fuite huile', %s, 'COR', %s, 'IT') RETURNING id",
        (machine_id, pilote.id),
    )[0][0]
    return str(inter_id)


def _auteurs(instance, entity_id, decision_type):
    rows = instance.sql(
        "SELECT changed_by::text FROM audit_log WHERE entity_id = %s AND decision_type = %s",
        (entity_id, decision_type),
    )
    return [r[0] for r in rows]


def test_changement_de_statut_trace_lauteur_du_jeton(instance, client, make_user, intervention):
    auteur = make_user("TECH")
    autre = make_user("TECH")  # « au nom de » : déclaratif, jamais une preuve d'identité
    resp = client.post(
        "/intervention-status-log",
        headers=auteur.headers,
        json={
            "intervention_id": intervention,
            "status_from": "ouvert",
            "status_to": "attente_pieces",
            "technician_id": autre.id,
            "date": "2026-10-06T10:00:00",
        },
    )
    assert resp.status_code == 201, resp.text
    assert _auteurs(instance, intervention, "status_changed") == [auteur.id]


def test_mutation_tracee_par_le_middleware_ecrit_lauteur_du_jeton(
    instance, client, make_user, intervention
):
    auteur = make_user("RESP")
    resp = client.put(
        f"/interventions/{intervention}",
        headers=auteur.headers,
        json={"title": "Fuite huile circuit 2", "reason_code": "CLIENT_REQUEST"},
    )
    assert resp.status_code == 200, resp.text
    assert _auteurs(instance, intervention, "title_changed") == [auteur.id]


def test_export_csv_commande_neutralise_une_formule(instance, client, make_user):
    acheteur = make_user("ACHETEUR")
    fournisseur = instance.sql("INSERT INTO supplier (name) VALUES ('Fourn IT') RETURNING id")[0][0]
    article = instance.sql(
        "INSERT INTO stock_item (name, family_code, sub_family_code, dimension) "
        "VALUES ('=1+1', 'F', 'SF', 'd') RETURNING id"
    )[0][0]
    commande = instance.sql(
        "INSERT INTO supplier_order (order_number, supplier_id) VALUES (%s, %s) RETURNING id",
        (f"CMD-IT-{secrets.token_hex(3)}", fournisseur),
    )[0][0]
    instance.sql(
        "INSERT INTO supplier_order_line (supplier_order_id, stock_item_id, quantity, is_selected) "
        "VALUES (%s, %s, 2, true)",
        (commande, article),
    )
    resp = client.post(f"/supplier-orders/{commande}/export/csv", headers=acheteur.headers)
    assert resp.status_code == 200, resp.text
    cellules = [ligne.split(";")[0] for ligne in resp.text.splitlines()]
    assert "'=1+1" in cellules
    assert "=1+1" not in cellules
