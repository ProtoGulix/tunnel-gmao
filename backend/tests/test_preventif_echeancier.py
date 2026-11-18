"""Échéancier du préventif : calcul pur, réglage de prévenance, droit de lecture par rôle."""

from datetime import date

import pytest

from api.preventive_occurrences import schedule
from api.settings import settings
from db.default_permissions import Endpoint, default_allowed

TODAY = date(2026, 11, 18)


def test_echeance_glissante_ok():
    due = schedule.compute_due(date(2026, 11, 10), 30, TODAY, 7)
    assert due.due_date == date(2026, 12, 10)
    assert due.state == "ok"
    assert due.days_overdue == 0


def test_echeance_en_retard():
    due = schedule.compute_due(date(2026, 10, 1), 30, TODAY, 7)  # échéance 31/10
    assert due.due_date == date(2026, 10, 31)
    assert due.state == "overdue"
    assert due.days_overdue == 18


def test_echeance_aujourd_hui_est_bientot_due_pas_en_retard():
    due = schedule.compute_due(date(2026, 10, 19), 30, TODAY, 7)  # échéance 18/11
    assert due.state == "due_soon"
    assert due.days_overdue == 0


def test_prevenance_bornes():
    # Dernier jour de la prévenance : bientôt due ; le lendemain : ok.
    assert schedule.classify_due(date(2026, 11, 25), TODAY, 7).state == "due_soon"
    assert schedule.classify_due(date(2026, 11, 26), TODAY, 7).state == "ok"
    assert schedule.classify_due(date(2026, 11, 17), TODAY, 7).state == "overdue"


def test_sans_historique_echeance_aujourd_hui():
    due = schedule.compute_due(None, 30, TODAY, 7)
    assert due.due_date == TODAY
    assert due.state == "due_soon"


def test_plan_heures_non_calcule():
    due = schedule.not_computed()
    assert due.due_date is None
    assert due.state == "not_computed"


def test_prevenance_par_defaut_sept_jours():
    assert settings.PREVENTIVE_LEAD_DAYS == 7


@pytest.mark.parametrize("role", ["ADMIN", "RESP", "TECH", "ACHETEUR", "MCP"])
def test_lecture_echeancier_ouverte(role):
    ep = Endpoint("x:y", "GET", "/preventive-occurrences/schedule", "Preventive Occurrences")
    assert default_allowed(role, ep)
