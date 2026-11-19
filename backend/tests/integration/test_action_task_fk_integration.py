"""Liens action-tâche (migration 0017, TRI-02) : clés étrangères et retour de la tâche à « à faire »."""

import psycopg2
import pytest

from tests.integration.test_taches_ignorer_integration import RAISON, _intervention, _statut, _tache

pytestmark = pytest.mark.integration


def _action(client, admin, instance, intervention_id, task_ids, close=False):
    sous_categorie = instance.sql("SELECT id FROM action_subcategory LIMIT 1")[0][0]
    r = client.post(
        "/intervention-actions",
        json={
            "intervention_id": intervention_id,
            "action_subcategory": sous_categorie,
            "tech": admin.id,
            "complexity_score": 1,
            "time_spent": 0.5,
            "tasks": [{"task_id": t, "close_task": close} for t in task_ids],
            "reason_code": RAISON,
        },
        headers=admin.headers,
    )
    assert r.status_code in (200, 201), r.text
    return r.json().get("data", r.json())["id"]


def _supprimer(client, admin, action_id):
    return client.request(
        "DELETE",
        f"/intervention-actions/{action_id}",
        headers=admin.headers,
        json={"reason_code": RAISON},
    )


def test_migration_pose_les_deux_cles_en_cascade(instance):
    lignes = instance.sql(
        "SELECT conname, confdeltype FROM pg_constraint "
        "WHERE conrelid = 'public.intervention_action_task'::regclass AND contype = 'f'"
    )
    assert dict(lignes) == {
        "intervention_action_task_action_id_fkey": "c",
        "intervention_action_task_task_id_fkey": "c",
    }


def test_lien_orphelin_refuse(instance):
    with pytest.raises(psycopg2.errors.ForeignKeyViolation):
        instance.sql(
            "INSERT INTO intervention_action_task (action_id, task_id) VALUES "
            "('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')"
        )


def test_supprimer_l_action_rend_la_tache_a_faire_puis_supprimable(client, admin, instance):
    intervention_id, _ = _intervention(client, admin, instance)
    task_id = _tache(instance, intervention_id, "tech", True)
    action_id = _action(client, admin, instance, intervention_id, [task_id])
    assert _statut(instance, task_id) == "in_progress"
    assert _supprimer(client, admin, action_id).status_code == 204
    assert _statut(instance, task_id) == "todo"
    assert not instance.sql("SELECT 1 FROM intervention_action_task WHERE task_id = %s", (task_id,))
    # Le lien ne bloque plus la suppression de la tâche.
    r = client.request(
        "DELETE",
        f"/intervention-tasks/{task_id}",
        headers=admin.headers,
        json={"reason_code": RAISON},
    )
    assert r.status_code in (200, 204), r.text


def test_tache_terminee_ne_change_pas(client, admin, instance):
    intervention_id, _ = _intervention(client, admin, instance)
    task_id = _tache(instance, intervention_id, "tech", True)
    action_id = _action(client, admin, instance, intervention_id, [task_id], close=True)
    assert _statut(instance, task_id) == "done"
    assert _supprimer(client, admin, action_id).status_code == 204
    assert _statut(instance, task_id) == "done"


def test_tache_encore_portee_par_une_autre_action_ne_change_pas(client, admin, instance):
    intervention_id, _ = _intervention(client, admin, instance)
    task_id = _tache(instance, intervention_id, "tech", True)
    premiere = _action(client, admin, instance, intervention_id, [task_id])
    _action(client, admin, instance, intervention_id, [task_id])
    assert _supprimer(client, admin, premiere).status_code == 204
    assert _statut(instance, task_id) == "in_progress"
