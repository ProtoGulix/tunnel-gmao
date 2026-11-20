"""Tâche quotidienne du système (ADR 0023, PREV-04) : exécuteur hors requête, verrou,
génération idempotente, notifications de retard par paliers, audit des tâches de gamme."""

import asyncio
import time
from datetime import date, timedelta

import pytest

from api.audits.repo import AuditRepository
from api.jobs import scheduler, steps
from api.jobs.executor import run_system_step
from api.jobs.scheduler import JobStep, run_daily_pass
from tests.integration.etape2_helpers import lignes_audit
from tests.integration.test_audc24_preventif_integration import _classe_machines_plan

pytestmark = pytest.mark.integration


@pytest.fixture
def plan_factory(instance, client):
    """Plans de test, désactivés (et leurs occurrences annulées) en fin de test."""
    crees = []

    def fabrique(n_machines=1, auto_accept=False):
        machines, plan = _classe_machines_plan(instance, n_machines, auto_accept)
        crees.append(plan)
        return machines, plan

    yield fabrique
    for plan in crees:
        instance.sql("UPDATE preventive_plan SET active = false WHERE id = %s", (plan,))
        instance.sql(
            "UPDATE preventive_occurrence SET status = 'cancelled' "
            "WHERE plan_id = %s AND status IN ('pending','generated','in_progress')",
            (plan,),
        )


@pytest.fixture
def mails(monkeypatch):
    """Intercepte les mails di_a_traiter (aucun envoi) et retourne les ids de DI."""
    envoyes = []

    async def faux(di_id):
        envoyes.append(di_id)

    monkeypatch.setattr(scheduler, "send_di_a_traiter_mails", faux)
    return envoyes


def _occurrences(instance, plan):
    return instance.sql(
        "SELECT id::text, di_id::text FROM preventive_occurrence WHERE plan_id = %s", (plan,)
    )


def _occurrence_en_retard(instance, plan, machine, echeance, status="generated"):
    return str(
        instance.sql(
            "INSERT INTO preventive_occurrence (plan_id, machine_id, scheduled_date, status) "
            "VALUES (%s, %s, %s, %s) RETURNING id",
            (plan, machine, echeance, status),
        )[0][0]
    )


def _notifs(instance, occurrence):
    return instance.sql(
        "SELECT user_id::text, data->>'milestone', message, data FROM notification "
        "WHERE type = 'preventif_echeance' AND entity_id = %s",
        (occurrence,),
    )


def _actifs(instance) -> int:
    return instance.sql("SELECT count(*) FROM tunnel_user WHERE is_active")[0][0]


# ── Exécuteur système et audit ───────────────────────────────────────────


def test_generation_planifiee_audit_systeme_sans_auteur_avec_taches(instance, plan_factory):
    (machine,), plan = plan_factory()
    result = run_system_step(steps.generate_preventive)
    assert result["generated"] >= 1

    ((occ_id, di_id),) = _occurrences(instance, plan)
    assert lignes_audit(instance, occ_id) == [
        ("preventive_occurrence", "created", "SYSTEM_SCHEDULE", True, None)
    ]
    assert lignes_audit(instance, di_id) == [("request", "created", "SYSTEM_SCHEDULE", True, None)]
    (task_id,) = [
        r[0]
        for r in instance.sql(
            "SELECT id::text FROM intervention_task WHERE occurrence_id = %s", (occ_id,)
        )
    ]
    assert lignes_audit(instance, task_id) == [("task", "created", "SYSTEM_SCHEDULE", True, None)]


