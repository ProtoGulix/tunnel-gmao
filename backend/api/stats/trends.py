"""Tendance d'un indicateur mensuel sur la période (ADR 0034 point 10). Fonctions pures."""

from typing import Dict, List, Optional

MIN_MONTHS = 3
# Variation estimée sous ce seuil (en valeur absolue) : tendance « stable ».
SHARE_STABLE_BELOW = 2.0  # points, pour une part en %
AVG_STABLE_BELOW = 0.1  # interventions par journée

# Indicateurs mensuels avec tendance, et leur seuil de stabilité.
TREND_FIELDS: Dict[str, float] = {
    "urgent_share": SHARE_STABLE_BELOW,
    "interrupted_share": SHARE_STABLE_BELOW,
    "avg_interventions_per_tech_day": AVG_STABLE_BELOW,
    "scattered_days_share": SHARE_STABLE_BELOW,
    "preventive_hours_share": SHARE_STABLE_BELOW,
}


def _slope(points: List[tuple]) -> float:
    """Pente des moindres carrés de points (x, y) ; x distincts."""
    n = len(points)
    mean_x = sum(x for x, _ in points) / n
    mean_y = sum(y for _, y in points) / n
    num = sum((x - mean_x) * (y - mean_y) for x, y in points)
    den = sum((x - mean_x) ** 2 for x, _ in points)
    return num / den


def compute_trend(values: List[Optional[float]], stable_below: float) -> Optional[str]:
    """'up', 'down', 'stable' ou None.

    Les valeurs nulles (mois sans donnée) sont ignorées ; la position de chaque mois dans
    la période est conservée. Moins de 3 valeurs : None. Variation estimée = pente × (mois - 1),
    mois = nombre total de mois de la période ; stable si |variation| < stable_below.
    """
    points = [(i, float(v)) for i, v in enumerate(values) if v is not None]
    if len(points) < MIN_MONTHS:
        return None
    change = _slope(points) * (len(values) - 1)
    if abs(change) < stable_below:
        return "stable"
    return "up" if change > 0 else "down"


# Pièces en attente : « stable » sous une intervention d'écart estimé.
WAITING_STABLE_BELOW = 1.0


def compute_trends(monthly: List[Dict]) -> Dict[str, Optional[str]]:
    """Tendance de chaque indicateur de TREND_FIELDS sur la série mensuelle."""
    return {
        field: compute_trend([m.get(field) for m in monthly], threshold)
        for field, threshold in TREND_FIELDS.items()
    }


def compute_waiting_trend(monthly: List[Dict]) -> Optional[str]:
    """Tendance du nombre d'interventions en attente de pièces (ADR 0034 point 12)."""
    return compute_trend([m.get("waiting_parts_count") for m in monthly], WAITING_STABLE_BELOW)


# Synthèse de l'audit (ADR 0035 point 4) : parts en points, total de décisions en nombre.
DECISIONS_STABLE_BELOW = 2.0  # décisions d'écart estimé

AUDIT_TREND_FIELDS: Dict[str, float] = {
    "without_guarantor_share": SHARE_STABLE_BELOW,
    "done_without_guarantor_action_share": SHARE_STABLE_BELOW,
    "spotted_in_field_share": SHARE_STABLE_BELOW,
    "shared_tasks_share": SHARE_STABLE_BELOW,
    "system_share": SHARE_STABLE_BELOW,
    "decisions_total": DECISIONS_STABLE_BELOW,
}


def compute_audit_trends(monthly: List[Dict]) -> Dict[str, Optional[str]]:
    """Tendance de chaque indicateur de la synthèse de l'audit ; mois incomplets inclus."""
    return {
        field: compute_trend([m.get(field) for m in monthly], threshold)
        for field, threshold in AUDIT_TREND_FIELDS.items()
    }
