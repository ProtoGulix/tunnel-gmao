"""Lecture des types d'intervention en base (ADR 0026).

Source unique : la table intervention_type. Une requête par appel, sans cache : un type
modifié ou désactivé en administration est visible immédiatement, y compris avec plusieurs
processus API (un cache en mémoire par processus ne serait pas invalidé entre eux).
"""

from typing import Any, Dict, List, Optional

from api.db import get_connection, release_connection
from api.errors.exceptions import ValidationError

_COLUMNS = "code, label, color, description, is_active, constat_required"


def _to_item(row) -> Dict[str, Any]:
    """Forme de l'API : id = code, title = libellé (contrat de GET /interventions/types)."""
    code, label, color, description, is_active, constat_required = row
    return {
        "id": code,
        "title": label,
        "color": color,
        "description": description,
        "is_active": is_active,
        "constat_required": constat_required,
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


# Type des interventions issues d'un plan préventif : un plan est une configuration délibérée,
# ce type reste donc permis quelle que soit la classe (ADR 0031), sinon une classe sans PRE
# ferait échouer la génération quotidienne du préventif.
PREVENTIVE_TYPE = "PRE"


def is_preventive_origin(cur, request_id: Any = None, plan_id: Any = None) -> bool:
    """Vrai si l'intervention vient d'un plan : plan_id fourni, ou demande liée à une occurrence."""
    if plan_id:
        return True
    if not request_id:
        return False
    cur.execute("SELECT 1 FROM preventive_occurrence WHERE di_id = %s LIMIT 1", (str(request_id),))
    return cur.fetchone() is not None


def allowed_type_codes(machine_id: Any, cur=None, from_plan: bool = False) -> Optional[List[str]]:
    """Codes des types permis pour un équipement (ADR 0031) ; None = tous permis.

    Fonction unique de la règle : elle sert au refus (création, changement de type ou
    d'équipement) et à la lecture filtrée. Un équipement sans classe, une classe sans liste
    ou un équipement inconnu permettent tous les types. `cur` : curseur de l'appelant
    (même transaction) ; sans lui, une connexion est empruntée le temps de la lecture.
    `from_plan` : l'intervention vient d'un plan préventif, le type PRE est toujours permis.
    Dualité : la table s'appelle machine, l'API expose equipement."""
    if machine_id is None:
        return None
    if cur is None:
        conn = get_connection()
        try:
            with conn.cursor() as own:
                return allowed_type_codes(machine_id, own, from_plan)
        finally:
            release_connection(conn)
    cur.execute(
        """
        SELECT ect.intervention_type_code
        FROM machine m
        JOIN equipement_class_intervention_type ect
          ON ect.equipement_class_id = m.equipement_class_id
        WHERE m.id = %s
        ORDER BY ect.intervention_type_code
        """,
        (str(machine_id),),
    )
    codes = [r[0] for r in cur.fetchall()]
    if codes and from_plan and PREVENTIVE_TYPE not in codes:
        codes.append(PREVENTIVE_TYPE)
    return codes or None


def list_types_for_machine(machine_id: Any, include_inactive: bool = False) -> List[Dict[str, Any]]:
    """Types triés par libellé, limités à ceux que permet l'équipement (lecture filtrée)."""
    allowed = allowed_type_codes(machine_id)
    items = list_types(include_inactive)
    return items if allowed is None else [t for t in items if t["id"] in allowed]


def check_allowed_for_machine(
    code: str, machine_id: Any, cur=None, from_plan: bool = False
) -> None:
    """Refuse (400) un type que la classe de l'équipement ne permet pas, avec la liste permise."""
    allowed = allowed_type_codes(machine_id, cur, from_plan)
    if allowed is None or code in allowed:
        return
    labels = {t["id"]: t["title"] for t in list_types(include_inactive=True)}
    permis = ", ".join(f"{labels.get(c, c)} ({c})" for c in allowed)
    raise ValidationError(
        f"Le type d'intervention '{code}' n'est pas permis pour cet équipement. "
        f"Types permis : {permis}"
    )


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