def test_acceptation_automatique_planifiee_motif_planifie(instance, plan_factory):
    _, plan = plan_factory(auto_accept=True)
    run_system_step(steps.generate_preventive)
    ((occ_id, di_id),) = _occurrences(instance, plan)
    intervention = instance.sql(
        "SELECT intervention_id::text FROM preventive_occurrence WHERE id = %s", (occ_id,)
    )[0][0]
    assert lignes_audit(instance, intervention) == [
        ("intervention", "created", "SYSTEM_SCHEDULE", True, None)
    ]
    # La demande acceptée : tous ses événements système portent le motif planifié.
    assert {(x[2], x[3], x[4]) for x in lignes_audit(instance, di_id)} == {
        ("SYSTEM_SCHEDULE", True, None)
    }
    # Une ligne `created` et, depuis CASC-03, une ligne `updated` : l'acceptation rattache la
    # tâche, la date et l'affecte. Les deux portent le motif planifié, sans auteur.
    taches = instance.sql(
        "SELECT l.decision_type, r.code, l.is_system, l.changed_by FROM audit_log l "
        "JOIN audit_reason_code r ON r.id = l.reason_code_id "
        "WHERE l.entity_type = 'task' AND l.entity_id IN "
        "(SELECT id FROM intervention_task WHERE occurrence_id = %s) ORDER BY l.decision_type",
        (occ_id,),
    )
    assert taches == [
        ("created", "SYSTEM_SCHEDULE", True, None),
        ("updated", "SYSTEM_SCHEDULE", True, None),
    ]


def test_bouton_generer_garde_motif_cascade_et_auteur_du_jeton(
    instance, client, admin, plan_factory
):
    _, plan = plan_factory()
    resp = client.post("/preventive-occurrences/generate", headers=admin.headers)
    assert resp.status_code == 200, resp.text
    ((occ_id, _),) = _occurrences(instance, plan)
    assert lignes_audit(instance, occ_id) == [
        ("preventive_occurrence", "created", "SYSTEM_CASCADE", True, admin.id)
    ]
    (task_id,) = instance.sql(
        "SELECT id::text FROM intervention_task WHERE occurrence_id = %s", (occ_id,)
    )[0]
    assert lignes_audit(instance, task_id) == [
        ("task", "created", "SYSTEM_CASCADE", True, admin.id)
    ]


def test_erreur_dans_l_etape_annule_tout(instance, plan_factory):
    _, plan = plan_factory()

    def etape_qui_echoue():
        steps.generate_preventive()
        raise RuntimeError("panne après écriture")

    with pytest.raises(RuntimeError):
        run_system_step(etape_qui_echoue)
    assert _occurrences(instance, plan) == []
    assert instance.sql(
        "SELECT count(*) FROM intervention_task t JOIN preventive_plan_gamme_step s "
        "ON s.id = t.gamme_step_id WHERE s.plan_id = %s",
        (plan,),
    ) == [(0,)]


def test_audit_qui_echoue_annule_la_generation(instance, plan_factory, monkeypatch):
    _, plan = plan_factory()

    def en_panne(self, **kwargs):
        raise RuntimeError("audit indisponible")

    monkeypatch.setattr(AuditRepository, "call_fn_audit_log_decision", en_panne)
    with pytest.raises(RuntimeError):
        run_system_step(steps.generate_preventive)
    assert _occurrences(instance, plan) == []


# ── Verrou, idempotence, mails ───────────────────────────────────────────


def test_deux_passages_concurrents_ne_font_qu_un_passage(client):
    compteur = []

    def etape_lente():
        compteur.append(1)
        time.sleep(1.0)
        return "ok"

    async def deux():
        return await asyncio.gather(
            run_daily_pass([JobStep("lente", etape_lente)]),
            run_daily_pass([JobStep("lente", etape_lente)]),
        )

    rapports = asyncio.run(deux())
    assert sorted(r.ran for r in rapports) == [False, True]
    assert compteur == [1]
    # Le verrou est rendu : un passage suivant s'exécute.
    assert asyncio.run(run_daily_pass([JobStep("lente", lambda: 1)])).ran is True


def test_une_etape_en_echec_n_arrete_pas_les_suivantes(client):
    def casse():
        raise RuntimeError("boum")

    rapport = asyncio.run(run_daily_pass([JobStep("a", casse), JobStep("b", lambda: 2)]))
    assert rapport.failed == ["a"]
    assert rapport.results == {"b": 2}


