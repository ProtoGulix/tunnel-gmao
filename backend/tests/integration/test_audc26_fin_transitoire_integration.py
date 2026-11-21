"""Fin du transitoire (AUDC-26) : le motif est lu par le middleware, plus par les schémas."""

import pytest

from tests.integration.etape2_helpers import demande, lignes_audit, machine

pytestmark = pytest.mark.integration


def _nouvelle_demande(client, admin, instance, corps_extra=None):
    machine_id = machine(instance)
    corps = {"machine_id": machine_id, "demandeur_nom": "Atelier", "description": "AUDC-26"}
    corps.update(corps_extra or {})
    return client.post("/intervention-requests", headers=admin.headers, json=corps)


def test_un_corps_sans_motif_passe_sur_une_route_routiniere(client, admin, instance):
    resp = _nouvelle_demande(client, admin, instance)
    assert resp.status_code == 201, resp.text
    request_id = resp.json().get("data", resp.json())["id"]
    lignes = lignes_audit(instance, request_id)
    assert [(x[0], x[1], x[2]) for x in lignes] == [("request", "created", "ROUTINE")]


def test_un_corps_avec_reason_code_est_toujours_accepte(client, admin, instance):
    resp = _nouvelle_demande(client, admin, instance, {"reason_code": "ROUTINE"})
    assert resp.status_code == 201, resp.text


def test_une_transition_sans_motif_est_refusee_sans_motif_en_dur(client, admin, instance):
    """Pas de règle routinière pour une transition : plus de repli silencieux sur OTHER.

    Depuis DEMO-08, la règle request.status_to est routinière dans les données de départ
    (comme en production) ; le test la rend non routinière le temps de son exécution.
    """
    request_id = demande(client, admin, machine(instance))
    regle = "UPDATE audit_rule SET is_routine = %s WHERE entity_type = 'request' AND field = 'status_to'"
    instance.sql(regle, (False,))
    try:
        resp = client.post(
            f"/intervention-requests/{request_id}/transition",
            headers=admin.headers,
            json={"status_to": "en_attente"},
        )
    finally:
        instance.sql(regle, (True,))
    assert resp.status_code == 400, resp.text
    assert resp.json()["audit"]["required"] is True
    statut = instance.sql("SELECT statut FROM intervention_request WHERE id = %s", (request_id,))
    assert statut == [("nouvelle",)]


def test_une_transition_avec_motif_trace_le_motif_envoye(client, admin, instance):
    request_id = demande(client, admin, machine(instance))
    resp = client.post(
        f"/intervention-requests/{request_id}/transition",
        headers=admin.headers,
        json={"status_to": "en_attente", "reason_code": "OTHER", "reason_text": "Attente pièce"},
    )
    assert resp.status_code == 200, resp.text
    codes = {x[2] for x in lignes_audit(instance, request_id) if x[1] == "statut_changed"}
    assert codes == {"OTHER"}


def test_un_rejet_avec_other_sans_texte_est_refuse(client, admin, instance):
    request_id = demande(client, admin, machine(instance))
    resp = client.post(
        f"/intervention-requests/{request_id}/transition",
        headers=admin.headers,
        json={"status_to": "rejetee", "reason_code": "OTHER"},
    )
    assert resp.status_code == 400, resp.text
