"""Règles métier des équipements."""

import re

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