def test_second_passage_du_jour_ne_cree_rien_et_les_mails_partent_une_fois(
    instance, plan_factory, mails
):
    (machine,), plan = plan_factory()
    premier = asyncio.run(run_daily_pass())
    assert premier.ran and premier.failed == []
    ((occ_id, di_id),) = _occurrences(instance, plan)
    assert di_id in mails
    nb_mails = len(mails)
    nb_notifs = instance.sql("SELECT count(*) FROM notification")[0][0]
    nb_audit = instance.sql("SELECT count(*) FROM audit_log")[0][0]

    second = asyncio.run(run_daily_pass())
    assert second.failed == []
    assert len(_occurrences(instance, plan)) == 1
    assert len(mails) == nb_mails
    assert instance.sql("SELECT count(*) FROM notification")[0][0] == nb_notifs
    assert instance.sql("SELECT count(*) FROM audit_log")[0][0] == nb_audit


# ── Notifications de retard ──────────────────────────────────────────────


def test_retard_notifie_a_j_plus_1_les_seuls_utilisateurs_actifs(instance, plan_factory, make_user):
    (machine,), plan = plan_factory()
    echeance = date.today() - timedelta(days=1)
    occ = _occurrence_en_retard(instance, plan, machine, echeance)
    inactif = make_user("TECH")
    instance.sql("UPDATE tunnel_user SET is_active = false WHERE id = %s", (inactif.id,))
    try:
        res = run_system_step(lambda: steps.notify_preventive_overdue())
    finally:
        instance.sql("UPDATE tunnel_user SET is_active = true WHERE id = %s", (inactif.id,))

    lignes = _notifs(instance, occ)
    assert res["notified"] >= len(lignes) > 0
    assert inactif.id not in {x[0] for x in lignes}
    assert {x[1] for x in lignes} == {(echeance + timedelta(days=1)).isoformat()}
    _, _, message, data = lignes[0]
    assert "1 jour" in message
    assert data["days_overdue"] == 1
    assert data["due_date"] == echeance.isoformat()
    assert data["intervention_id"] is None and data["di_id"] is None
    assert data["machine_code"] in message and data["plan_label"] in message


def test_pas_de_doublon_relance_a_j_plus_8_puis_rien_apres_cloture(instance, plan_factory):
    (machine,), plan = plan_factory()
    echeance = date.today() - timedelta(days=2)
    occ = _occurrence_en_retard(instance, plan, machine, echeance)
    actifs = _actifs(instance)

    def passage(jour):
        return run_system_step(lambda: steps.notify_preventive_overdue(echeance + timedelta(jour)))

    passage(1)
    assert len(_notifs(instance, occ)) == actifs
    passage(1)  # second passage le même jour
    passage(7)  # palier J+1 encore valable : déjà émis
    assert len(_notifs(instance, occ)) == actifs
    passage(8)  # relance
    lignes = _notifs(instance, occ)
    assert len(lignes) == 2 * actifs
    assert {x[1] for x in lignes} == {
        (echeance + timedelta(days=1)).isoformat(),
        (echeance + timedelta(days=8)).isoformat(),
    }
    passage(8)
    assert len(_notifs(instance, occ)) == 2 * actifs

    instance.sql("UPDATE preventive_occurrence SET status = 'completed' WHERE id = %s", (occ,))
    passage(15)
    passage(40)
    assert len(_notifs(instance, occ)) == 2 * actifs


