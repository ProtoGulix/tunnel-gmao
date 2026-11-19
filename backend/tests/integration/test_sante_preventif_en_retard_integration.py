"""Santé d'un équipement : un préventif en retard la passe en « Attention » (2026-11-19)."""

from datetime import date, timedelta

import pytest

from tests.integration.test_preventif_echeancier_integration import (
    _classe_et_machine,
    _demande,
    _occurrence,
    _plan,
)

pytestmark = pytest.mark.integration


def _sante(client, admin, machine):
    resp = client.get(f"/equipements/{machine}/health", headers=admin.headers)
    assert resp.status_code == 200, resp.text
    return resp.json()["data"]


def test_preventif_en_retard_passe_la_sante_en_attention(instance, client, admin):
    classe, machine = _classe_et_machine(instance)
    plan = _plan(instance, classe, jours=30)
    # Dernière réalisation clôturée il y a 40 jours : échéance passée de 10 jours.
    di = _demande(instance, machine, f"{date.today() - timedelta(days=40)} 10:00+00")
    _occurrence(instance, plan, machine, date.today() - timedelta(days=40), "completed", di)

    sante = _sante(client, admin, machine)

    assert sante["level"] == "warning"
    assert sante["reason"] == "1 préventif en retard"
    assert sante["overdue_preventive_count"] == 1
    assert "OVERDUE_PREVENTIVE > 0" in sante["rules_triggered"]


def test_preventif_a_jour_ne_change_pas_la_sante(instance, client, admin):
    classe, machine = _classe_et_machine(instance)
    plan = _plan(instance, classe, jours=30)
    di = _demande(instance, machine, f"{date.today() - timedelta(days=5)} 10:00+00")
    _occurrence(instance, plan, machine, date.today() - timedelta(days=5), "completed", di)

    sante = _sante(client, admin, machine)

    assert sante["overdue_preventive_count"] == 0
    assert "OVERDUE_PREVENTIVE > 0" not in sante["rules_triggered"]


def test_urgence_garde_sa_raison_malgre_le_preventif_en_retard(instance, client, admin):
    classe, machine = _classe_et_machine(instance)
    plan = _plan(instance, classe, jours=30)
    di = _demande(instance, machine, f"{date.today() - timedelta(days=40)} 10:00+00")
    _occurrence(instance, plan, machine, date.today() - timedelta(days=40), "completed", di)
    instance.sql(
        "INSERT INTO intervention (title, machine_id, type_inter, tech_initials, priority) "
        "VALUES ('Urgence', %s, 'CUR', 'IT', 'urgent')",
        (machine,),
    )

    sante = _sante(client, admin, machine)

    assert sante["level"] == "critical"
    assert "urgente" in sante["reason"]
    assert sante["overdue_preventive_count"] == 1
    assert "OVERDUE_PREVENTIVE > 0" in sante["rules_triggered"]
