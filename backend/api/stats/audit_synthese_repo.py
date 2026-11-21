"""Synthèse de l'audit et du partage des tâches (ADR 0032) : lecture seule, agrégats SQL.

Chiffres d'équipe uniquement (ADR 0021, point 2) : garant et exécutants servent à former
des comparaisons dans le SQL, jamais à sortir un identifiant, un nom ou une initiale.
Une requête par groupe d'indicateurs, aucune boucle de requêtes.
"""

from datetime import date
from typing import Any, Dict, List, Optional

from api.db import get_connection, release_connection
from api.equipements.validators import month_keys
from api.errors.exceptions import raise_db_error

# ADR 0029 : avant cette date, closed_by et les cascades ne sont pas (ou mal) tracés.
CASCADES_TRACED_FROM = date(2026, 11, 20)
# Catégories de motifs d'une décision humaine hors du travail normal.
DECISION_CATEGORIES = ("user", "manual")
# Motif des journaux migrés (inactif depuis la migration 0013) : l'ancien code l'a posé sur de
# simples créations et suppressions de tâches (dernier le 2026-11-12). Ce ne sont pas des
# décisions : exclu de `decisions` et de `decisions_total`, mais compté dans `audit_events`.
EXCLUDED_REASON_CODES = ("LEGACY_STATUS_CHANGE",)

_COUNTERS = (
    "tasks_created",
    "tasks_without_guarantor",
    "tasks_done",
    "tasks_done_with_guarantor",
    "done_without_guarantor_action",
    "spotted_in_field",
    "shared_tasks",
    "decisions_total",
    "audit_events",
    "system_events",
)


def _share(part: int, whole: int) -> Optional[float]:
    """Part en % arrondie à 1 décimale ; null sans dénominateur (jamais 0)."""
    return round(100.0 * part / whole, 1) if whole else None


def _empty_month(key: str) -> Dict[str, Any]:
    return {"month": key, **{name: 0 for name in _COUNTERS}}


def _finish(m: Dict[str, Any]) -> Dict[str, Any]:
    """Ajoute les parts aux compteurs bruts d'un mois (ou du total)."""
    out = dict(m)
    out["without_guarantor_share"] = _share(m["tasks_without_guarantor"], m["tasks_created"])
    out["done_without_guarantor_action_share"] = _share(
        m["done_without_guarantor_action"], m["tasks_done_with_guarantor"]
    )
    out["spotted_in_field_share"] = _share(m["spotted_in_field"], m["tasks_done_with_guarantor"])
    out["shared_tasks_share"] = _share(m["shared_tasks"], m["tasks_done"])
    out["system_share"] = _share(m["system_events"], m["audit_events"])
    return out


