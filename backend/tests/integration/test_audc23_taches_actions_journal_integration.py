"""Tâches, actions et journal de statut sous l'audit centralisé (AUDC-23, ADR 0018).

Le middleware est seul à écrire l'audit : une ligne par changement, sans doublon, avec le
motif de la requête et l'auteur du jeton. Une action qui ferme des tâches dépose un
événement par tâche. Les tests marqués xfail(strict) échouent tant qu'AUDC-23 n'est pas
livré ; les autres verrouillent un comportement déjà correct (pas de doublon).
"""

from collections import Counter

import pytest

from tests.integration.etape2_helpers import MOTIF, intervention_liee, lignes_audit, tache

pytestmark = pytest.mark.integration


@pytest.fixture
def ouverte(client, admin, instance):
    """Intervention ouverte, liée à sa demande."""
    return intervention_liee(client, admin, instance)[0]


def _action(client, admin, instance, intervention_id, tasks=None):
    sous_categorie = instance.sql("SELECT id FROM action_subcategory LIMIT 1")[0][0]
    corps = {
        "intervention_id": intervention_id,
        "action_subcategory": sous_categorie,
        "tech": admin.id,
        "complexity_score": 1,
        "time_spent": 0.5,
        "reason_code": MOTIF,
    }
    # Une action doit viser au moins une tâche (règle métier existante).
    corps["tasks"] = tasks or [{"task_id": tache(instance, intervention_id, "Tâche liée")}]
    resp = client.post("/intervention-actions", headers=admin.headers, json=corps)
    assert resp.status_code == 200, resp.text
    return resp.json().get("data", resp.json())["id"]


def _types(instance, entity_id):
    return Counter(ligne[1] for ligne in lignes_audit(instance, entity_id))


# ── Tâches ──────────────────────────────────────────────────────────────────


def test_creer_une_tache_ecrit_une_ligne_created_au_nom_du_jeton(client, admin, instance, ouverte):
    resp = client.post(
        "/intervention-tasks",
        headers=admin.headers,
        json={"intervention_id": ouverte, "label": "Nouvelle tâche", "origin": "tech"},
    )
    assert resp.status_code == 201, resp.text
    task_id = resp.json().get("data", resp.json())["id"]
    assert lignes_audit(instance, task_id) == [("task", "created", MOTIF, False, admin.id)]


def test_modifier_le_libelle_d_une_tache_ecrit_une_seule_ligne(client, admin, instance, ouverte):
    task_id = tache(instance, ouverte)
    resp = client.patch(
        f"/intervention-tasks/{task_id}", headers=admin.headers, json={"label": "Renommée"}
    )
    assert resp.status_code == 200, resp.text
    assert lignes_audit(instance, task_id) == [("task", "label_changed", MOTIF, False, admin.id)]


def test_cloturer_une_tache_par_patch_ne_double_pas_la_ligne_de_statut(
    client, admin, instance, ouverte
):
    task_id = tache(instance, ouverte)
    resp = client.patch(
        f"/intervention-tasks/{task_id}",
        headers=admin.headers,
        json={"status": "done", "reason_code": "TASK_DONE_UNRECORDED"},
    )
    assert resp.status_code == 200, resp.text
    lignes = lignes_audit(instance, task_id)
    assert Counter(ligne[1] for ligne in lignes)["status_changed"] == 1, lignes
    assert {ligne[2] for ligne in lignes} == {"TASK_DONE_UNRECORDED"}
    assert {ligne[4] for ligne in lignes} == {admin.id}


def test_supprimer_une_tache_ecrit_une_seule_ligne_deleted_avec_le_motif(
    client, admin, instance, ouverte
):
    task_id = tache(instance, ouverte)
    resp = client.request(
        "DELETE",
        f"/intervention-tasks/{task_id}",
        headers=admin.headers,
        json={"reason_code": MOTIF},
    )
    assert resp.status_code == 204, resp.text
    assert lignes_audit(instance, task_id) == [("task", "deleted", MOTIF, False, admin.id)]


