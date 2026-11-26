"""Règles métier du référentiel des constats (ADR 0045) : validations sans accès base."""

import re
from typing import Optional

from api.errors.exceptions import ValidationError
from api.utils.sanitizer import strip_html

_CODE_RE = re.compile(r"^[A-Z][A-Z0-9_]{1,49}$")


def clean_label(label: Optional[str]) -> str:
    """Libellé sans balises ni blancs de bord ; refuse le vide."""
    cleaned = strip_html(label or "").strip()
    if not cleaned:
        raise ValidationError("Le libellé ne peut pas être vide")
    return cleaned


def check_code(code: str) -> str:
    """Code d'un choix : majuscules, chiffres et _, 2 à 50 caractères, première lettre."""
    if not _CODE_RE.match(code or ""):
        raise ValidationError("Code invalide : majuscules, chiffres et _, 2 à 50 caractères")
    return code