def _sum_months(months: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Cumule les compteurs bruts : les parts du total se recalculent dessus."""
    total = {name: 0 for name in _COUNTERS}
    for m in months:
        for name in _COUNTERS:
            total[name] += m[name]
    return total


class AuditSyntheseRepository:
    """Lecture des indicateurs de synthèse de l'audit sur une période."""

    def _fill_tasks(self, cur, months, start, end) -> None:
        """Indicateurs de tâches, rattachés au mois de création de la tâche.

        Exécutants d'une tâche = techniciens distincts des actions liées. Le garant est
        `assigned_to`. Les indicateurs « faite » ne comptent que les tâches au statut done.
        """
        cur.execute(
            """
            WITH t AS (
                SELECT t.assigned_to, t.created_by, t.status,
                       to_char(t.created_at, 'YYYY-MM') AS m,
                       ARRAY(
                           SELECT DISTINCT a.tech
                           FROM intervention_action_task iat
                           JOIN intervention_action a ON a.id = iat.action_id
                           WHERE iat.task_id = t.id AND a.tech IS NOT NULL
                       ) AS execs
                FROM intervention_task t
                WHERE t.created_at::date BETWEEN %s AND %s
            )
            SELECT m,
                   COUNT(*),
                   COUNT(*) FILTER (WHERE assigned_to IS NULL),
                   COUNT(*) FILTER (WHERE status = 'done'),
                   COUNT(*) FILTER (WHERE status = 'done' AND assigned_to IS NOT NULL),
                   COUNT(*) FILTER (WHERE status = 'done' AND assigned_to IS NOT NULL
                                    AND NOT assigned_to = ANY(execs)),
                   COUNT(*) FILTER (WHERE status = 'done' AND assigned_to IS NOT NULL
                                    AND created_by = assigned_to AND assigned_to = ANY(execs)),
                   COUNT(*) FILTER (WHERE status = 'done' AND cardinality(execs) >= 2)
            FROM t GROUP BY m
            """,
            (start, end),
        )
        for key, created, no_guarantor, done, done_g, no_action, spotted, shared in cur.fetchall():
            months[key].update(
                tasks_created=created,
                tasks_without_guarantor=no_guarantor,
                tasks_done=done,
                tasks_done_with_guarantor=done_g,
                done_without_guarantor_action=no_action,
                spotted_in_field=spotted,
                shared_tasks=shared,
            )

    def _fill_events(self, cur, months, start, end) -> None:
        """Poids des modifications automatiques : événements système parmi tous les événements."""
        cur.execute(
            """
            SELECT to_char(logged_at, 'YYYY-MM'), COUNT(*), COUNT(*) FILTER (WHERE is_system)
            FROM audit_log WHERE logged_at::date BETWEEN %s AND %s GROUP BY 1
            """,
            (start, end),
        )
        for key, events, system in cur.fetchall():
            months[key]["audit_events"] = events
            months[key]["system_events"] = system

    def _decisions(self, cur, months, start, end) -> List[Dict[str, Any]]:
        """Décisions humaines hors travail normal, par mois, type de décision et motif."""
        cur.execute(
            """
            SELECT to_char(l.logged_at, 'YYYY-MM'), l.decision_type, rc.code, rc.label,
                   COUNT(*)
            FROM audit_log l
            JOIN audit_reason_code rc ON rc.id = l.reason_code_id
            WHERE NOT l.is_system AND rc.category IN %s AND rc.code NOT IN %s
              AND l.logged_at::date BETWEEN %s AND %s
            GROUP BY 1, 2, 3, 4
            ORDER BY 1, 5 DESC, 2, 3
            """,
            (DECISION_CATEGORIES, EXCLUDED_REASON_CODES, start, end),
        )
        rows = []
        for key, decision_type, code, label, count in cur.fetchall():
            months[key]["decisions_total"] += count
            rows.append(
                {
                    "month": key,
                    "decision_type": decision_type,
                    "reason_code": code,
                    "reason_label": label,
                    "count": count,
                }
            )
        return rows

    def get_synthese(self, start: date, end: date) -> Dict[str, Any]:
        """Synthèse de la période [start, end] (lecture seule)."""
        months = {k: _empty_month(k) for k in month_keys(start, end)}
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                self._fill_tasks(cur, months, start, end)
                self._fill_events(cur, months, start, end)
                decisions = self._decisions(cur, months, start, end)
            conn.commit()
        except Exception as e:
            if conn:
                conn.rollback()
            raise_db_error(e, "synthèse de l'audit")
        finally:
            if conn:
                release_connection(conn)

        monthly = []
        for key, m in months.items():
            # Un mois qui commence avant la date de l'ADR 0029 est (au moins en partie) incomplet.
            m["incomplete_data"] = date(int(key[:4]), int(key[5:]), 1) < CASCADES_TRACED_FROM
            monthly.append(_finish(m))
        return {
            "period": {"start": start, "end": end},
            "cascades_traced_from": CASCADES_TRACED_FROM,
            "monthly": monthly,
            "totals": _finish(_sum_months(list(months.values()))),
            "decisions": decisions,
        }
