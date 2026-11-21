"""Auteur de chaque ligne de journal de statut écrite par une requête (CASC-05, ADR 0029).

Garde : après les parcours qui écrivent request_status_log et intervention_status_log
(création, fermeture, journal manuel, /repair), aucune ligne n'a d'auteur vide.
"""

import pytest

from tests.integration.etape2_helpers import MOTIF, intervention_liee, tache
from tests.integration.test_cont02_repair_integration import _orpheline

pytestmark = pytest.mark.integration


def _sans_auteur(instance, ids_demandes, ids_interventions):
    """Lignes de journal sans auteur pour ces demandes et ces interventions."""
    demandes = instance.sql(
        "SELECT request_id::text, status_to FROM request_status_log "
        "WHERE request_id = ANY(%s::uuid[]) AND changed_by IS NULL",
        (list(ids_demandes),),
    )
    interventions = instance.sql(
        "SELECT intervention_id::text, status_to FROM intervention_status_log "
        "WHERE intervention_id = ANY(%s::uuid[]) AND changed_by IS NULL",
        (list(ids_interventions),),
    )
    return demandes, interventions


def test_la_ligne_ouvert_vient_du_trigger_avec_l_auteur(instance, client, admin):
    intervention_id, _ = intervention_liee(client, admin, instance)
    lignes = instance.sql(
        "SELECT changed_by::text FROM intervention_status_log "
        "WHERE intervention_id = %s AND status_from IS NULL",
        (intervention_id,),
    )
    assert lignes == [(admin.id,)]


def test_journal_manuel_porte_l_auteur_du_jeton_et_garde_le_technicien_declare(
    instance, client, admin, make_user
):
    intervention_id, _ = intervention_liee(client, admin, instance)
    autre = make_user("TECH").id
    statut = instance.sql(
        "SELECT id FROM intervention_status_ref WHERE id NOT IN ('ouvert', 'ferme') LIMIT 1"
    )[0][0]

    resp = client.post(
        "/intervention-status-log",
        headers=admin.headers,
        json={
            "intervention_id": intervention_id,
            "status_to": statut,
            "technician_id": autre,
            "date": "2026-11-01T10:00:00",
        },
    )

    assert resp.status_code == 201, resp.text
    lignes = instance.sql(
        "SELECT changed_by::text, technician_id::text FROM intervention_status_log "
        "WHERE intervention_id = %s AND status_to = %s",
        (intervention_id, statut),
    )
    # Le trigger de statut écrit aussi sa propre ligne (technicien vide) : les deux ont l'auteur.
    assert {ligne[0] for ligne in lignes} == {admin.id}
    assert autre in [ligne[1] for ligne in lignes]


def test_repair_ecrit_la_ligne_de_demande_avec_l_auteur(instance, client, admin):
    reparee = _orpheline(client, admin, instance)

    resp = client.post("/intervention-requests/repair", headers=admin.headers)

    assert resp.status_code == 200, resp.text
    lignes = instance.sql(
        "SELECT changed_by::text FROM request_status_log "
        "WHERE request_id = %s AND status_to = 'cloturee' ORDER BY date DESC LIMIT 1",
        (reparee,),
    )
    assert lignes == [(admin.id,)]


def test_garde_aucune_ligne_de_journal_sans_auteur_apres_les_parcours(instance, client, admin):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    resp = client.put(
        f"/interventions/{intervention_id}",
        headers=admin.headers,
        json={"status_actual": "ferme"},
    )
    assert resp.status_code == 200, resp.text
    # La mise en place de l'orpheline passe par SQL (hors requête, donc sans auteur) : seules
    # comptent les lignes ajoutées par /repair.
    orpheline = _orpheline(client, admin, instance)
    avant = _sans_auteur(instance, [orpheline], [])
    assert client.post("/intervention-requests/repair", headers=admin.headers).status_code == 200

    assert _sans_auteur(instance, [request_id], [intervention_id]) == ([], [])
    assert _sans_auteur(instance, [orpheline], []) == avant


def test_patch_d_une_action_qui_clot_une_tache_remplit_closed_by(instance, client, admin):
    intervention_id, _ = intervention_liee(client, admin, instance)
    task_id = tache(instance, intervention_id, "À finir par PATCH")
    deja_liee = tache(instance, intervention_id, "Liée à la création")
    sous_categorie = instance.sql("SELECT id FROM action_subcategory LIMIT 1")[0][0]
    resp = client.post(
        "/intervention-actions",
        headers=admin.headers,
        json={
            "intervention_id": intervention_id,
            "action_subcategory": sous_categorie,
            "tech": admin.id,
            "complexity_score": 1,
            "time_spent": 0.5,
            "reason_code": MOTIF,
            "tasks": [{"task_id": deja_liee}],
        },
    )
    assert resp.status_code == 200, resp.text
    action_id = resp.json().get("data", resp.json())["id"]

    resp = client.patch(
        f"/intervention-actions/{action_id}",
        headers=admin.headers,
        json={"tasks": [{"task_id": task_id, "close_task": True}]},
    )

    assert resp.status_code == 200, resp.text
    assert instance.sql(
        "SELECT status, closed_by::text FROM intervention_task WHERE id = %s", (task_id,)
    ) == [("done", admin.id)]