def test_occurrence_en_retard_de_30_jours_sort_au_premier_passage(instance, plan_factory):
    (machine,), plan = plan_factory()
    echeance = date.today() - timedelta(days=30)
    occ = _occurrence_en_retard(instance, plan, machine, echeance, status="pending")
    actifs = _actifs(instance)

    # Premier passage à J+30 : le dernier palier atteint (J+29) est émis, même tombé hier :
    # tout le stock en retard sort à l'activation (amendement de l'ADR 0023).
    run_system_step(lambda: steps.notify_preventive_overdue())
    lignes = _notifs(instance, occ)
    assert {x[1] for x in lignes} == {(echeance + timedelta(days=29)).isoformat()}
    assert len(lignes) == actifs

    # Le palier J+36 tombe 6 jours après l'envoi : la relance attend un intervalle entier
    # depuis l'envoi (J+30), donc J+37, et porte le palier J+36. Cas vu en dev le
    # 2026-11-19 : le stock rattrapé revenait dès le lendemain.
    for jour in (31, 35, 36):
        run_system_step(lambda j=jour: steps.notify_preventive_overdue(echeance + timedelta(j)))
    assert len(_notifs(instance, occ)) == actifs
    run_system_step(lambda: steps.notify_preventive_overdue(echeance + timedelta(37)))
    lignes = _notifs(instance, occ)
    assert {x[1] for x in lignes} == {
        (echeance + timedelta(days=29)).isoformat(),
        (echeance + timedelta(days=36)).isoformat(),
    }
    assert len(lignes) == 2 * actifs


def test_notification_porte_intervention_et_demande(instance, plan_factory):
    _, plan = plan_factory(auto_accept=True)
    run_system_step(steps.generate_preventive)
    ((occ, di),) = _occurrences(instance, plan)
    intervention = instance.sql(
        "SELECT intervention_id::text FROM preventive_occurrence WHERE id = %s", (occ,)
    )[0][0]
    instance.sql(
        "UPDATE preventive_occurrence SET scheduled_date = %s WHERE id = %s",
        (date.today() - timedelta(days=1), occ),
    )
    run_system_step(lambda: steps.notify_preventive_overdue())
    data = _notifs(instance, occ)[0][3]
    assert data["intervention_id"] == intervention
    assert data["di_id"] == di


# ── Alarme « sans action » (PREV-05) ─────────────────────────────────────


@pytest.fixture
def intervention_ouverte(instance):
    """Intervention ouverte signalée il y a 60 jours (dernière activité = ce signalement)."""
    code_machine = f"SA-{time.time_ns() % 10**8}"
    machine = instance.sql(
        "INSERT INTO machine (code, name) VALUES (%s, 'Presse SA') RETURNING id", (code_machine,)
    )[0][0]
    inter = str(
        instance.sql(
            "INSERT INTO intervention (title, machine_id, type_inter, tech_initials, "
            "reported_date) VALUES ('Sans action', %s, 'CUR', 'IT', %s) RETURNING id",
            (machine, date.today() - timedelta(days=60)),
        )[0][0]
    )
    return inter, code_machine, date.today() - timedelta(days=60)


def _notifs_sans_action(instance, inter):
    return instance.sql(
        "SELECT data->>'milestone', message, data FROM notification "
        "WHERE type = 'intervention_a_cloturer' AND entity_type = 'intervention' "
        "AND entity_id = %s",
        (inter,),
    )


def _passage_sans_action(jour):
    return run_system_step(lambda: steps.notify_idle_interventions(jour))


def test_sans_action_rien_a_j6_alarme_a_j7_relance_a_j14_sans_doublon(
    instance, intervention_ouverte
):
    inter, code_machine, debut = intervention_ouverte
    actifs = _actifs(instance)

    _passage_sans_action(debut + timedelta(6))
    assert _notifs_sans_action(instance, inter) == []

    _passage_sans_action(debut + timedelta(7))
    _passage_sans_action(debut + timedelta(7))  # second passage : pas de doublon
    lignes = _notifs_sans_action(instance, inter)
    assert len(lignes) == actifs
    _, message, data = lignes[0]
    assert message.startswith("Sans action depuis 7 jours : on en est où ?")
    assert code_machine in message and data["machine_code"] == code_machine
    assert data["intervention_code"] in message
    assert data["days_without_action"] == 7
    assert data["last_activity_date"] == debut.isoformat()

    _passage_sans_action(debut + timedelta(13))
    assert len(_notifs_sans_action(instance, inter)) == actifs
    _passage_sans_action(debut + timedelta(14))
    lignes = _notifs_sans_action(instance, inter)
    assert len(lignes) == 2 * actifs
    assert {x[0] for x in lignes} == {
        (debut + timedelta(7)).isoformat(),
        (debut + timedelta(14)).isoformat(),
    }


