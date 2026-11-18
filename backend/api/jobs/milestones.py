"""Paliers de relance, fonction pure partagée par les alarmes du système (ADR 0023).

Un élément en retard est notifié à des paliers réguliers : premier palier, puis un tous les
`step_days` jours. Retard du préventif : échéance + 1, + 8, + 15... Alarme « sans action »
(PREV-05) : dernière activité + 7, + 14, + 21... Seul le premier palier change, la règle
est la même ; c'est pourquoi elle vit ici et nulle part ailleurs.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Optional


def latest_milestone(first: date, step_days: int, today: date) -> Optional[date]:
    """Dernier palier atteint (premier palier + k x step_days, k >= 0), None si pas encore."""
    if step_days < 1:
        raise ValueError("step_days doit valoir au moins 1")
    if today < first:
        return None
    elapsed = (today - first).days
    return first + timedelta(days=elapsed - elapsed % step_days)


def milestone_to_notify(
    first: date, step_days: int, today: date, catchup_days: int
) -> Optional[date]:
    """Palier à notifier aujourd'hui : le dernier palier atteint s'il tombe dans les
    `catchup_days` derniers jours (aujourd'hui compris), sinon None.

    La fenêtre rattrape un passage manqué (serveur arrêté) sans jamais notifier un palier
    ancien. Que ce palier ait déjà été émis est vérifié par l'appelant (clé : type, entité,
    palier), pas ici.
    """
    milestone = latest_milestone(first, step_days, today)
    if milestone is None or (today - milestone).days >= catchup_days:
        return None
    return milestone
