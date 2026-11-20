"""Table des types permis par classe d'équipement (TPE-01, ADR 0031, migration 0023)."""

import importlib.util
from pathlib import Path

import psycopg2
import pytest

pytestmark = pytest.mark.integration

_MIGRATION = Path(__file__).resolve().parents[2] / "alembic/versions/0023_types_par_classe.py"
_TABLE = "equipement_class_intervention_type"
_COLONNES = (
    "SELECT column_name, data_type, character_maximum_length FROM information_schema.columns "
    f"WHERE table_name = '{_TABLE}' ORDER BY column_name"
)
_CONTRAINTES = (
    "SELECT conname, contype, confdeltype, confupdtype FROM pg_constraint "
    f"WHERE conrelid = 'public.{_TABLE}'::regclass ORDER BY conname"
)
_INDEX = f"SELECT indexname FROM pg_indexes WHERE tablename = '{_TABLE}' ORDER BY indexname"
_EXISTE = f"SELECT to_regclass('public.{_TABLE}') IS NOT NULL"


def _migration():
    spec = importlib.util.spec_from_file_location("migration_0023", _MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _etat(instance):
    return instance.sql(_COLONNES), instance.sql(_CONTRAINTES), instance.sql(_INDEX)


def test_revision_et_parent():
    module = _migration()
    assert module.revision == "0023_types_par_classe"
    assert len(module.revision) <= 32
    assert module.down_revision == "0022_auteur_des_journaux"


def test_colonnes_alignees_sur_les_tables_referencees(instance):
    assert instance.sql(_COLONNES) == [
        ("equipement_class_id", "uuid", None),
        ("intervention_type_code", "character varying", 10),
    ]
    code = instance.sql(
        "SELECT character_maximum_length FROM information_schema.columns "
        "WHERE table_name = 'intervention_type' AND column_name = 'code'"
    )
    assert code == [(10,)]


def test_contraintes_et_index_presents(instance):
    contraintes = {ligne[0]: ligne[1:] for ligne in instance.sql(_CONTRAINTES)}
    assert contraintes == {
        f"{_TABLE}_pkey": ("p", " ", " "),
        f"{_TABLE}_class_fkey": ("f", "c", "a"),
        f"{_TABLE}_type_fkey": ("f", "a", "c"),
    }
    index = [ligne[0] for ligne in instance.sql(_INDEX)]
    assert f"idx_{_TABLE}_code" in index


def test_table_vide_apres_migration(instance):
    assert instance.sql(f"SELECT count(*) FROM {_TABLE}") == [(0,)]


def test_droits_du_role_applicatif(instance):
    conn = psycopg2.connect(instance.app_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT privilege_type FROM information_schema.role_table_grants "
                f"WHERE table_name = '{_TABLE}' AND grantee = current_user "
                "ORDER BY privilege_type"
            )
            droits = [ligne[0] for ligne in cur.fetchall()]
    finally:
        conn.close()
    assert droits == ["DELETE", "INSERT", "SELECT", "UPDATE"]


def test_cascades_de_la_classe_et_du_code(instance):
    classe = instance.sql(
        "INSERT INTO equipement_class (code, label) VALUES ('TPE01', 'Test TPE-01') RETURNING id"
    )[0][0]
    instance.sql(
        "INSERT INTO intervention_type (code, label) VALUES ('TPE', 'Test TPE-01') "
        "ON CONFLICT (code) DO NOTHING"
    )
    try:
        instance.sql(f"INSERT INTO {_TABLE} VALUES (%s, 'TPE')", (classe,))
        instance.sql("UPDATE intervention_type SET code = 'TPF' WHERE code = 'TPE'")
        assert instance.sql(f"SELECT intervention_type_code FROM {_TABLE}") == [("TPF",)]
        with pytest.raises(psycopg2.errors.UniqueViolation):
            instance.sql(f"INSERT INTO {_TABLE} VALUES (%s, 'TPF')", (classe,))
        instance.sql("DELETE FROM equipement_class WHERE id = %s", (classe,))
        assert instance.sql(f"SELECT count(*) FROM {_TABLE}") == [(0,)]
    finally:
        instance.sql("DELETE FROM equipement_class WHERE code = 'TPE01'")
        instance.sql("DELETE FROM intervention_type WHERE code IN ('TPE', 'TPF')")


def test_migration_rejouee_deux_fois_sans_changement(instance):
    module = _migration()
    avant = _etat(instance)
    for _ in range(2):
        for statement in module.upgrade_statements():
            instance.sql(statement)
    assert _etat(instance) == avant
    assert instance.sql(f"SELECT count(*) FROM {_TABLE}") == [(0,)]


def test_retour_arriere_puis_remontee(instance):
    module = _migration()
    avant = _etat(instance)
    for statement in module.downgrade_statements():
        instance.sql(statement)
    assert instance.sql(_EXISTE) == [(False,)]
    for statement in module.downgrade_statements():  # rejouable
        instance.sql(statement)
    for statement in module.upgrade_statements():
        instance.sql(statement)
    assert instance.sql(_EXISTE) == [(True,)]
    assert _etat(instance) == avant
