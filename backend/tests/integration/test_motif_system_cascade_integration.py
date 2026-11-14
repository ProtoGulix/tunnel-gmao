"""Motif SYSTEM_CASCADE (migration 0007, ADR 0018 point 6) : présent après bootstrap,
accepté pour une mutation système. Le refus d'un motif system pour une mutation
d'utilisateur est fait par le middleware (ADR 0017 point 1), pas par la fonction en base."""

import uuid

import pytest

pytestmark = pytest.mark.integration

_APPEL = (
    "SELECT fn_audit_log_decision('intervention', %s, 'status_changed', NULL, NULL, "
    "'SYSTEM_CASCADE', NULL, %s, %s)"
)


def test_motif_system_cascade_existe_apres_bootstrap(instance):
    ligne = instance.sql(
        "SELECT category, label, entity_types, decision_types, is_active "
        "FROM audit_reason_code WHERE code = 'SYSTEM_CASCADE'"
    )
    assert ligne == [("system", "Mutation automatique du système", None, None, True)]


def test_fn_audit_log_decision_accepte_system_cascade_en_mode_systeme(instance):
    entite = str(uuid.uuid4())
    log_id = instance.sql(_APPEL, (entite, None, True))[0][0]
    assert log_id is not None
    ligne = instance.sql(
        "SELECT l.is_system, r.code FROM audit_log l "
        "JOIN audit_reason_code r ON r.id = l.reason_code_id WHERE l.id = %s",
        (log_id,),
    )
    assert ligne == [(True, "SYSTEM_CASCADE")]
