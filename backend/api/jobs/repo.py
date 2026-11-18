"""Requêtes de lecture des tâches planifiées (jobs)."""

from datetime import date
from typing import Any, Dict, List

from api.db import get_connection, release_connection
from api.errors.exceptions import raise_db_error


class JobsRepository:
    """Lectures des étapes de la tâche quotidienne."""

    def list_overdue_occurrences(self, today: date) -> List[Dict[str, Any]]:
        """Occurrences préventives actives dont l'échéance est passée (avec plan et machine)."""
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT po.id, po.scheduled_date, po.intervention_id, po.di_id,
                       pp.label AS plan_label, m.code AS machine_code
                FROM preventive_occurrence po
                JOIN preventive_plan pp ON pp.id = po.plan_id
                JOIN machine m ON m.id = po.machine_id
                JOIN equipement_statuts es ON es.id = m.statut_id AND es.code = 'EN_SERVICE'
                WHERE po.status IN ('pending', 'generated', 'in_progress')
                  AND po.scheduled_date < %s
                ORDER BY po.scheduled_date
                """,
                (today,),
            )
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]
        except Exception as e:
            raise_db_error(e, "recherche des préventifs en retard")
        finally:
            release_connection(conn)

    def list_open_interventions_activity(self) -> List[Dict[str, Any]]:
        """Interventions non fermées (attentes comprises) avec leur dernière activité.

        Dernière activité : date de la dernière action (created_at::date, définition de
        l'ADR 0021), à défaut la date de signalement de l'intervention.
        """
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT i.id, i.code, m.code AS machine_code,
                       COALESCE(MAX(ia.created_at::date), i.reported_date) AS last_activity
                FROM intervention i
                LEFT JOIN machine m ON m.id = i.machine_id
                LEFT JOIN intervention_action ia ON ia.intervention_id = i.id
                WHERE i.status_actual IS DISTINCT FROM 'ferme'
                GROUP BY i.id, i.code, m.code, i.reported_date
                HAVING COALESCE(MAX(ia.created_at::date), i.reported_date) IS NOT NULL
                ORDER BY last_activity
                """
            )
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]
        except Exception as e:
            raise_db_error(e, "recherche des interventions sans action")
        finally:
            release_connection(conn)
