"""Événements d'audit (ADR 0018, point 4) : garde-fous sans base, hors requête."""

from uuid import UUID, uuid4

import pytest

from api.audits.events import (
    AuditUnit,
    bind_audit_unit,
    record_audit_event,
    replaced_fields,
    unbind_audit_unit,
)


def test_un_evenement_hors_requete_est_refuse():
    with pytest.raises(RuntimeError):
        record_audit_event("intervention", uuid4(), "status_changed")


def test_un_evenement_depose_dans_l_unite_est_conserve():
    unit = AuditUnit()
    token = bind_audit_unit(unit)
    try:
        identifiant = uuid4()
        record_audit_event("intervention", str(identifiant), "x", {"a": 1}, {"a": 2})
    finally:
        unbind_audit_unit(token)
    assert [(e.entity_id, e.decision_type, e.is_system) for e in unit.events] == [
        (identifiant, "x", False)
    ]


def test_un_evenement_apres_la_fin_de_la_requete_est_refuse():
    unit = AuditUnit(closed=True)
    token = bind_audit_unit(unit)
    try:
        with pytest.raises(RuntimeError):
            record_audit_event("intervention", uuid4(), "tardif")
    finally:
        unbind_audit_unit(token)
    assert unit.events == []


def test_un_evenement_du_systeme_exige_un_motif():
    token = bind_audit_unit(AuditUnit())
    try:
        with pytest.raises(ValueError):
            record_audit_event("intervention", uuid4(), "auto", is_system=True)
    finally:
        unbind_audit_unit(token)


ENTITY = str(uuid4())


def test_champs_remplaces_par_un_evenement_sont_connus_du_middleware():
    unit = AuditUnit()
    token = bind_audit_unit(unit)
    try:
        record_audit_event(
            "task", UUID(ENTITY), "task_reopened", replaces_fields=("status", "closed_by")
        )
        assert replaced_fields("task", ENTITY) == {"status", "closed_by"}
        assert replaced_fields("task", str(uuid4())) == frozenset()
        assert replaced_fields("action", ENTITY) == frozenset()
    finally:
        unbind_audit_unit(token)
    assert replaced_fields("task", ENTITY) == frozenset()
