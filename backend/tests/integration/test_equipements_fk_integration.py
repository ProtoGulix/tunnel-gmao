"""Clés étrangères de l'arbre des équipements (migration 0003, ADR 0011 décision 2.1)."""

import psycopg2
import pytest

pytestmark = pytest.mark.integration

_INSERT = "INSERT INTO machine (code, name, equipement_mere) VALUES (%s, %s, %s)"


def test_migration_pose_les_trois_cles_et_l_index(instance):
    noms = {
        r[0]
        for r in instance.sql(
            "SELECT conname FROM pg_constraint WHERE conrelid = 'public.machine'::regclass "
            "AND contype = 'f'"
        )
    }
    assert {
        "machine_equipement_mere_fkey",
        "machine_equipement_class_id_fkey",
        "machine_statut_id_fkey",
    } <= noms
    index = instance.sql("SELECT 1 FROM pg_indexes WHERE indexname = 'idx_machine_equipement_mere'")
    assert index


def test_mere_inexistante_refusee(instance):
    with pytest.raises(psycopg2.errors.ForeignKeyViolation):
        instance.sql(_INSERT, ("FK-ORPH", "Orpheline", "00000000-0000-0000-0000-000000000000"))


def test_suppression_d_une_mere_avec_fille_refusee(instance):
    mere = instance.sql(
        "INSERT INTO machine (code, name) VALUES ('FK-MERE', 'Mère') RETURNING id::text"
    )[0][0]
    instance.sql(_INSERT, ("FK-FILLE", "Fille", mere))
    with pytest.raises(psycopg2.errors.ForeignKeyViolation):
        instance.sql("DELETE FROM machine WHERE id = %s", (mere,))
    # Une fois la fille supprimée, la mère peut partir.
    instance.sql("DELETE FROM machine WHERE code = 'FK-FILLE'")
    instance.sql("DELETE FROM machine WHERE id = %s", (mere,))
