"""Aucun détail interne d'exception ne part vers le client ; il est journalisé."""

import logging

import pytest

from api.errors.exceptions import DatabaseError, ValidationError, raise_db_error

SECRET = 'relation "secret_table" does not exist LINE 1'


def test_raise_db_error_journalise_le_detail_brut(caplog):
    with caplog.at_level(logging.ERROR):
        with pytest.raises(DatabaseError) as exc:
            raise_db_error(Exception(SECRET), "création équipement")
    assert SECRET in caplog.text
    assert "création équipement" in caplog.text
    assert SECRET not in str(exc.value.detail)


def test_raise_db_error_conserve_les_codes_connus():
    class PgErr(Exception):
        pgcode = "23505"

    with pytest.raises(Exception) as exc:
        raise_db_error(PgErr("dup"), "x")
    assert exc.value.status_code == 409


def test_import_csv_illisible_ne_fuit_pas_le_detail(monkeypatch, caplog):
    from api.purchase_requests import routes

    class BrokenReader:
        def __init__(self, *a, **k):
            pass

        def __iter__(self):
            raise RuntimeError(SECRET)

    monkeypatch.setattr(routes.csv, "DictReader", BrokenReader)
    with caplog.at_level(logging.ERROR):
        with pytest.raises(ValidationError) as exc:
            routes._parse_csv_bytes(b"a;b\n1;2\n")
    assert SECRET not in str(exc.value.detail)
    assert SECRET in caplog.text


def test_database_error_journalise_son_detail_sans_le_renvoyer(caplog):
    """Une centaine de blocs except lèvent DatabaseError(f"...{e}") : le détail doit
    rester visible dans les logs, jamais dans la réponse."""
    from api.errors.exceptions import DatabaseError

    with caplog.at_level("ERROR"):
        exc = DatabaseError("relation secret_table does not exist")
    assert "secret_table" not in exc.detail
    assert "secret_table" in caplog.text
