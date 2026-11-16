"""Règles métier des équipements."""

import re
from datetime import date

from api.errors.exceptions import ValidationError

_DEFAULT_CODE_PATTERN = re.compile(r"^EQ(\d+)$")


def build_equipement_code(
    class_code: str | None, no_machine: str | None, existing_codes: list[str]
) -> str:
    """Calcule le code d'un équipement créé sans code.

    Même règle que le formulaire web : code de la classe suivi du numéro machine
    sur trois chiffres (ALM + 7 → ALM007). Sans classe ou sans numéro, prend le
    premier code EQnnn libre après le plus grand existant.
    """
    number = (no_machine or "").strip()
    if class_code and number:
        return f"{class_code}{number.zfill(3)}"
    used = [
        int(m.group(1)) for code in existing_codes if (m := _DEFAULT_CODE_PATTERN.match(code or ""))
    ]
    return f"EQ{(max(used) + 1 if used else 1):03d}"


# Profondeur maximale de l'arbre des équipements, racine = niveau 1 (ADR 0011, décision 2.2).
MAX_TREE_DEPTH = 4


def validate_attachment(
    equipement_id: str | None,
    parent_id: str,
    *,
    parent_exists: bool,
    parent_depth: int,
    subtree_ids: set[str],
    subtree_height: int,
) -> None:
    """Contrôle le rattachement d'un équipement (ou d'une nouvelle fiche) à un parent.

    Les faits viennent du repo (requêtes récursives bornées) pour garder la règle pure :
    - parent_depth : niveau du parent dans l'arbre (racine = 1) ;
    - subtree_ids : l'équipement déplacé et tous ses descendants (vide à la création) ;
    - subtree_height : hauteur de ce sous-arbre, l'équipement compris (1 pour une feuille).
    equipement_id vaut None à la création : il n'existe encore ni cycle ni sous-arbre.
    """
    if equipement_id is not None and str(parent_id) == str(equipement_id):
        raise ValidationError("Un équipement ne peut pas être rattaché à lui-même.")
    if not parent_exists:
        raise ValidationError("L'équipement parent indiqué n'existe pas.")
    if str(parent_id) in subtree_ids:
        raise ValidationError(
            "Rattachement impossible : le parent choisi est un sous-équipement de "
            "l'équipement déplacé, cela créerait une boucle."
        )
    if parent_depth + subtree_height > MAX_TREE_DEPTH:
        raise ValidationError(
            f"Rattachement impossible : l'arbre des équipements est limité à "
            f"{MAX_TREE_DEPTH} niveaux."
        )


def validate_deletable(children_count: int) -> None:
    """Refuse la suppression d'un équipement qui a encore des sous-équipements."""
    if children_count > 0:
        raise ValidationError(
            f"Suppression impossible : cet équipement a {children_count} "
            "sous-équipement(s). Détachez-les ou supprimez-les d'abord."
        )


def validate_children_exist(missing_ids: list[str]) -> None:
    """Refuse une liste de sous-équipements qui en contient d'inexistants."""
    if missing_ids:
        raise ValidationError(
            f"Sous-équipement(s) inexistant(s) : {', '.join(str(i) for i in missing_ids)}."
        )


# Durée maximale d'une période de tableau de bord : 10 ans (3660 jours).
DASHBOARD_MAX_DAYS = 3660
# Nombre de mois calendaires de la période par défaut, mois courant inclus.
DASHBOARD_DEFAULT_MONTHS = 12


def resolve_dashboard_period(
    start: date | None, end: date | None, today: date | None = None
) -> tuple[date, date]:
    """Période du tableau de bord d'un équipement.

    Défaut : du 1er jour du mois d'il y a 11 mois jusqu'à aujourd'hui (12 mois calendaires,
    mois courant inclus). Refuse une période inversée ou de plus de 10 ans (400).
    """
    today = today or date.today()
    if end is None:
        end = today
    if start is None:
        index = end.year * 12 + (end.month - 1) - (DASHBOARD_DEFAULT_MONTHS - 1)
        start = date(index // 12, index % 12 + 1, 1)
    if start > end:
        raise ValidationError("La date de début doit précéder la date de fin")
    if (end - start).days > DASHBOARD_MAX_DAYS:
        raise ValidationError("La période ne peut pas dépasser 10 ans")
    return start, end


def month_keys(start: date, end: date) -> list[str]:
    """Tous les mois « AAAA-MM » de start à end, bornes comprises, même sans donnée."""
    keys = []
    year, month = start.year, start.month
    while (year, month) <= (end.year, end.month):
        keys.append(f"{year:04d}-{month:02d}")
        year, month = (year + 1, 1) if month == 12 else (year, month + 1)
    return keys
