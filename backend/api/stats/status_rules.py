"""Seuils et textes de statut du Bilan du service (ADR 0034 points 8 et 9).

Les seuils sont définis ici une seule fois : le calcul des statuts et le champ `thresholds`
de /stats/service-status les lisent tous deux, le web n'en garde aucune copie.
"""

from typing import Dict, Tuple

# direction "above" : orange dès valeur >= orange, rouge dès valeur >= red (bornes incluses).
# direction "below" : orange dès valeur <= orange, rouge dès valeur <= red (bornes incluses).
STATUS_RULES: Dict[str, Dict[str, object]] = {
    "charge": {
        "direction": "above",
        "orange": 75.0,
        "red": 100.0,
        "texts": ("Normale", "Élevée", "Au plafond"),
    },
    "fragmentation": {
        "direction": "above",
        "orange": 5.0,
        "red": 15.0,
        "texts": ("Maîtrisée", "Notable", "Élevée"),
    },
    "pilotage": {
        "direction": "below",
        "orange": 20.0,
        "red": 10.0,
        "texts": ("Présent", "Limité", "Absent"),
    },
}

COLORS = ("green", "orange", "red")


def evaluate_status(name: str, value: float) -> Tuple[str, str]:
    """Retourne (couleur, texte d'un mot) de l'indicateur `name` pour `value` (en %)."""
    rule = STATUS_RULES[name]
    orange, red = rule["orange"], rule["red"]
    if rule["direction"] == "above":
        level = 2 if value >= red else 1 if value >= orange else 0
    else:
        level = 2 if value <= red else 1 if value <= orange else 0
    return COLORS[level], rule["texts"][level]


def thresholds_payload() -> Dict[str, Dict[str, object]]:
    """Forme du champ `thresholds` de la réponse (sans les textes)."""
    return {
        name: {k: rule[k] for k in ("direction", "orange", "red")}
        for name, rule in STATUS_RULES.items()
    }
