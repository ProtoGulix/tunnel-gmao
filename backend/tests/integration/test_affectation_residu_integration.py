"""Nettoyage du résidu « 0 » de machine.affectation (migration 0005, ADR 0011 étape 5)."""

import importlib.util
from pathlib import Path

import pytest

pytestmark = pytest.mark.integration

_MIGRATION = Path(__file__).resolve().parents[2] / "alembic/versions/0005_affectation_residu.py"


def _clean_sql() -> str:
    spec = importlib.util.spec_from_file_location("migration_0005", _MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.CLEAN_SQL


def test_seul_le_residu_zero_est_vide(instance):
    rows = [("AFF-ZERO", "0"), ("AFF-ESP", " 0 "), ("AFF-VRAI", "Mur nord"), ("AFF-10", "10")]
    for code, affectation in rows:
        instance.sql(
            "INSERT INTO machine (code, name, affectation) VALUES (%s, %s, %s)",
            (code, code, affectation),
        )
    instance.sql(_clean_sql())
    result = dict(
        instance.sql("SELECT code, affectation FROM machine WHERE code LIKE 'AFF-%' ORDER BY code")
    )
    assert result == {"AFF-ZERO": None, "AFF-ESP": None, "AFF-VRAI": "Mur nord", "AFF-10": "10"}
    instance.sql("DELETE FROM machine WHERE code LIKE 'AFF-%'")
