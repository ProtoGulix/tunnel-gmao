"""Calcul pur de l'échéancier du préventif (périodicité glissante, ADR 0023).

Aucune base ici : la fonction reçoit des dates et rend un résultat, ce qui la rend
testable seule et réutilisable par la génération automatique.
"""

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Optional

STATE_OVERDUE = "overdue"
STATE_DUE_SOON = "due_soon"
STATE_OK = "ok"
STATE_NOT_COMPUTED = "not_computed"

# Liste blanche du filtre `state` de la route.
SCHEDULE_STATES = (STATE_OVERDUE, STATE_DUE_SOON, STATE_OK, STATE_NOT_COMPUTED)


@dataclass(frozen=True)
class Due:
    """Échéance d'un couple plan x machine."""

    due_date: Optional[date]
    state: str
    days_overdue: int


def classify_due(due_date: date, today: date, lead_days: int) -> Due:
    """État d'une échéance : en retard si elle est passée, bientôt due si elle tombe
    dans la prévenance (aujourd'hui inclus), sinon ok."""
    if due_date < today:
        return Due(due_date, STATE_OVERDUE, (today - due_date).days)
    if due_date <= today + timedelta(days=lead_days):
        return Due(due_date, STATE_DUE_SOON, 0)
    return Due(due_date, STATE_OK, 0)


def compute_due(
    reference_date: Optional[date], periodicity_days: int, today: date, lead_days: int
) -> Due:
    """Échéance glissante : référence + périodicité. Sans référence (aucun historique),
    l'échéance est aujourd'hui, comme la génération actuelle."""
    if reference_date is None:
        return classify_due(today, today, lead_days)
    return classify_due(reference_date + timedelta(days=periodicity_days), today, lead_days)


def not_computed() -> Due:
    """Plan au compteur d'heures : le compteur mesure le temps passé, pas le fonctionnement
    (docs/backlog/releve-compteur-heures.md), aucune échéance n'est calculée."""
    return Due(None, STATE_NOT_COMPUTED, 0)
