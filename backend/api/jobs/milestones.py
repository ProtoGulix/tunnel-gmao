"""Paliers de relance, fonction pure partagée par les alarmes du système (ADR 0023).

Un élément en retard est notifié à des paliers réguliers : premier palier, puis un tous les
`step_days` jours. Retard du préventif : échéance + 1, + 8, + 15... Alarme « sans action »
(PREV-05) : dernière activité + 7, + 14, + 21... Seul le premier palier change, la règle
est la même ; c'est pourquoi elle vit ici et nulle part ailleurs.

Le dernier palier atteint est toujours notifié s'il ne l'a pas déjà été (clé : type,
entité, palier, vérifiée par l'appelant) : à l'activation, tout le stock en retard sort une
fois, puis chaque élément revient à son palier suivant. Un passage manqué est rattrapé au
suivant. Décision de l'utilisateur du 2026-11-18, amendement de l'ADR 0023. L'appelant
impose en plus un intervalle entier depuis le dernier envoi (précision du 2026-11-19).
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
