"""Tâches planifiées (ADR 0023) : paliers, réglages, choix du motif, calcul de l'heure."""

import os
import subprocess
import sys
from datetime import date, datetime
from uuid import uuid4

import pytest

from api.audits.events import (
    AuditEvent,
    AuditUnit,
    bind_audit_unit,
    system_reason_code,
    unbind_audit_unit,
)
from api.jobs import executor
from api.jobs.milestones import latest_milestone
from api.jobs.scheduler import seconds_until_next_run

ECHEANCE = date(2026, 11, 1)
PREMIER_PALIER = date(2026, 11, 2)  # échéance + 1


# ── Paliers ──────────────────────────────────────────────────────────────


def test_pas_de_palier_avant_le_premier():
    assert latest_milestone(PREMIER_PALIER, 7, ECHEANCE) is None


@pytest.mark.parametrize(
    "today, attendu",
    [
        (date(2026, 11, 2), date(2026, 11, 2)),  # J+1
        (date(2026, 11, 8), date(2026, 11, 2)),  # J+7 : encore le premier
        (date(2026, 11, 9), date(2026, 11, 9)),  # J+8 : relance
        (date(2026, 11, 16), date(2026, 11, 16)),  # J+15
        (date(2026, 12, 1), date(2026, 11, 30)),  # J+30 : le palier J+29
    ],
)
def test_dernier_palier_atteint(today, attendu):
    assert latest_milestone(PREMIER_PALIER, 7, today) == attendu


def test_pas_de_pas_nul():
    with pytest.raises(ValueError):
        latest_milestone(PREMIER_PALIER, 0, date(2026, 11, 20))


# ── Heure du passage ─────────────────────────────────────────────────────


def test_prochain_passage_le_jour_meme_avant_l_heure():
    assert seconds_until_next_run(datetime(2026, 11, 18, 3, 0), 5) == 2 * 3600


def test_prochain_passage_le_lendemain_apres_l_heure():
    assert seconds_until_next_run(datetime(2026, 11, 18, 5, 0), 5) == 24 * 3600
    assert seconds_until_next_run(datetime(2026, 11, 18, 23, 0), 5) == 6 * 3600


# ── Réglages ─────────────────────────────────────────────────────────────

_ENV = {
    "PATH": os.environ.get("PATH", ""),
    "JWT_SECRET_KEY": "cle-de-test-uniquement-pour-pytest-0123456789",
    "DATABASE_URL": "postgresql://test:test@127.0.0.1:1/inexistante",
    "API_ENV": "test",
}


def _lire_reglages(extra=None, code="print(s.SCHEDULED_JOBS_ENABLED, s.SCHEDULED_JOBS_HOUR)"):
    return subprocess.run(
        [sys.executable, "-c", f"from api.settings import settings as s; {code}"],
        env={**_ENV, **(extra or {})},
        capture_output=True,
        text=True,
    )


def test_tache_quotidienne_desactivee_par_defaut_a_5_heures():
    done = _lire_reglages()
    assert done.returncode == 0, done.stderr
    assert done.stdout.split() == ["False", "5"]


def test_tache_quotidienne_activable_et_heure_reglable():
    done = _lire_reglages({"SCHEDULED_JOBS_ENABLED": "true", "SCHEDULED_JOBS_HOUR": "22"})
    assert done.stdout.split() == ["True", "22"]


@pytest.mark.parametrize("heure", ["24", "-1"])
def test_heure_hors_plage_refuse_de_demarrer(heure):
    assert _lire_reglages({"SCHEDULED_JOBS_HOUR": heure}).returncode == 1


def test_relance_reglable_et_valeurs_par_defaut():
    done = _lire_reglages(
        code="print(s.REMINDER_INTERVAL_DAYS)",
    )
    assert done.stdout.split() == ["7"]
    assert _lire_reglages({"REMINDER_INTERVAL_DAYS": "0"}).returncode == 1


# ── Choix du motif selon le contexte ─────────────────────────────────────


def test_motif_systeme_par_defaut_hors_unite_et_dans_une_requete():
    assert system_reason_code() == "SYSTEM_CASCADE"
    token = bind_audit_unit(AuditUnit())
    try:
        assert system_reason_code() == "SYSTEM_CASCADE"
    finally:
        unbind_audit_unit(token)


def test_motif_systeme_de_l_unite_planifiee():
    token = bind_audit_unit(AuditUnit(system_reason="SYSTEM_SCHEDULE"))
    try:
        assert system_reason_code() == "SYSTEM_SCHEDULE"
    finally:
        unbind_audit_unit(token)


# ── Exécuteur : écriture des événements ──────────────────────────────────


def _evenement(**kw):
    base = dict(
        entity_type="request",
        entity_id=uuid4(),
        decision_type="created",
        new_value={"a": 1},
        is_system=True,
        reason_code="SYSTEM_SCHEDULE",
    )
    return AuditEvent(**{**base, **kw})


def test_evenements_ecrits_sans_auteur_et_en_systeme(monkeypatch):
    ecrits = []
    monkeypatch.setattr(executor, "write_audit_entry", lambda **kw: ecrits.append(kw))
    executor._write_events(AuditUnit(events=[_evenement()]))
    assert ecrits[0]["changed_by"] is None
    assert ecrits[0]["is_system"] is True
    assert ecrits[0]["reason_code"] == "SYSTEM_SCHEDULE"


@pytest.mark.parametrize("kw", [{"is_system": False}, {"reason_code": None}])
def test_evenement_d_utilisateur_refuse_dans_une_tache_planifiee(monkeypatch, kw):
    monkeypatch.setattr(executor, "write_audit_entry", lambda **kw: None)
    with pytest.raises(RuntimeError):
        executor._write_events(AuditUnit(events=[_evenement(**kw)]))


# ── Boucle : arrêt propre ────────────────────────────────────────────────


def test_la_boucle_s_arrete_proprement_a_l_annulation(monkeypatch):
    import asyncio

    from api.jobs import scheduler

    passages = []

    async def faux_passage(*args, **kwargs):
        passages.append(1)

    monkeypatch.setattr(scheduler, "run_daily_pass", faux_passage)

    async def scenario():
        tache = asyncio.create_task(scheduler.daily_loop())
        await asyncio.sleep(0.05)
        tache.cancel()
        with pytest.raises(asyncio.CancelledError):
            await tache

    asyncio.run(scenario())
    assert passages == [1]  # un passage au démarrage, puis attente jusqu'à l'heure réglée


def test_seuil_sans_action_est_le_reglage_de_relance():
    # L'alarme « sans action » n'a pas de seuil propre : elle suit REMINDER_INTERVAL_DAYS.
    defaut = _lire_reglages(code="print(s.REMINDER_INTERVAL_DAYS)")
    assert defaut.stdout.split() == ["7"]
    regle = _lire_reglages({"REMINDER_INTERVAL_DAYS": "10"}, code="print(s.REMINDER_INTERVAL_DAYS)")
    assert regle.stdout.split() == ["10"]