def test_sans_action_une_nouvelle_action_remet_le_compte_a_zero(instance, intervention_ouverte):
    inter, _, debut = intervention_ouverte
    action = debut + timedelta(10)
    instance.sql(
        "INSERT INTO intervention_action (intervention_id, created_at, time_spent) "
        "VALUES (%s, %s, 0.5)",
        (inter, f"{action.isoformat()} 12:00:00+00"),
    )
    # Le palier J+7 / J+14 du signalement ne sort plus ; le prochain est action + 7.
    _passage_sans_action(debut + timedelta(14))
    _passage_sans_action(debut + timedelta(16))
    assert _notifs_sans_action(instance, inter) == []
    _passage_sans_action(action + timedelta(7))
    lignes = _notifs_sans_action(instance, inter)
    assert {x[0] for x in lignes} == {(action + timedelta(7)).isoformat()}
    assert lignes[0][2]["last_activity_date"] == action.isoformat()


def test_sans_action_attente_comprise_fermeture_exclue(instance, intervention_ouverte):
    inter, _, debut = intervention_ouverte
    instance.sql("UPDATE intervention SET status_actual = 'attente_pieces' WHERE id = %s", (inter,))
    _passage_sans_action(debut + timedelta(7))
    assert len(_notifs_sans_action(instance, inter)) == _actifs(instance)

    instance.sql("UPDATE intervention SET status_actual = 'ferme' WHERE id = %s", (inter,))
    _passage_sans_action(debut + timedelta(14))
    _passage_sans_action(debut + timedelta(21))
    assert len(_notifs_sans_action(instance, inter)) == _actifs(instance)


def test_sans_action_stock_sort_au_premier_passage(instance):
    machine = instance.sql(
        "INSERT INTO machine (code, name) VALUES (%s, 'Presse stock') RETURNING id",
        (f"ST-{time.time_ns() % 10**8}",),
    )[0][0]
    debut = date.today() - timedelta(days=30)
    inter = str(
        instance.sql(
            "INSERT INTO intervention (title, machine_id, type_inter, tech_initials, "
            "reported_date) VALUES ('Stock', %s, 'CUR', 'IT', %s) RETURNING id",
            (machine, debut),
        )[0][0]
    )
    # Premier passage à J+30 : le dernier palier (J+28), tombé il y a 2 jours, est émis.
    _passage_sans_action(debut + timedelta(30))
    lignes = _notifs_sans_action(instance, inter)
    assert {x[0] for x in lignes} == {(debut + timedelta(28)).isoformat()}
    assert len(lignes) == _actifs(instance)
    # Le palier J+35 tombe 5 jours après l'envoi : la relance attend un intervalle entier
    # depuis l'envoi (J+30), donc J+37, et porte le palier J+35.
    for jour in (34, 35, 36):
        _passage_sans_action(debut + timedelta(jour))
    assert len(_notifs_sans_action(instance, inter)) == _actifs(instance)
    _passage_sans_action(debut + timedelta(37))
    lignes = _notifs_sans_action(instance, inter)
    assert {x[0] for x in lignes} == {
        (debut + timedelta(28)).isoformat(),
        (debut + timedelta(35)).isoformat(),
    }
    assert len(lignes) == 2 * _actifs(instance)


def test_boucle_quotidienne_contient_l_etape_sans_action_apres_les_retards():
    noms = [s.name for s in scheduler.default_steps()]
    assert noms.index("sans_action") == noms.index("retards") + 1
