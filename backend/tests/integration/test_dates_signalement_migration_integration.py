"""Migration 0014 : dates de signalement manquantes complétées et tracées (IMPR-04)."""

import importlib.util
import json
import uuid
from pathlib import Path

import pytest

pytestmark = pytest.mark.integration

_MIGRATION = Path(__file__).resolve().parents[2] / "alembic/versions/0014_dates_signalement.py"
_AUDIT = (
    "SELECT old_value, new_value, reason_text, is_system, changed_by, decision_type "
    "FROM audit_log WHERE entity_type = 'intervention' AND entity_id = %s "
    "AND reason_code_id = (SELECT id FROM audit_reason_code WHERE code = 'DATA_BACKFILL')"
)


def _migration():
    spec = importlib.util.spec_from_file_location("migration_0014", _MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _jouer(instance, module):
    for statement in module.upgrade_statements():
        instance.sql(statement)


def _intervention(instance, code, reported_date=None, log_date=None):
    """Crée une intervention puis fixe son code (le trigger de création le recalcule)."""
    machine = instance.sql("SELECT id FROM machine LIMIT 1")
    if not machine:
        machine_id = str(uuid.uuid4())
        instance.sql(
            "INSERT INTO machine (id, code, name) VALUES (%s, %s, 'Machine IMPR-04')",
            (machine_id, f"M{machine_id[:6]}"),
        )
    else:
        machine_id = str(machine[0][0])
    intervention_id = str(uuid.uuid4())
    instance.sql(
        "INSERT INTO intervention (id, title, machine_id, type_inter, tech_initials, "
        "reported_date) VALUES (%s, 'Reprise', %s, 'CUR', 'IB', %s)",
        (intervention_id, machine_id, reported_date),
    )
    instance.sql("UPDATE intervention SET code = %s WHERE id = %s", (code, intervention_id))
    instance.sql(
        "DELETE FROM intervention_status_log WHERE intervention_id = %s", (intervention_id,)
    )
    if log_date:
        instance.sql(
            "INSERT INTO intervention_status_log (id, status_to, intervention_id, date) "
            "VALUES (gen_random_uuid(), 'ouvert', %s, %s)",
            (intervention_id, log_date),
        )
    return intervention_id


def _date(instance, intervention_id):
    return instance.sql("SELECT reported_date FROM intervention WHERE id = %s", (intervention_id,))[
        0
    ][0]


def test_revision_et_parent():
    module = _migration()
    assert module.revision == "0014_dates_signalement"
    assert module.down_revision == "0013_motifs_cloture"


def test_motif_present_sur_base_neuve_en_categorie_system(instance):
    ligne = instance.sql(
        "SELECT category, entity_types, decision_types, is_active FROM audit_reason_code "
        "WHERE code = 'DATA_BACKFILL'"
    )
    assert ligne == [("system", ["intervention"], ["reported_date_changed"], True)]


def test_completion_tracee_et_idempotente(instance):
    module = _migration()
    avec_code = _intervention(instance, "X-CUR-20250220-IB", log_date="2025-06-01 10:00:00")
    sans_code = _intervention(instance, "SANS-CODE", log_date="2025-03-04 08:30:00")
    date_invalide = _intervention(instance, "X-CUR-20250231-IB", log_date="2025-04-05 09:00:00")
    rien = _intervention(instance, "SANS-RIEN")
    deja = _intervention(instance, "X-CUR-20250110-IB", reported_date="2024-12-31")

    _jouer(instance, module)

    import datetime

    assert _date(instance, avec_code) == datetime.date(2025, 2, 20)
    assert _date(instance, sans_code) == datetime.date(2025, 3, 4)
    assert _date(instance, date_invalide) == datetime.date(2025, 4, 5)
    assert _date(instance, rien) is None
    assert _date(instance, deja) == datetime.date(2024, 12, 31)

    ligne = instance.sql(_AUDIT, (avec_code,))
    assert len(ligne) == 1
    ancien, nouveau, texte, systeme, auteur, decision = ligne[0]
    assert ancien == {"reported_date": None}
    assert nouveau == {"reported_date": "2025-02-20"}
    assert systeme is True and auteur is None and decision == "reported_date_changed"
    assert "code" in texte
    assert "journal" in instance.sql(_AUDIT, (sans_code,))[0][2]
    assert len(instance.sql(_AUDIT, (date_invalide,))) == 1
    assert instance.sql(_AUDIT, (rien,)) == []
    assert instance.sql(_AUDIT, (deja,)) == []

    # Rejouée : aucune modification, aucune ligne d'audit en plus.
    total = instance.sql("SELECT count(*) FROM audit_log")
    _jouer(instance, module)
    assert instance.sql("SELECT count(*) FROM audit_log") == total
    assert _date(instance, rien) is None
    json.dumps(nouveau)


def test_downgrade_garde_le_motif_reference_et_les_dates(instance):
    module = _migration()
    intervention_id = _intervention(instance, "Y-CUR-20250301-IB")
    _jouer(instance, module)
    for statement in module.downgrade_statements():
        instance.sql(statement)
    # Motif référencé par audit_log : conservé ; la date reste posée.
    assert instance.sql("SELECT count(*) FROM audit_reason_code WHERE code = 'DATA_BACKFILL'") == [
        (1,)
    ]
    assert _date(instance, intervention_id) is not None
