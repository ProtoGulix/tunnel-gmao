"""Priorité validée à l'écriture (ADR 0039) : seule `normal` désigne la priorité normale."""

import secrets

import pytest

from tests.integration.etape2_helpers import MOTIF, demande, intervention_liee, machine

pytestmark = pytest.mark.integration


def _corps(admin, machine_id, request_id, priority):
    return {
        "machine_id": machine_id,
        "type_inter": "CUR",
        "tech_id": admin.id,
        "title": "Priorité à valider",
        "priority": priority,
        "request_id": request_id,
        "reason_code": MOTIF,
    }


@pytest.mark.parametrize("priorite", ["normale", "critique"])
def test_la_creation_refuse_une_priorite_hors_liste_et_n_ecrit_rien(
    client, admin, instance, priorite
):
    machine_id = machine(instance)
    request_id = demande(client, admin, machine_id)
    resp = client.post(
        "/interventions",
        headers=admin.headers,
        json=_corps(admin, machine_id, request_id, priorite),
    )
    assert resp.status_code == 400, resp.text
    assert priorite in resp.text
    assert instance.sql(
        "SELECT intervention_id FROM intervention_request WHERE id = %s", (request_id,)
    ) == [(None,)]


def test_la_mise_a_jour_refuse_normale(client, admin, instance):
    intervention_id, _ = intervention_liee(client, admin, instance)
    resp = client.put(
        f"/interventions/{intervention_id}",
        headers=admin.headers,
        json={"priority": "normale", "reason_code": MOTIF},
    )
    assert resp.status_code == 400, resp.text
    assert instance.sql("SELECT priority FROM intervention WHERE id = %s", (intervention_id,)) == [
        ("normal",)
    ]


def test_la_mise_a_jour_accepte_une_priorite_valide(client, admin, instance):
    intervention_id, _ = intervention_liee(client, admin, instance)
    resp = client.put(
        f"/interventions/{intervention_id}",
        headers=admin.headers,
        json={"priority": "urgent", "reason_code": MOTIF},
    )
    assert resp.status_code == 200, resp.text


def test_l_acceptation_sans_priorite_cree_l_intervention_en_normal(client, admin, instance):
    machine_id = machine(instance)
    request_id = demande(client, admin, machine_id)
    resp = client.post(
        f"/intervention-requests/{request_id}/transition",
        headers=admin.headers,
        json={
            "status_to": "acceptee",
            "type_inter": "CUR",
            "tech_id": admin.id,
            "reason_code": MOTIF,
        },
    )
    assert resp.status_code == 200, resp.text
    assert instance.sql(
        "SELECT i.priority FROM intervention i "
        "JOIN intervention_request r ON r.intervention_id = i.id WHERE r.id = %s",
        (request_id,),
    ) == [("normal",)]


def test_l_acceptation_refuse_normale(client, admin, instance):
    machine_id = machine(instance)
    request_id = demande(client, admin, machine_id)
    resp = client.post(
        f"/intervention-requests/{request_id}/transition",
        headers=admin.headers,
        json={
            "status_to": "acceptee",
            "type_inter": "CUR",
            "tech_id": admin.id,
            "priority": "normale",
            "reason_code": MOTIF,
        },
    )
    assert resp.status_code == 400, resp.text


def test_le_tri_de_severite_range_normal_entre_important_et_faible(client, admin, instance):
    marque = f"Tri{secrets.token_hex(3)}"
    ids = {}
    for priorite in ("faible", "normal", "urgent", "important"):
        # Une machine par intervention : le code (machine, type, jour, initiales) est unique.
        machine_id = machine(instance)
        request_id = demande(client, admin, machine_id)
        corps = _corps(admin, machine_id, request_id, priorite)
        corps["title"] = marque
        resp = client.post("/interventions", headers=admin.headers, json=corps)
        assert resp.status_code == 201, resp.text
        ids[resp.json().get("data", resp.json())["id"]] = priorite
    resp = client.get(
        "/interventions",
        headers=admin.headers,
        params={"sort": "-priority", "search": marque, "limit": 50},
    )
    assert resp.status_code == 200, resp.text
    corps = resp.json()
    lignes = corps["items"]
    ordre = [ids[i["id"]] for i in lignes if i["id"] in ids]
    assert ordre == ["urgent", "important", "normal", "faible"]
