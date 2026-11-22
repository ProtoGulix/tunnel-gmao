"""Migration 0025 : « normale » devient « normal », contrainte CHECK (PRIO-01, ADR 0039)."""

import importlib.util
import uuid
from pathlib import Path

import psycopg2
import pytest

pytestmark = pytest.mark.integration

_MIGRATION = Path(__file__).resolve().parents[2] / "alembic/versions/0025_priorite_normal.py"
_AUDIT = (
    "SELECT old_value, new_value, is_system, changed_by, decision_type FROM audit_log "
    "WHERE entity_type = 'intervention' AND entity_id = %s "
    "AND reason_code_id = (SELECT id FROM audit_reason_code WHERE code = 'PRIORITY_NORMALIZED')"
)


def _migration():
    spec = importlib.util.spec_from_file_location("migration_0025", _MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _jouer(instance, module):
    for statement in module.upgrade_statements():
        instance.sql(statement)


def _intervention(instance, priority):
    """Crée une intervention ; la contrainte est levée le temps de poser une valeur ancienne."""
    # Une machine par intervention : le code généré (machine, type, jour, initiales) est unique.
    machine_id = str(uuid.uuid4())
    instance.sql(
        "INSERT INTO machine (id, code, name) VALUES (%s, %s, 'Machine PRIO-01')",
        (machine_id, f"P{machine_id[:6]}"),
    )
    intervention_id = str(uuid.uuid4())
    instance.sql(
        "INSERT INTO intervention (id, title, machine_id, type_inter, tech_initials) "
        "VALUES (%s, 'Priorité', %s, 'CUR', 'IB')",
        (intervention_id, machine_id),
    )
    instance.sql("ALTER TABLE intervention DROP CONSTRAINT IF EXISTS intervention_priority_check")
    instance.sql("UPDATE intervention SET priority = %s WHERE id = %s", (priority, intervention_id))
    return intervention_id


def _priorite(instance, intervention_id):
    return instance.sql("SELECT priority FROM intervention WHERE id = %s", (intervention_id,))[0][0]


def _contraintes(instance):
    return instance.sql(
        "SELECT count(*) FROM pg_constraint WHERE conname = 'intervention_priority_check'"
    )[0][0]


def test_revision_et_parent():
    module = _migration()
    assert module.revision == "0025_priorite_normal"
    assert module.down_revision == "0024_motifs_rejet_demande"


def test_motif_present_sur_base_neuve_en_categorie_system(instance):
    ligne = instance.sql(
        "SELECT category, entity_types, decision_types, is_active FROM audit_reason_code "
        "WHERE code = 'PRIORITY_NORMALIZED'"
    )
    assert ligne == [("system", ["intervention"], ["priority_changed"], True)]


def test_conversion_tracee_contrainte_posee_et_idempotente(instance):
    module = _migration()
    normale = _intervention(instance, "normale")
    normal = _intervention(instance, "normal")
    urgent = _intervention(instance, "urgent")
    vide = _intervention(instance, None)

    _jouer(instance, module)

    assert _priorite(instance, normale) == "normal"
    assert _priorite(instance, normal) == "normal"
    assert _priorite(instance, urgent) == "urgent"
    assert _priorite(instance, vide) is None

    ancien, nouveau, systeme, auteur, decision = instance.sql(_AUDIT, (normale,))[0]
    assert ancien == {"priority": "normale"} and nouveau == {"priority": "normal"}
    assert systeme is True and auteur is None and decision == "priority_changed"
    for autre in (normal, urgent, vide):
        assert instance.sql(_AUDIT, (autre,)) == []
    assert _contraintes(instance) == 1

    total = instance.sql("SELECT count(*) FROM audit_log")
    _jouer(instance, module)
    assert instance.sql("SELECT count(*) FROM audit_log") == total
    assert _contraintes(instance) == 1


def test_valeur_inconnue_refusee_par_la_contrainte_et_par_la_migration(instance):
    module = _migration()
    inconnue = _intervention(instance, "bizarre")
    with pytest.raises(psycopg2.Error, match="bizarre"):
        _jouer(instance, module)
    assert _contraintes(instance) == 0
    assert _priorite(instance, inconnue) == "bizarre"

    instance.sql("UPDATE intervention SET priority = 'normal' WHERE id = %s", (inconnue,))
    _jouer(instance, module)
    with pytest.raises(psycopg2.errors.CheckViolation):
        instance.sql("UPDATE intervention SET priority = 'normale' WHERE id = %s", (inconnue,))


def test_downgrade_retire_la_contrainte_sans_toucher_aux_donnees(instance):
    module = _migration()
    intervention_id = _intervention(instance, "normale")
    _jouer(instance, module)
    for statement in module.downgrade_statements():
        instance.sql(statement)
    assert _contraintes(instance) == 0
    assert _priorite(instance, intervention_id) == "normal"
    # Motif référencé par audit_log : conservé.
    assert instance.sql(
        "SELECT count(*) FROM audit_reason_code WHERE code = 'PRIORITY_NORMALIZED'"
    ) == [(1,)]
    _jouer(instance, module)
