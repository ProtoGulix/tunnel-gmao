"""Indicateurs d'organisation de l'équipe (ADR 0021) : lecture seule, agrégats SQL.

Aucune donnée par technicien ne sort d'ici : le technicien sert seulement à former les
couples (technicien, intervention) et (technicien, jour) dans le SQL.
"""

from calendar import monthrange
from datetime import date
from typing import Any, Dict, List, Optional

from api.db import get_connection, release_connection
from api.equipements.validators import month_keys
from api.errors.exceptions import raise_db_error
from api.stats.trends import compute_trends, compute_waiting_trend

# Types d'intervention comptés séparément ; tout le reste tombe dans « other ».
HOUR_TYPES = ("CUR", "PRE", "PRO")
# Seuil de dispersion : journée-technicien avec au moins ce nombre d'interventions distinctes.
SCATTERED_MIN_INTERVENTIONS = 3

# Actions datées : jour du travail (created_at), à défaut le jour déclaré de l'intervention.
_ACT_CTE = """
    act AS (
        SELECT a.tech, i.id AS iid, i.type_inter, i.priority, a.time_spent,
               COALESCE(a.created_at::date, i.reported_date) AS d
        FROM intervention_action a
        JOIN intervention i ON i.id = a.intervention_id
    )
"""


def _share(part: int, whole: int) -> Optional[float]:
    """Part en % arrondie à 1 décimale ; null sans dénominateur (jamais 0)."""
    return round(100.0 * part / whole, 1) if whole else None


def _avg(total: float, count: int) -> Optional[float]:
    return round(total / count, 2) if count else None


def _empty_month(key: str) -> Dict[str, Any]:
    return {
        "month": key,
        "interventions_reported": 0,
        "urgent_count": 0,
        "hours": {"CUR": 0.0, "PRE": 0.0, "PRO": 0.0, "other": 0.0},
        "chantiers_started": 0,
        "chantiers_interrupted": 0,
        "tech_days": 0,
        "sum_interventions": 0,
        "scattered_days": 0,
    }


def _finish(m: Dict[str, Any]) -> Dict[str, Any]:
    """Ajoute les parts et moyennes aux compteurs bruts d'un mois (ou du total)."""
    hours = {k: round(float(v), 2) for k, v in m["hours"].items()}
    hours["total"] = round(sum(float(m["hours"][k]) for k in m["hours"]), 2)
    out = {k: v for k, v in m.items() if k not in ("sum_interventions", "scattered_days")}
    out["hours"] = hours
    out["urgent_share"] = _share(m["urgent_count"], m["interventions_reported"])
    out["interrupted_share"] = _share(m["chantiers_interrupted"], m["chantiers_started"])
    out["avg_interventions_per_tech_day"] = _avg(m["sum_interventions"], m["tech_days"])
    out["scattered_days_share"] = _share(m["scattered_days"], m["tech_days"])
    # Part du préventif dans les heures : null pour un mois sans heures (jamais 0).
    out["preventive_hours_share"] = (
        round(100.0 * hours["PRE"] / hours["total"], 1) if hours["total"] else None
    )
    return out


