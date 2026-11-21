"""Série mensuelle du Bilan du service (ADR 0034 point 12) : calculs purs, sans accès base."""

from calendar import monthrange
from datetime import date
from typing import Any, Dict, List, Optional

from api.constants import TEAM_CAPACITY_HOURS_PER_MONTH
from api.equipements.validators import month_keys
from api.stats.trends import SHARE_STABLE_BELOW, compute_trend

# Pourcentages mensuels qui ont une tendance (mêmes noms que dans `monthly`).
SERVICE_TREND_FIELDS = ("charge_percent", "frag_percent", "pilot_percent")

# Colonnes lues par la requête mensuelle, dans l'ordre.
ROW_FIELDS = ("month", "pilot_hours", "frag_hours", "total_hours")

# Requête groupée par mois : classement partagé avec les totaux (CLASSIFIED_ACTIONS_CTE).
MONTHLY_SQL_TAIL = """
SELECT month,
       COALESCE(SUM(CASE WHEN time_type = 'PILOT' THEN time_spent ELSE 0 END), 0),
       COALESCE(SUM(CASE WHEN time_type = 'FRAG' THEN time_spent ELSE 0 END), 0),
       COALESCE(SUM(time_spent), 0)
FROM classified_actions GROUP BY month
"""


def month_capacity_hours(key: str, start: date, end: date) -> float:
    """Capacité d'un mois, proratisée sur ses jours compris dans la période (400 h / 30 j)."""
    year, month = int(key[:4]), int(key[5:])
    first = max(start, date(year, month, 1))
    last = min(end, date(year, month, monthrange(year, month)[1]))
    days = (last - first).days + 1
    return TEAM_CAPACITY_HOURS_PER_MONTH * days / 30


def _percent(part: float, whole: float) -> Optional[float]:
    return round(100.0 * part / whole, 1) if whole > 0 else None


def build_monthly(rows: List[tuple], start: date, end: date) -> List[Dict[str, Any]]:
    """Un élément par mois calendaire touché par la période ; pourcentages null sans heure."""
    by_month = {r[0]: dict(zip(ROW_FIELDS, r)) for r in rows}
    out = []
    for key in month_keys(start, end):
        row = by_month.get(key)
        total = float(row["total_hours"]) if row else 0.0
        capacity = month_capacity_hours(key, start, end)
        out.append(
            {
                "month": key,
                "total_hours": round(total, 2),
                "capacity_hours": round(capacity, 2),
                "charge_percent": _percent(total, capacity) if total > 0 else None,
                "frag_percent": _percent(float(row["frag_hours"]), total) if row else None,
                "pilot_percent": _percent(float(row["pilot_hours"]), total) if row else None,
            }
        )
    return out


def compute_service_trends(monthly: List[Dict[str, Any]]) -> Dict[str, Optional[str]]:
    """Tendance de charge, fragmentation et pilotage (« stable » sous 2 points)."""
    return {
        field: compute_trend([m[field] for m in monthly], SHARE_STABLE_BELOW)
        for field in SERVICE_TREND_FIELDS
    }
