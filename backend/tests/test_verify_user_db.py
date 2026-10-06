"""_verify_user_db : fail-closed en cas d'erreur base (audit 2026-10-06, constat 7)."""

import asyncio

import api.db
from api.auth.middleware import _verify_user_db


def test_une_erreur_base_refuse_le_jeton(monkeypatch):
    def _panne():
        raise RuntimeError("base indisponible")

    monkeypatch.setattr(api.db, "get_connection", _panne)
    assert asyncio.run(_verify_user_db("u1", "TECH", "/x", "GET")) is False
