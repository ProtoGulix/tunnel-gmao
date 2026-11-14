"""record_field_changes (AUDC-44) : une ligne par champ modifié, états complets, rien sinon."""

from uuid import uuid4

import pytest

from api.audits.events import (
    AuditUnit,
    bind_audit_unit,
    record_field_changes,
    unbind_audit_unit,
)


@pytest.fixture
def unit():
    unit = AuditUnit()
    token = bind_audit_unit(unit)
    yield unit
    unbind_audit_unit(token)


def test_un_evenement_par_champ_modifie(unit):
    avant = {"id": 3, "label": "A", "color": "red"}
    apres = {"id": 3, "label": "B", "color": "red"}
    record_field_changes("intervention_type", uuid4(), avant, apres)
    assert [e.decision_type for e in unit.events] == ["label_changed"]
    assert unit.events[0].old_value == avant and unit.events[0].new_value == apres


def test_aucun_evenement_sans_changement(unit):
    etat = {"id": 3, "label": "A"}
    record_field_changes("intervention_type", uuid4(), etat, dict(etat))
    assert unit.events == []
