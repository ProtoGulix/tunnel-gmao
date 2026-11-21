"""Messages des RAISE EXCEPTION de la base : seuls les refus métier connus vont au client."""

import re
from pathlib import Path

import pytest

from api.errors.exceptions import (
    GENERIC_DB_REFUSAL,
    ValidationError,
    raise_db_error,
    user_facing_db_message,
)

BACKEND = Path(__file__).resolve().parents[1]
# Messages volontairement masqués : défauts du serveur, pas des saisies à corriger.
MASQUES = {
    "changed_by obligatoire pour une mutation manuelle",
    "La raison X n'est pas une raison système",
    "GAMME_INCOMPLETE: X tache(s) obligatoire(s) en attente",  # traduit par sa route
    'Incohérence statut : statut actuel "X" ne correspond pas à la dernière entrée du log',
}


def _messages_sql():
    sources = [BACKEND / "db" / "schema.sql", *sorted((BACKEND / "alembic").rglob("*.py"))]
    found = set()
    for path in sources:
        for raw in re.findall(r"RAISE EXCEPTION\s+'((?:[^']|'')*)'", path.read_text()):
            found.add(raw.replace("''", "'").replace("%", "X"))
    return found


def test_chaque_raise_exception_est_classe():
    # Un nouveau RAISE EXCEPTION doit être rangé : message pour l'utilisateur ou masqué.
    messages = _messages_sql()
    assert len(messages) >= 16  # garde-fou : l'extraction trouve bien les messages
    for message in messages:
        if message in MASQUES:
            assert user_facing_db_message(message) == GENERIC_DB_REFUSAL, message
        else:
            assert user_facing_db_message(message) == message, message


@pytest.mark.parametrize(
    "message",
    ["changed_by obligatoire pour une mutation manuelle", "relation \"x\" does not exist", ""],
)
def test_message_inconnu_ou_interne_remplace(message):
    assert user_facing_db_message(message) == GENERIC_DB_REFUSAL


class _Diag:
    def __init__(self, message):
        self.message_primary = message


class _ErreurP0001(Exception):
    pgcode = "P0001"

    def __init__(self, message):
        super().__init__(message)
        self.diag = _Diag(message)


def test_raise_db_error_garde_le_refus_metier_et_masque_le_reste():
    with pytest.raises(ValidationError) as connu:
        raise_db_error(_ErreurP0001("time_spent minimum est 0.25h"))
    assert connu.value.detail == "time_spent minimum est 0.25h"

    with pytest.raises(ValidationError) as interne:
        raise_db_error(_ErreurP0001("La raison SYSTEM_X n'est pas une raison système"))
    assert interne.value.detail == GENERIC_DB_REFUSAL
