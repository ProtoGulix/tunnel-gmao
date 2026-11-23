"""Indicateurs des constats (ADR 0044) : lecture seule, agrégats SQL.

Aucun auteur ni technicien n'est lu ni renvoyé (ADR 0043).
"""

from datetime import date
from typing import Any, Dict, List

from api.db import get_connection, release_connection
from api.equipements.validators import month_keys
from api.errors.exceptions import raise_db_error

# Version courante d'un constat : aucune autre ligne ne la remplace.
_CURRENT = "NOT EXISTS (SELECT 1 FROM constat s WHERE s.supersedes_id = c.id)"

# Constats de la période : version courante, datée de la première version de la demande
# (une correction garde le même request_id et ne déplace donc pas le constat de mois).
_PERIOD_CTE = f"""
    cur_constat AS (
        SELECT c.id, c.linked_request_id, ir.statut,
               (SELECT MIN(f.created_at)::date FROM constat f
                WHERE f.request_id = c.request_id) AS d
        FROM constat c JOIN intervention_request ir ON ir.id = c.request_id
        WHERE {_CURRENT}
    ),
    in_period AS (SELECT * FROM cur_constat WHERE d BETWEEN %s AND %s)
"""

# Libellé et couleur du devenir « rattachée » : absent de request_status_ref (rejetée en pratique).
_LINKED_CODE, _LINKED_LABEL, _LINKED_FROM = "rattachee", "Rattachée à une idée", "rejetee"
_OUTCOME_ORDER = ("nouvelle", "en_attente", "acceptee", "cloturee", "rejetee", _LINKED_CODE)
_CHOICE_QUESTIONS = (("levers", "LEVER"), ("signals", "SIGNAL"), ("known_since", "KNOWN_SINCE"))


class ConstatsStatsRepository:
    """Lecture des indicateurs des constats sur une période."""

    def _total_by_month(self, cur, start: date, end: date):
        cur.execute(
            f"""
            WITH {_PERIOD_CTE}
            SELECT to_char(d, 'YYYY-MM'), COUNT(*) FROM in_period GROUP BY 1
            """,
            (start, end),
        )
        counts = dict(cur.fetchall())
        by_month = [{"month": k, "count": counts.get(k, 0)} for k in month_keys(start, end)]
        return sum(counts.values()), by_month

    def _choices(self, cur, start: date, end: date, question: str) -> List[Dict[str, Any]]:
        """Choix d'une question dans l'ordre sort_order ; inactif seulement s'il a des réponses."""
        cur.execute(
            f"""
            WITH {_PERIOD_CTE}
            SELECT ch.code, ch.label, ch.suggested_type_inter,
                   COUNT(p.id) AS n, ch.is_active
            FROM constat_choice ch
            JOIN constat_question q ON q.id = ch.question_id AND q.code = %s
            LEFT JOIN constat_answer a ON a.choice_code = ch.code
            LEFT JOIN in_period p ON p.id = a.constat_id
            GROUP BY ch.id
            HAVING ch.is_active OR COUNT(p.id) > 0
            ORDER BY ch.sort_order, ch.id
            """,
            (start, end, question),
        )
        return [
            {"code": code, "label": label, "suggested_type_inter": type_inter, "count": n}
            for code, label, type_inter, n, _active in cur.fetchall()
        ]

    def _outcomes(self, cur, start: date, end: date) -> List[Dict[str, Any]]:
        cur.execute("SELECT code, label, color FROM request_status_ref")
        refs = {code: (label, color) for code, label, color in cur.fetchall()}
        cur.execute(
            f"""
            WITH {_PERIOD_CTE}
            SELECT CASE WHEN linked_request_id IS NOT NULL THEN %s ELSE statut END, COUNT(*)
            FROM in_period GROUP BY 1
            """,
            (start, end, _LINKED_CODE),
        )
        counts = dict(cur.fetchall())
        out = []
        for code in _OUTCOME_ORDER:
            label, color = refs.get(_LINKED_FROM if code == _LINKED_CODE else code, (code, None))
            out.append(
                {
                    "code": code,
                    "label": _LINKED_LABEL if code == _LINKED_CODE else label,
                    "color": color,
                    "count": counts.get(code, 0),
                }
            )
        return out

    def get_constats(self, start: date, end: date) -> Dict[str, Any]:
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                total, by_month = self._total_by_month(cur, start, end)
                result = {
                    key: self._choices(cur, start, end, question)
                    for key, question in _CHOICE_QUESTIONS
                }
                outcomes = self._outcomes(cur, start, end)
            conn.commit()
        except Exception as e:
            if conn:
                conn.rollback()
            raise_db_error(e, "indicateurs des constats")
        finally:
            if conn:
                release_connection(conn)
        return {
            "period": {"start_date": start, "end_date": end},
            "total": total,
            "by_month": by_month,
            **result,
            "outcomes": outcomes,
        }
