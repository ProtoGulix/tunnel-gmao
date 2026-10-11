"""Ignorer une étape obligatoire de gamme est réservé à RESP et ADMIN, y compris via une action.

POST /intervention-actions accepte tasks[].skip=true : ce chemin doit appliquer la même
règle que PATCH /intervention-tasks/{id}."""

import pytest

pytestmark = pytest.mark.integration


def _intervention(client, admin, instance):
    """Crée équipement, demande et intervention ; renvoie (intervention_id, reason_code)."""
    raison = instance.sql("SELECT code FROM audit_reason_code WHERE is_active LIMIT 1")[0][0]
    equipement = client.post("/equipements", json={"name": "Broyeur test"}, headers=admin.headers)
    machine_id = equipement.json().get("data", equipement.json())["id"]
    demande = client.post(
        "/intervention-requests",
        json={
            "machine_id": machine_id,
            "demandeur_nom": "Atelier",
            "description": "Graissage",
            "reason_code": raison,
        },
        headers=admin.headers,
    )
    request_id = demande.json().get("data", demande.json())["id"]
    intervention = client.post(
        "/interventions",
        json={
            "machine_id": machine_id,
            "type_inter": "PRE",
            "tech_id": admin.id,
            "title": "Graissage",
            "priority": "normale",
            "request_id": request_id,
            "reason_code": raison,
        },
        headers=admin.headers,
    )
    assert intervention.status_code in (200, 201), intervention.text
    return intervention.json().get("data", intervention.json())["id"], raison


def _tache(instance, intervention_id, origin, optional):
    return instance.sql(
        "INSERT INTO intervention_task (intervention_id, label, origin, status, optional) "
        "VALUES (%s, 'Graisser les paliers', %s, 'todo', %s) RETURNING id::text",
        (intervention_id, origin, optional),
    )[0][0]


def _action_qui_ignore(client, account, instance, intervention_id, task_id, raison):
    sous_categorie = instance.sql("SELECT id FROM action_subcategory LIMIT 1")[0][0]
    return client.post(
        "/intervention-actions",
        json={
            "intervention_id": intervention_id,
            "action_subcategory": sous_categorie,
            "tech": account.id,
            "complexity_score": 1,
            "time_spent": 0.5,
            "tasks": [{"task_id": task_id, "skip": True, "skip_reason": "Pièce absente"}],
            "reason_code": raison,
        },
        headers=account.headers,
    )


def _statut(instance, task_id):
    return instance.sql("SELECT status FROM intervention_task WHERE id = %s", (task_id,))[0][0]


def test_tech_ne_peut_pas_ignorer_une_etape_obligatoire_via_une_action(
    client, admin, instance, make_user
):
    intervention_id, raison = _intervention(client, admin, instance)
    task_id = _tache(instance, intervention_id, "plan", False)
    tech = make_user("TECH")
    r = _action_qui_ignore(client, tech, instance, intervention_id, task_id, raison)
    assert r.status_code == 403, r.text
    assert _statut(instance, task_id) == "todo"
    # Transaction annulée : ni action ni liaison écrites.
    actions = instance.sql(
        "SELECT count(*) FROM intervention_action WHERE intervention_id = %s", (intervention_id,)
    )
    liaisons = instance.sql(
        "SELECT count(*) FROM intervention_action_task WHERE task_id = %s", (task_id,)
    )
    assert actions[0][0] == 0
    assert liaisons[0][0] == 0


def test_tech_ne_peut_pas_ignorer_une_etape_obligatoire_en_modifiant_une_action(
    client, admin, instance, make_user
):
    intervention_id, raison = _intervention(client, admin, instance)
    task_id = _tache(instance, intervention_id, "plan", False)
    autre_tache = _tache(instance, intervention_id, "tech", False)
    tech = make_user("TECH")
    sous_categorie = instance.sql("SELECT id FROM action_subcategory LIMIT 1")[0][0]
    creee = client.post(
        "/intervention-actions",
        json={
            "intervention_id": intervention_id,
            "action_subcategory": sous_categorie,
            "tech": tech.id,
            "complexity_score": 1,
            "time_spent": 0.5,
            "tasks": [{"task_id": autre_tache}],
            "reason_code": raison,
        },
        headers=tech.headers,
    )
    assert creee.status_code in (200, 201), creee.text
    action_id = creee.json().get("data", creee.json())["id"]
    r = client.patch(
        f"/intervention-actions/{action_id}",
        json={
            "tasks": [{"task_id": task_id, "skip": True, "skip_reason": "Pièce absente"}],
            "reason_code": raison,
        },
        headers=tech.headers,
    )
    assert r.status_code == 403, r.text
    assert _statut(instance, task_id) == "todo"


def test_tech_peut_ignorer_une_etape_optionnelle_via_une_action(client, admin, instance, make_user):
    intervention_id, raison = _intervention(client, admin, instance)
    task_id = _tache(instance, intervention_id, "plan", True)
    tech = make_user("TECH")
    r = _action_qui_ignore(client, tech, instance, intervention_id, task_id, raison)
    assert r.status_code in (200, 201), r.text
    assert _statut(instance, task_id) == "skipped"


def test_resp_peut_ignorer_une_etape_obligatoire_via_une_action(client, admin, instance, make_user):
    intervention_id, raison = _intervention(client, admin, instance)
    task_id = _tache(instance, intervention_id, "plan", False)
    resp = make_user("RESP")
    r = _action_qui_ignore(client, resp, instance, intervention_id, task_id, raison)
    assert r.status_code in (200, 201), r.text
    assert _statut(instance, task_id) == "skipped"
