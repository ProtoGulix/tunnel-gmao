"""Motif SYSTEM_SCHEDULE (migration 0015, ADR 0023 point 4) : présent après bootstrap,
accepté pour une mutation système sans auteur."""

import uuid

import pytest

pytestmark = pytest.mark.integration

_APPEL = (
    "SELECT fn_audit_log_decision('intervention', %s, 'created', NULL, NULL, "
    "'SYSTEM_SCHEDULE', NULL, %s, %s)"
)


def test_motif_system_schedule_existe_apres_bootstrap(instance):
    ligne = instance.sql(
        "SELECT category, label, entity_types, decision_types, is_active "
        "FROM audit_reason_code WHERE code = 'SYSTEM_SCHEDULE'"
    )
    assert ligne == [("system", "Génération planifiée du système", None, None, True)]


def test_fn_audit_log_decision_accepte_system_schedule_sans_auteur(instance):
    entite = str(uuid.uuid4())
    log_id = instance.sql(_APPEL, (entite, None, True))[0][0]
    assert log_id is not None
    ligne = instance.sql(
        "SELECT l.is_system, l.changed_by, r.code FROM audit_log l "
        "JOIN audit_reason_code r ON r.id = l.reason_code_id WHERE l.id = %s",
        (log_id,),
    )
    assert ligne == [(True, None, "SYSTEM_SCHEDULE")]