class OrganisationRepository:
    """Lecture des indicateurs d'organisation sur une période."""

    def _fill_reported(self, cur, months, start, end) -> None:
        cur.execute(
            """
            SELECT to_char(reported_date, 'YYYY-MM'), COUNT(*),
                   COUNT(*) FILTER (WHERE priority = 'urgent')
            FROM intervention WHERE reported_date BETWEEN %s AND %s GROUP BY 1
            """,
            (start, end),
        )
        for key, n, urgent in cur.fetchall():
            months[key]["interventions_reported"] = n
            months[key]["urgent_count"] = urgent

    def _fill_hours(self, cur, months, start, end) -> None:
        cur.execute(
            f"""
            WITH {_ACT_CTE}
            SELECT to_char(d, 'YYYY-MM'),
                   CASE WHEN type_inter IN %s THEN type_inter ELSE 'other' END,
                   COALESCE(SUM(time_spent), 0)
            FROM act WHERE d BETWEEN %s AND %s GROUP BY 1, 2
            """,
            (HOUR_TYPES, start, end),
        )
        for key, kind, hours in cur.fetchall():
            months[key]["hours"][kind] = float(hours)

    def _fill_chantiers(self, cur, months, start, end) -> None:
        """Chantier = couple (technicien, intervention PRO/PRE) actif sur 2 jours ou plus.

        Coupé si le même technicien a une action sur une urgence CUR strictement entre le
        premier et le dernier jour. Toutes les actions du couple comptent, même hors période :
        seul le premier jour doit tomber dans la période.
        """
        cur.execute(
            f"""
            WITH {_ACT_CTE},
            chantier AS (
                SELECT tech, iid, MIN(d) AS first_d, MAX(d) AS last_d
                FROM act
                WHERE tech IS NOT NULL AND type_inter IN ('PRO', 'PRE') AND d IS NOT NULL
                GROUP BY tech, iid
                HAVING COUNT(DISTINCT d) >= 2 AND MIN(d) BETWEEN %s AND %s
            )
            SELECT to_char(c.first_d, 'YYYY-MM'), COUNT(*),
                   COUNT(*) FILTER (WHERE EXISTS (
                       SELECT 1 FROM act u
                       WHERE u.tech = c.tech AND u.type_inter = 'CUR' AND u.priority = 'urgent'
                         AND u.d > c.first_d AND u.d < c.last_d
                   ))
            FROM chantier c GROUP BY 1
            """,
            (start, end),
        )
        for key, started, interrupted in cur.fetchall():
            months[key]["chantiers_started"] = started
            months[key]["chantiers_interrupted"] = interrupted

    def _fill_tech_days(self, cur, months, start, end) -> None:
        """Dispersion : interventions distinctes par journée-technicien, agrégées par mois."""
        cur.execute(
            f"""
            WITH {_ACT_CTE},
            day AS (
                SELECT tech, d, COUNT(DISTINCT iid) AS n
                FROM act WHERE tech IS NOT NULL AND d BETWEEN %s AND %s GROUP BY tech, d
            )
            SELECT to_char(d, 'YYYY-MM'), COUNT(*), SUM(n),
                   COUNT(*) FILTER (WHERE n >= %s)
            FROM day GROUP BY 1
            """,
            (start, end, SCATTERED_MIN_INTERVENTIONS),
        )
        for key, days, total, scattered in cur.fetchall():
            months[key]["tech_days"] = days
            months[key]["sum_interventions"] = int(total)
            months[key]["scattered_days"] = scattered

    def _projects(self, cur, start, end) -> Dict[str, Any]:
        """Interventions PRO (tous techniciens) actives sur 2 jours ou plus, début dans la période."""
        cur.execute(
            f"""
            WITH {_ACT_CTE},
            pro AS (
                SELECT iid, COUNT(DISTINCT d) AS active_days, MAX(d) - MIN(d) + 1 AS span
                FROM act WHERE type_inter = 'PRO' AND d IS NOT NULL GROUP BY iid
                HAVING COUNT(DISTINCT d) >= 2 AND MIN(d) BETWEEN %s AND %s
            )
            SELECT COUNT(*), COALESCE(SUM(active_days), 0), COALESCE(SUM(span), 0) FROM pro
            """,
            (start, end),
        )
        count, active, span = cur.fetchone()
        return {
            "count": count,
            "avg_active_days": _avg(float(active), count),
            "avg_span_days": _avg(float(span), count),
            "active_ratio": _share(int(active), int(span)),
        }

    def _preventive(self, cur, today: date) -> Dict[str, Any]:
        """État actuel du circuit préventif (hors période)."""
        cur.execute("SELECT COUNT(*) FROM preventive_plan WHERE active")
        plans = cur.fetchone()[0]
        cur.execute(
            """
            SELECT COUNT(*), MIN(COALESCE(triggered_at, created_at)::date)
            FROM preventive_occurrence WHERE status = 'generated'
            """
        )
        not_started, oldest = cur.fetchone()
        cur.execute(
            """
            SELECT COUNT(*), MIN(ir.created_at::date)
            FROM intervention_request ir
            WHERE ir.statut = 'nouvelle'
              AND EXISTS (SELECT 1 FROM preventive_occurrence po WHERE po.di_id = ir.id)
            """
        )
        pending, oldest_request = cur.fetchone()
        cur.execute("SELECT MAX(triggered_at) FROM preventive_occurrence WHERE di_id IS NOT NULL")
        last = cur.fetchone()[0]
        return {
            "active_plans": plans,
            "occurrences_not_started": not_started,
            "oldest_not_started_days": (today - oldest).days if oldest else None,
            "pending_requests": pending,
            "oldest_pending_request_days": (today - oldest_request).days
            if oldest_request
            else None,
            "last_generated_at": last,
        }

    def _waiting_parts(self, cur, today: date) -> Dict[str, Any]:
        cur.execute(
            """
            SELECT COUNT(*),
                   percentile_cont(0.5) WITHIN GROUP (ORDER BY %s::date - reported_date),
                   MAX(%s::date - reported_date)
            FROM intervention WHERE status_actual = 'attente_pieces'
            """,
            (today, today),
        )
        count, median, oldest = cur.fetchone()
        return {
            "count": count,
            "median_age_days": None if median is None else round(float(median), 1),
            "max_age_days": oldest,
        }

    def _waiting_parts_by_month(
        self, cur, keys: List[str], today: date
    ) -> Dict[str, Optional[int]]:
        """Interventions en attente de pièces au dernier jour de chaque mois (une requête).

        Reconstitué depuis le journal des statuts : dernier changement de chaque intervention
        jusqu'à la fin de ce jour. Le mois courant s'arrête à aujourd'hui ; un mois futur, ou
        dont la date précède le premier enregistrement du journal, donne null.
        """
        # Un mois postérieur au mois courant n'a pas d'état : null (pas de projection)
        snapshots = {k: min(_month_end(k), today) for k in keys if k <= today.strftime("%Y-%m")}
        cur.execute(
            """
            SELECT s.d, (SELECT MIN(date)::date FROM intervention_status_log),
                   (SELECT COUNT(*) FROM (
                        SELECT DISTINCT ON (l.intervention_id) l.status_to
                        FROM intervention_status_log l
                        WHERE l.date < s.d + 1
                        ORDER BY l.intervention_id, l.date DESC, l.id DESC
                    ) last WHERE last.status_to = 'attente_pieces')
            FROM unnest(%s::date[]) AS s(d)
            """,
            (list(snapshots.values()),),
        )
        counts = {}
        for day, first_logged, count in cur.fetchall():
            counts[day] = None if first_logged is None or day < first_logged else count
        return {k: counts[snapshots[k]] if k in snapshots else None for k in keys}

    def get_organisation(self, start: date, end: date, today: Optional[date] = None):
        """Indicateurs d'organisation de la période [start, end] (lecture seule)."""
        today = today or date.today()
        months = {k: _empty_month(k) for k in month_keys(start, end)}
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                self._fill_reported(cur, months, start, end)
                self._fill_hours(cur, months, start, end)
                self._fill_chantiers(cur, months, start, end)
                self._fill_tech_days(cur, months, start, end)
                projects = self._projects(cur, start, end)
                preventive = self._preventive(cur, today)
                waiting = self._waiting_parts(cur, today)
                waiting_by_month = self._waiting_parts_by_month(cur, list(months), today)
            conn.commit()
        except Exception as e:
            if conn:
                conn.rollback()
            raise_db_error(e, "indicateurs d'organisation")
        finally:
            if conn:
                release_connection(conn)

        monthly = [
            {**_finish(m), "waiting_parts_count": waiting_by_month[k]} for k, m in months.items()
        ]
        trends = {**compute_trends(monthly), "waiting_parts_count": compute_waiting_trend(monthly)}
        return {
            "period": {"start": start, "end": end},
            "monthly": monthly,
            "trends": trends,
            "totals": _finish(_sum_months(list(months.values()))),
            "projects": projects,
            "preventive": preventive,
            "waiting_parts": waiting,
        }


def _month_end(key: str) -> date:
    year, month = int(key[:4]), int(key[5:])
    return date(year, month, monthrange(year, month)[1])


def _sum_months(months: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Cumule les compteurs bruts des mois : les parts du total se recalculent dessus."""
    total = _empty_month("total")
    for m in months:
        for key, value in m.items():
            if key == "month":
                continue
            if key == "hours":
                for kind, hours in value.items():
                    total["hours"][kind] += hours
            else:
                total[key] += value
    del total["month"]
    return total
