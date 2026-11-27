"""Requêtes de lecture des tâches planifiées (jobs)."""

from datetime import date
from typing import Any, Dict, List

from api.db import get_connection, release_connection
from api.errors.exceptions import raise_db_error

# Définition unique de « sans action » : partagée par le job de relance et les listes
# d'interventions (alias SQL `i` = intervention). Dernière activité = dernière action
# (created_at::date, ADR 0021), à défaut la date de signalement.
OPEN_INTERVENTION_SQL = "i.status_actual IS DISTINCT FROM 'ferme'"
LAST_ACTIVITY_SQL = (
    "COALESCE((SELECT MAX(ia_last.created_at::date) FROM intervention_action ia_last "
    "WHERE ia_last.intervention_id = i.id), i.reported_date)"
)


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
                f"""
                SELECT i.id, i.code, m.code AS machine_code,
                       {LAST_ACTIVITY_SQL} AS last_activity
                FROM intervention i
                LEFT JOIN machine m ON m.id = i.machine_id
                WHERE {OPEN_INTERVENTION_SQL}
                  AND {LAST_ACTIVITY_SQL} IS NOT NULL
                ORDER BY last_activity
                """
            )
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]
        except Exception as e:
            raise_db_error(e, "recherche des interventions sans action")
        finally:
            release_connection(conn)
