"""Lecture des types d'intervention en base (ADR 0026).

Source unique : la table intervention_type. Une requête par appel, sans cache : un type
modifié ou désactivé en administration est visible immédiatement, y compris avec plusieurs
processus API (un cache en mémoire par processus ne serait pas invalidé entre eux).
"""

from typing import Any, Dict, List, Optional

from api.db import get_connection, release_connection
from api.errors.exceptions import ValidationError

_COLUMNS = "code, label, color, description, is_active"


def _to_item(row) -> Dict[str, Any]:
    """Forme de l'API : id = code, title = libellé (contrat de GET /interventions/types)."""
    code, label, color, description, is_active = row
    return {
        "id": code,
        "title": label,
        "color": color,
        "description": description,
        "is_active": is_active,
    }


def read_types(cur, include_inactive: bool = False) -> List[Dict[str, Any]]:
    """Types triés par libellé, avec le curseur fourni (même transaction que l'appelant)."""
    where = "" if include_inactive else "WHERE is_active"
    cur.execute(f"SELECT {_COLUMNS} FROM intervention_type {where} ORDER BY label ASC, code ASC")
    return [_to_item(r) for r in cur.fetchall()]


def list_types(include_inactive: bool = False) -> List[Dict[str, Any]]:
    """Types triés par libellé ; les inactifs seulement sur demande (affichage d'historique)."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            return read_types(cur, include_inactive)
    finally:
        release_connection(conn)


def get_type_labels() -> Dict[str, str]:
    """Code -> libellé de tous les types, inactifs compris (lecture de l'historique)."""
    return {t["id"]: t["title"] for t in list_types(include_inactive=True)}


def check_known(codes: List[str]) -> None:
    """Refuse (400) un code absent du référentiel ; un type inactif reste valable (filtres)."""
    known = {t["id"] for t in list_types(include_inactive=True)}
    unknown = [c for c in codes if c not in known]
    if unknown:
        raise ValidationError(
            f"Type d'intervention inconnu : {', '.join(unknown)}. "
            f"Valeurs : {', '.join(sorted(known))}"
        )


def check_assignable(code: str, current: Optional[str] = None) -> None:
    """Refuse (400) un type inconnu, ou inactif s'il s'agit d'une nouvelle valeur.

    `current` est la valeur déjà enregistrée : la remettre à l'identique reste accepté
    même si le type a été désactivé depuis."""
    types = {t["id"]: t for t in list_types(include_inactive=True)}
    found = types.get(code)
    if found is None:
        actifs = sorted(c for c, t in types.items() if t["is_active"])
        raise ValidationError(
            f"Type d'intervention '{code}' inconnu. Valeurs autorisées : {', '.join(actifs)}"
        )
    if not found["is_active"] and code != current:
        raise ValidationError(
            f"Le type d'intervention '{found['title']}' ({code}) est désactivé : "
            "choisissez un type actif."
        )
