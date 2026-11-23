"""Auteur réel des changements d'état d'une demande (CSV-03, ADR 0005)."""

import pytest

from tests.integration.etape2_helpers import MOTIF, demande, intervention_liee, machine

pytestmark = pytest.mark.integration


def _auteurs(instance, request_id):
    rows = instance.sql(
        "SELECT status_to, changed_by::text FROM request_status_log "
        "WHERE request_id = %s ORDER BY date, id",
        (request_id,),
    )
    return dict(rows)


def _transition(client, account, request_id, **corps):
    return client.post(
        f"/intervention-requests/{request_id}/transition",
        headers=account.headers,
        json=corps,
    )


def test_creation_porte_l_auteur_du_jeton(client, admin, instance):
    request_id = demande(client, admin, machine(instance))
    assert _auteurs(instance, request_id)["nouvelle"] == admin.id


def test_rejet_ignore_le_changed_by_du_corps(client, admin, make_user, instance):
    autre = make_user("TECH")
    request_id = demande(client, admin, machine(instance))
    r = _transition(
        client,
        admin,
        request_id,
        status_to="rejetee",
        changed_by=autre.id,
        reason_code="REJECT_ALREADY_HANDLED",
    )
    assert r.status_code == 200, r.text
    assert _auteurs(instance, request_id)["rejetee"] == admin.id


def test_acceptation_ignore_le_changed_by_du_corps(client, admin, make_user, instance):
    autre = make_user("TECH")
    request_id = demande(client, admin, machine(instance))
    r = _transition(
        client,
        admin,
        request_id,
        status_to="acceptee",
        changed_by=autre.id,
        type_inter="CUR",
        tech_id=admin.id,
        tech_initials="AD",
        reason_code=MOTIF,
    )
    assert r.status_code == 200, r.text
    assert _auteurs(instance, request_id)["acceptee"] == admin.id


def test_cloture_porte_l_auteur_du_jeton(client, admin, instance, cur_sans_constat):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    r = client.put(
        f"/interventions/{intervention_id}",
        json={"status_actual": "ferme", "reason_code": "ROUTINE"},
        headers=admin.headers,
    )
    assert r.status_code == 200, r.text
    assert _auteurs(instance, request_id)["cloturee"] == admin.id


def test_detail_expose_le_nom_de_l_auteur(client, admin, instance):
    request_id = demande(client, admin, machine(instance))
    r = client.get(f"/intervention-requests/{request_id}", headers=admin.headers)
    assert r.status_code == 200, r.text
    corps = r.json().get("data", r.json())
    nom = instance.sql(
        "SELECT NULLIF(concat_ws(' ', first_name, last_name), '') FROM tunnel_user WHERE id = %s",
        (admin.id,),
    )[0][0]
    entree = corps["status_log"][0]
    assert entree["changed_by"] == admin.id
    assert entree["changed_by_name"] == nom
