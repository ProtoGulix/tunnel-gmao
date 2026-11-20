"""Écritures en cascade du préventif, chacune avec son événement du système (ADR 0029).

Trois chemins rattachent une occurrence à son intervention (acceptation d'une demande,
création directe d'une intervention depuis une demande, acceptation automatique) et trois
la passent à « completed » (clôture de la demande, fermeture de l'intervention, trigger de
la base). Le SQL et l'événement vivent ici une seule fois pour que chaque chemin trace pareil.
"""

from __future__ import annotations

from typing import Any, Optional

from api.audits.cascade import record_cascade, record_cascade_changes


def as_text(value: Any) -> Optional[str]:
    """Valeur JSON : identifiants et dates en texte, None conservé."""
    return None if value is None else str(value)


def attach_occurrence(
    cur: Any, occurrence_id: str, intervention_id: str, fill_assignment: bool = False
) -> None:
    """Rattache l'occurrence (passée « in_progress ») et ses tâches libres à l'intervention.

    `fill_assignment` : les tâches sans technicien ni échéance reprennent ceux de
    l'intervention (acceptation automatique et création directe).
    """
    cur.execute(
        "SELECT status, intervention_id FROM preventive_occurrence WHERE id = %s",
        (occurrence_id,),
    )
    old_status, old_intervention_id = cur.fetchone()
    cur.execute(
        "UPDATE preventive_occurrence SET intervention_id = %s, status = 'in_progress' "
        "WHERE id = %s",
        (intervention_id, occurrence_id),
    )
    record_cascade(
        "preventive_occurrence",
        occurrence_id,
        "status_changed",
        old_value={"status": old_status, "intervention_id": as_text(old_intervention_id)},
        new_value={"status": "in_progress", "intervention_id": str(intervention_id)},
    )
    attach_tasks(cur, occurrence_id, intervention_id, fill_assignment)


def attach_tasks(
    cur: Any, occurrence_id: str, intervention_id: str, fill_assignment: bool = False
) -> None:
    """Rattache les tâches de l'occurrence sans intervention ; un événement par tâche."""
    cur.execute(
        """
        UPDATE intervention_task it
        SET intervention_id = %s,
            assigned_to = COALESCE(old.assigned_to,
                CASE WHEN %s THEN (SELECT tech_id FROM intervention WHERE id = %s) END),
            due_date = COALESCE(old.due_date,
                CASE WHEN %s THEN (SELECT reported_date FROM intervention WHERE id = %s) END)
        FROM (SELECT id, assigned_to, due_date FROM intervention_task
              WHERE occurrence_id = %s AND intervention_id IS NULL) old
        WHERE it.id = old.id
        RETURNING it.id, old.assigned_to, old.due_date, it.assigned_to, it.due_date
        """,
        (
            intervention_id,
            fill_assignment,
            intervention_id,
            fill_assignment,
            intervention_id,
            occurrence_id,
        ),
    )
    for task_id, old_assigned, old_due, new_assigned, new_due in cur.fetchall():
        record_cascade_changes(
            "task",
            task_id,
            {
                "intervention_id": None,
                "assigned_to": as_text(old_assigned),
                "due_date": as_text(old_due),
            },
            {
                "intervention_id": str(intervention_id),
                "assigned_to": as_text(new_assigned),
                "due_date": as_text(new_due),
            },
        )


def complete_occurrences(
    cur: Any, request_id: Optional[str], intervention_id: Optional[str]
) -> int:
    """Passe à « completed » les occurrences actives liées à la demande OU à l'intervention.

    Retourne le nombre d'occurrences changées ; chacune dépose son événement. Un identifiant
    None ne correspond à rien (comparaison avec NULL).
    """
    cur.execute(
        """
        UPDATE preventive_occurrence o
        SET status = 'completed'
        FROM (SELECT id, status FROM preventive_occurrence
              WHERE status NOT IN ('completed', 'skipped')
                AND (di_id = %s OR intervention_id = %s)) old
        WHERE o.id = old.id
        RETURNING o.id, old.status
        """,
        (request_id, intervention_id),
    )
    rows = cur.fetchall()
    for occurrence_id, old_status in rows:
        record_cascade(
            "preventive_occurrence",
            occurrence_id,
            "status_changed",
            old_value={"status": old_status},
            new_value={"status": "completed"},
        )
    return len(rows)
