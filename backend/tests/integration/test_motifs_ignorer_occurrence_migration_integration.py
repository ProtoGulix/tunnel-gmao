"""Migration 0019 : motifs pour ignorer une occurrence, base neuve et base ancienne (CONT-03)."""

import importlib.util
from pathlib import Path

import pytest

pytestmark = pytest.mark.integration

_MIGRATION = (
    Path(__file__).resolve().parents[2] / "alembic/versions/0019_motifs_ignorer_occurrence.py"
)
_CODES = ("OCCURRENCE_MACHINE_DOWN", "OCCURRENCE_DONE_OFFLINE", "OCCURRENCE_PLAN_OBSOLETE")
_ETAT = (
    "SELECT code, label, category, entity_types, decision_types, is_active "
    "FROM audit_reason_code WHERE code = ANY(%s) OR code = 'OTHER' ORDER BY code"
)
_REGLE = (
    "SELECT is_routine, default_reason_code FROM audit_rule "
    "WHERE entity_type = 'preventive_occurrence' AND field IS NULL"
)


def _trie(lignes):
    return [(*ligne[:4], sorted(ligne[4] or []), ligne[5]) for ligne in lignes]


def _migration():
    spec = importlib.util.spec_from_file_location("migration_0019", _MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_revision_et_parent():
    module = _migration()
    assert module.revision == "0019_motifs_ignorer_occurrence"
    assert module.down_revision == "0018_contraintes_production"


def test_base_neuve_a_l_etat_attendu_et_rejouer_ne_change_rien(instance):
    module = _migration()
    avant = instance.sql(_ETAT, (list(_CODES),))
    assert [ligne[0] for ligne in avant if ligne[0] != "OTHER"] == sorted(_CODES)
    machine = [ligne for ligne in avant if ligne[0] == "OCCURRENCE_MACHINE_DOWN"][0]
    assert machine[1:] == (
        "Machine arrêtée",
        "user",
        ["preventive_occurrence"],
        ["occurrence_skipped"],
        True,
    )
    autre = [ligne for ligne in avant if ligne[0] == "OTHER"][0]
    assert "occurrence_skipped" in autre[4]
    assert instance.sql(_REGLE) == [(False, None)]
    for statement in module.upgrade_statements():
        instance.sql(statement)
    assert instance.sql(_ETAT, (list(_CODES),)) == avant
    assert instance.sql(_REGLE) == [(False, None)]


def test_retour_arriere_puis_remontee(instance):
    module = _migration()
    reference = instance.sql(_ETAT, (list(_CODES),))
    for statement in module.downgrade_statements():
        instance.sql(statement)
    assert instance.sql(_REGLE) == [(True, "ROUTINE")]
    # Les motifs déjà référencés par audit_log sont conservés (pas de clé étrangère).
    assert instance.sql(
        "SELECT 'preventive_occurrence' = ANY(entity_types) FROM audit_reason_code "
        "WHERE code = 'ROUTINE'"
    ) == [(True,)]
    for statement in module.upgrade_statements():
        instance.sql(statement)
    # L'ordre des décisions de OTHER change quand une migration plus récente a ajouté la sienne.
    assert _trie(instance.sql(_ETAT, (list(_CODES),))) == _trie(reference)
    assert instance.sql(_REGLE) == [(False, None)]
