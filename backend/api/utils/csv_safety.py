"""Neutralisation des formules dans les exports CSV (CLAUDE.md section 6, règle 9).

Un tableur interprète comme une formule toute cellule texte qui commence par
=, +, -, @, tabulation ou retour chariot. On la préfixe d'une apostrophe.
"""

_FORMULA_TRIGGERS = ("=", "+", "-", "@", "\t", "\r")


def neutralize_csv_cell(value):
    """Rend une cellule inoffensive : None devient vide, les nombres restent
    des nombres, un texte dangereux est préfixé par une apostrophe."""
    if value is None:
        return ""
    if isinstance(value, str) and value.startswith(_FORMULA_TRIGGERS):
        return "'" + value
    return value


def neutralize_csv_row(row):
    """Applique neutralize_csv_cell à chaque cellule d'une ligne."""
    return [neutralize_csv_cell(cell) for cell in row]
