"""Remise à faire d'une tâche terminée ou annulée (ADR 0042, REM-02).

PATCH /intervention-tasks/{id} avec status=todo sur une tâche done ou skipped : motif
exigé pour tous les rôles (task_reopened), closed_by et skip_reason effacés, une seule
ligne de journal `task_reopened` (pas de `status_changed` en double).

Dépend de la migration REM-01 (motifs TASK_CLOSED_BY_MISTAKE, TASK_REWORK et décision
task_reopened sur OTHER)."""

import pytest

from tests.integration.test_taches_cloture_integration import _intervention, _tache

pytestmark = pytest.mark.integration

MOTIFS_REMISE_A_FAIRE = {"TASK_CLOSED_BY_MISTAKE", "TASK_REWORK", "OTHER"}


def _tache_close(client, admin, instance, status="done", closed_by=None, skip_reason=None):
    task_id = _tache(instance, _intervention(client, admin, instance), status="todo")
    # Un statut skipped exige un skip_reason (contrainte), posé avec le statut dans un même UPDATE.
    if status == "skipped" and skip_reason is None:
        skip_reason = "Doublon"
    instance.sql(
        "UPDATE intervention_task SET status = %s, closed_by = %s, skip_reason = %s WHERE id = %s",
        (status, closed_by, skip_reason, task_id),
    )
    return task_id


def _remettre(client, headers, task_id, reason_code=None, **extra):
    corps = {"status": "todo", **extra}
    if reason_code is not None:
        corps["reason_code"] = reason_code
    return client.patch(f"/intervention-tasks/{task_id}", json=corps, headers=headers)


def _etat(instance, task_id):
    return instance.sql(
        "SELECT status, closed_by::text, skip_reason FROM intervention_task WHERE id = %s",
        (task_id,),
    )[0]


@pytest.mark.parametrize("statut", ["done", "skipped"])
@pytest.mark.parametrize("code", [None, "ROUTINE"])
def test_sans_motif_la_liste_filtree_est_renvoyee(client, admin, instance, make_user, statut, code):
    task_id = _tache_close(client, admin, instance, status=statut)
    r = _remettre(client, make_user("TECH").headers, task_id, reason_code=code)
    assert r.status_code == 400, r.text
    audit = r.json()["audit"]
    assert audit["required"] is True and audit["silent"] is False
    assert {m["code"] for m in audit["reasons"]} == MOTIFS_REMISE_A_FAIRE
    assert _etat(instance, task_id)[0] == statut


def test_motif_hors_liste_refuse(client, admin, instance, make_user):
    task_id = _tache_close(client, admin, instance)
    r = _remettre(client, make_user("TECH").headers, task_id, reason_code="TASK_DUPLICATE")
    assert r.status_code == 400, r.text
    assert _etat(instance, task_id)[0] == "done"


def test_other_sans_texte_refuse(client, admin, instance, make_user):
    task_id = _tache_close(client, admin, instance)
    r = _remettre(client, make_user("TECH").headers, task_id, reason_code="OTHER")
    assert r.status_code == 400, r.text
    assert _etat(instance, task_id)[0] == "done"


def test_tech_remet_a_faire_avec_motif_closed_by_et_skip_reason_effaces(
    client, admin, instance, make_user
):
    tech = make_user("TECH")
    task_id = _tache_close(
        client, admin, instance, status="skipped", closed_by=admin.id, skip_reason="Doublon"
    )
    r = _remettre(client, tech.headers, task_id, reason_code="TASK_CLOSED_BY_MISTAKE")
    assert r.status_code == 200, r.text
    assert _etat(instance, task_id) == ("todo", None, None)


def test_une_seule_ligne_task_reopened_avec_motif_et_auteur(client, admin, instance, make_user):
    resp = make_user("RESP")
    task_id = _tache_close(client, admin, instance, closed_by=admin.id)
    r = _remettre(client, resp.headers, task_id, reason_code="OTHER", reason_text="Repris demain")
    assert r.status_code == 200, r.text
    lignes = instance.sql(
        "SELECT l.decision_type, r.code, l.reason_text, l.changed_by::text FROM audit_log l "
        "LEFT JOIN audit_reason_code r ON r.id = l.reason_code_id "
        "WHERE l.entity_id = %s AND l.decision_type <> 'created' ORDER BY l.logged_at",
        (task_id,),
    )
    assert [tuple(ligne) for ligne in lignes] == [
        ("task_reopened", "OTHER", "Repris demain", resp.id)
    ]


def test_todo_vers_todo_reste_sans_motif(client, admin, instance, make_user):
    task_id = _tache(instance, _intervention(client, admin, instance))
    r = _remettre(client, make_user("TECH").headers, task_id, reason_code="ROUTINE")
    assert r.status_code == 200, r.text