# ── Actions ─────────────────────────────────────────────────────────────────


def test_creer_une_action_ecrit_une_ligne_created_au_nom_du_jeton(client, admin, instance, ouverte):
    action_id = _action(client, admin, instance, ouverte)
    assert lignes_audit(instance, action_id) == [("action", "created", MOTIF, False, admin.id)]


def test_modifier_une_action_ecrit_une_ligne_par_champ_modifie_sans_doublon(
    client, admin, instance, ouverte
):
    action_id = _action(client, admin, instance, ouverte)
    resp = client.patch(
        f"/intervention-actions/{action_id}",
        headers=admin.headers,
        json={"description": "Remplacé", "time_spent": 1.5},
    )
    assert resp.status_code == 200, resp.text
    modifications = {t: n for t, n in _types(instance, action_id).items() if t != "created"}
    assert modifications == {"description_changed": 1, "time_spent_changed": 1}


def test_supprimer_une_action_sans_motif_est_refuse(client, admin, instance, ouverte):
    action_id = _action(client, admin, instance, ouverte)
    resp = client.delete(f"/intervention-actions/{action_id}", headers=admin.headers)
    assert resp.status_code == 400, f"{resp.status_code} : {resp.text}"
    assert resp.json()["audit"]["silent"] is False
    assert instance.sql("SELECT 1 FROM intervention_action WHERE id = %s", (action_id,))


def test_supprimer_une_action_avec_motif_ecrit_une_ligne_deleted(client, admin, instance, ouverte):
    action_id = _action(client, admin, instance, ouverte)
    resp = client.request(
        "DELETE",
        f"/intervention-actions/{action_id}",
        headers=admin.headers,
        json={"reason_code": MOTIF},
    )
    assert resp.status_code == 204, f"{resp.status_code} : {resp.text}"
    supprimees = [ligne for ligne in lignes_audit(instance, action_id) if ligne[1] == "deleted"]
    assert supprimees == [("action", "deleted", MOTIF, False, admin.id)]


def test_une_action_qui_ferme_des_taches_depose_un_evenement_par_tache_avec_un_motif_valide(
    client, admin, instance, ouverte
):
    """Plus de motif TASK_STATUS codé en dur : motif de la requête ou motif system."""
    faite = tache(instance, ouverte, "À finir")
    ignoree = tache(instance, ouverte, "À ignorer")
    _action(
        client,
        admin,
        instance,
        ouverte,
        tasks=[
            {"task_id": faite, "close_task": True},
            {"task_id": ignoree, "skip": True, "skip_reason": "Pièce absente"},
        ],
    )
    for task_id, statut in ((faite, "done"), (ignoree, "skipped")):
        lignes = lignes_audit(instance, task_id)
        assert len(lignes) == 1, lignes
        entite, _decision, motif, _systeme, auteur = lignes[0]
        assert entite == "task" and auteur == admin.id
        assert motif in (MOTIF, "SYSTEM_CASCADE"), motif
        nouveau = instance.sql(
            "SELECT new_value->>'status' FROM audit_log WHERE entity_id = %s", (task_id,)
        )
        assert nouveau == [(statut,)]


# ── Journal de statut ───────────────────────────────────────────────────────


def test_changer_le_statut_par_le_journal_ecrit_une_seule_ligne_au_nom_du_jeton(
    client, admin, instance, ouverte
):
    statut = instance.sql(
        "SELECT id FROM intervention_status_ref WHERE id NOT IN ('ouvert', 'ferme') LIMIT 1"
    )[0][0]
    resp = client.post(
        "/intervention-status-log",
        headers=admin.headers,
        json={
            "intervention_id": ouverte,
            "status_to": statut,
            "technician_id": admin.id,
            "date": "2026-11-01T10:00:00",
        },
    )
    assert resp.status_code == 201, resp.text
    changements = [ligne for ligne in lignes_audit(instance, ouverte) if ligne[1] != "created"]
    assert changements == [("intervention", "status_changed", MOTIF, False, admin.id)]
