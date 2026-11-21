"""Migration 0020 : types d'intervention en base, base neuve et base ancienne (TYP-01)."""

import importlib.util
from pathlib import Path

import psycopg2
import pytest

pytestmark = pytest.mark.integration

_BACKEND = Path(__file__).resolve().parents[2]
_MIGRATION = _BACKEND / "alembic/versions/0020_types_intervention_en_base.py"
_SEED = _BACKEND / "db/seed_reference.sql"
_CODES = ["BAT", "COF", "CUR", "MES", "PIL", "PRE", "PRO", "REA"]
_ETAT = "SELECT code, label, color, is_active, description FROM intervention_type ORDER BY code"
_FKS = (
    "SELECT conname FROM pg_constraint WHERE conname IN "
    "('intervention_type_inter_fkey', 'intervention_request_suggested_type_inter_fkey') "
    "ORDER BY conname"
)
_NOMS_FK = [
    ("intervention_request_suggested_type_inter_fkey",),
    ("intervention_type_inter_fkey",),
]


def _migration():
    spec = importlib.util.spec_from_file_location("migration_0020", _MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _machine(instance, code):
    return instance.sql(
        "INSERT INTO machine (code, name) VALUES (%s, %s) RETURNING id::text", (code, code)
    )[0][0]


def test_revision_et_parent():
    module = _migration()
    assert module.revision == "0020_types_intervention_en_base"
    assert module.down_revision == "0019_motifs_ignorer_occurrence"


def test_instructions_du_seed_identiques_a_la_migration():
    seed = _SEED.read_text(encoding="utf-8")
    for statement in _migration().upgrade_statements():
        assert statement + ";" in seed


def test_base_neuve_a_les_huit_types_et_les_cles_etrangeres(instance):
    # La base de la session est partagée : d'autres tests ajoutent des types, on filtre.
    etat = [ligne for ligne in instance.sql(_ETAT) if ligne[0] in _CODES]
    assert [ligne[0] for ligne in etat] == _CODES
    assert all(ligne[3] and ligne[4] for ligne in etat)
    curatif = [ligne for ligne in etat if ligne[0] == "CUR"][0]
    assert curatif[1:3] == ("Curatif", "red")
    assert instance.sql(_FKS) == _NOMS_FK
    machine = _machine(instance, "TYP-NEUVE")
    with pytest.raises(psycopg2.errors.ForeignKeyViolation):
        instance.sql(
            "INSERT INTO intervention (title, machine_id, type_inter, tech_initials) "
            "VALUES ('Inconnu', %s, 'ZZZ', 'IT')",
            (machine,),
        )
    with pytest.raises(psycopg2.errors.ForeignKeyViolation):
        instance.sql(
            "INSERT INTO intervention_request (code, machine_id, demandeur_nom, description, "
            "statut, suggested_type_inter) VALUES ('DI-TYP-ZZZ', %s, 'A', 'B', 'nouvelle', 'ZZZ')",
            (machine,),
        )


def test_rejouer_ne_change_rien_ni_n_ecrase(instance):
    module = _migration()
    instance.sql(
        "UPDATE intervention_type SET label = 'Correctif', description = 'Mien' WHERE code = 'CUR'"
    )
    avant = instance.sql(_ETAT)
    for statement in module.upgrade_statements():
        instance.sql(statement)
    assert instance.sql(_ETAT) == avant
    assert instance.sql(_FKS) == _NOMS_FK
    instance.sql(
        "UPDATE intervention_type SET label = 'Curatif', "
        "description = 'Réparer une panne ou un défaut constaté sur un équipement.' "
        "WHERE code = 'CUR'"
    )


def test_code_orphelin_preexistant_rattrape(instance):
    module = _migration()
    machine = _machine(instance, "TYP-ORPHELIN")
    for statement in module.downgrade_statements():
        instance.sql(statement)
    instance.sql(
        "INSERT INTO intervention (title, machine_id, type_inter, tech_initials) "
        "VALUES ('Ancien', %s, 'ZZ1', 'IT')",
        (machine,),
    )
    for statement in module.upgrade_statements():
        instance.sql(statement)
    orphelins = instance.sql(
        "SELECT code, label, is_active FROM intervention_type WHERE code LIKE 'ZZ%' ORDER BY code"
    )
    assert orphelins == [("ZZ1", "ZZ1", False)]
    assert instance.sql(_FKS) == _NOMS_FK
    assert instance.sql("SELECT type_inter FROM intervention WHERE title = 'Ancien'") == [("ZZ1",)]


def test_retour_arriere_garde_les_types_et_retire_cles_et_colonne(instance):
    module = _migration()
    instance.sql("UPDATE intervention_type SET description = NULL")
    for statement in module.downgrade_statements():
        instance.sql(statement)
    assert instance.sql(_FKS) == []
    colonne = (
        "SELECT count(*) FROM information_schema.columns WHERE table_name = "
        "'intervention_type' AND column_name = 'description'"
    )
    assert instance.sql(colonne) == [(0,)]
    assert instance.sql("SELECT count(*) FROM intervention_type")[0][0] >= 8
    for statement in module.upgrade_statements():
        instance.sql(statement)
    assert instance.sql(colonne) == [(1,)]
    assert instance.sql(_FKS) == _NOMS_FK
    assert all(ligne[4] for ligne in instance.sql(_ETAT) if ligne[0] in _CODES)
