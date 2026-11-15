"""Aides communes aux tests d'intégration de l'étape 2 de l'audit (AUDC-22, AUDC-23).

Montage par l'API réelle : machine (SQL), demande puis intervention liée (POST), comme
le fait un client. Une intervention créée avec request_id passe la demande à « acceptee ».
"""

import secrets

MOTIF = "ROUTINE"


def machine(instance) -> str:
    return str(
        instance.sql(
            "INSERT INTO machine (code, name) VALUES (%s, 'Presse étape 2') RETURNING id",
            (f"E2-{secrets.token_hex(3)}",),
        )[0][0]
    )


def demande(client, admin, machine_id: str) -> str:
    resp = client.post(
        "/intervention-requests",
        headers=admin.headers,
        json={
            "machine_id": machine_id,
            "demandeur_nom": "Atelier",
            "description": "Étape 2",
            "reason_code": MOTIF,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json().get("data", resp.json())["id"]


def intervention_liee(client, admin, instance) -> tuple[str, str]:
    """Retourne (intervention_id, request_id) : demande acceptée liée à l'intervention."""
    machine_id = machine(instance)
    request_id = demande(client, admin, machine_id)
    resp = client.post(
        "/interventions",
        headers=admin.headers,
        json={
            "machine_id": machine_id,
            "type_inter": "CUR",
            "tech_id": admin.id,
            "title": "Intervention étape 2",
            "priority": "normale",
            "request_id": request_id,
            "reason_code": MOTIF,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json().get("data", resp.json())["id"], request_id


def lignes_audit(instance, entity_id: str):
    """(entity_type, decision_type, code du motif, is_system, changed_by) d'une entité."""
    return instance.sql(
        "SELECT l.entity_type, l.decision_type, r.code, l.is_system, l.changed_by::text "
        "FROM audit_log l JOIN audit_reason_code r ON r.id = l.reason_code_id "
        "WHERE l.entity_id = %s ORDER BY l.logged_at, l.decision_type",
        (entity_id,),
    )


def tache(instance, intervention_id: str, label="Tâche", status="todo") -> str:
    return instance.sql(
        "INSERT INTO intervention_task (intervention_id, label, origin, status) "
        "VALUES (%s, %s, 'tech', %s) RETURNING id::text",
        (intervention_id, label, status),
    )[0][0]
