"""Titre d'une intervention tiré de la demande, même longue (FTL-01).

Une demande issue d'un constat dépasse 200 caractères : sans titre fourni, le titre de
l'intervention en est une coupe sur une frontière de mot ; fourni trop long, 400 métier.
"""

import pytest

from api.interventions.validators import TITLE_MAX_LENGTH, title_from_description
from tests.integration.etape2_helpers import MOTIF, machine

pytestmark = pytest.mark.integration

# 257 caractères, mots de 9 caractères séparés d'un espace
LONGUE = " ".join(["maintenue"] * 26)[:257].rstrip()


def _demande(client, admin, machine_id, description=LONGUE):
    resp = client.post(
        "/intervention-requests",
        headers=admin.headers,
        json={
            "machine_id": machine_id,
            "demandeur_nom": "Atelier",
            "description": description,
            "reason_code": MOTIF,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json().get("data", resp.json())["id"]


def _corps(machine_id, admin, **extra):
    return {
        "machine_id": machine_id,
        "type_inter": "CUR",
        "tech_id": admin.id,
        "priority": "normal",
        "reason_code": MOTIF,
        **extra,
    }


def _titre(instance, intervention_id):
    return instance.sql("SELECT title FROM intervention WHERE id = %s", (intervention_id,))[0][0]


def test_la_description_de_test_depasse_la_limite():
    assert len(LONGUE) > TITLE_MAX_LENGTH
    attendu = title_from_description(LONGUE)
    assert len(attendu) <= TITLE_MAX_LENGTH and attendu.endswith("…")


def test_acceptation_d_une_demande_longue(client, admin, instance):
    machine_id = machine(instance)
    request_id = _demande(client, admin, machine_id)
    resp = client.post(
        f"/intervention-requests/{request_id}/transition",
        headers=admin.headers,
        json={
            "status_to": "acceptee",
            "type_inter": "CUR",
            "tech_id": admin.id,
            "tech_initials": "AD",
            "reason_code": MOTIF,
        },
    )
    assert resp.status_code == 200, resp.text
    intervention_id = instance.sql(
        "SELECT intervention_id::text FROM intervention_request WHERE id = %s", (request_id,)
    )[0][0]
    assert _titre(instance, intervention_id) == title_from_description(LONGUE)


def test_creation_avec_request_id_et_demande_longue(client, admin, instance):
    machine_id = machine(instance)
    request_id = _demande(client, admin, machine_id)
    resp = client.post(
        "/interventions",
        headers=admin.headers,
        json=_corps(machine_id, admin, request_id=request_id),
    )
    assert resp.status_code == 201, resp.text
    intervention_id = resp.json().get("data", resp.json())["id"]
    assert _titre(instance, intervention_id) == title_from_description(LONGUE)


def test_creation_avec_request_longue(client, admin, instance):
    machine_id = machine(instance)
    resp = client.post(
        "/interventions",
        headers=admin.headers,
        json=_corps(machine_id, admin, request={"demandeur_nom": "Atelier", "description": LONGUE}),
    )
    assert resp.status_code == 201, resp.text
    intervention_id = resp.json().get("data", resp.json())["id"]
    assert _titre(instance, intervention_id) == title_from_description(LONGUE)


def test_titre_fourni_court_inchange(client, admin, instance):
    machine_id = machine(instance)
    request_id = _demande(client, admin, machine_id)
    resp = client.post(
        "/interventions",
        headers=admin.headers,
        json=_corps(machine_id, admin, request_id=request_id, title="Fuite presse"),
    )
    assert resp.status_code == 201, resp.text
    intervention_id = resp.json().get("data", resp.json())["id"]
    assert _titre(instance, intervention_id) == "Fuite presse"


def test_titre_fourni_trop_long_refuse_en_400(client, admin, instance):
    machine_id = machine(instance)
    resp = client.post(
        "/interventions",
        headers=admin.headers,
        json=_corps(
            machine_id,
            admin,
            title="t" * (TITLE_MAX_LENGTH + 1),
            request={"demandeur_nom": "Atelier", "description": "Fuite"},
        ),
    )
    assert resp.status_code == 400, resp.text


def test_titre_fourni_trop_long_a_l_acceptation_refuse_en_400(client, admin, instance):
    machine_id = machine(instance)
    request_id = _demande(client, admin, machine_id)
    resp = client.post(
        f"/intervention-requests/{request_id}/transition",
        headers=admin.headers,
        json={
            "status_to": "acceptee",
            "type_inter": "CUR",
            "tech_id": admin.id,
            "tech_initials": "AD",
            "title": "t" * (TITLE_MAX_LENGTH + 1),
            "reason_code": MOTIF,
        },
    )
    assert resp.status_code == 400, resp.text
