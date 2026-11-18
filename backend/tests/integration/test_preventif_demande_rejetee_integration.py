"""Demande préventive rejetée (PREV-08) : occurrence ignorée, échéance conservée, régénération."""

import secrets
from datetime import date, timedelta

import pytest

from tests.integration.etape2_helpers import lignes_audit
from tests.integration.test_preventif_echeancier_integration import (
    _classe_et_machine,
    _demande,
    _lignes,
    _occurrence,
    _plan,
)
from tests.integration.test_preventif_generation_glissante_integration import (
    _cloturee_il_y_a,
    _generer,
    _occurrences,
)

pytestmark = pytest.mark.integration

PERIODE = 30


@pytest.fixture
def plan_periodique(instance):
    classe, machine = _classe_et_machine(instance)
    plan = _plan(instance, classe, jours=PERIODE)
    yield machine, plan
    instance.sql("UPDATE preventive_plan SET active = false WHERE id = %s", (plan,))


def _rejeter(client, admin, di):
    return client.post(
        f"/intervention-requests/{di}/transition",
        headers=admin.headers,
        json={"status_to": "rejetee", "reason_code": "OTHER", "reason_text": "Pas nécessaire"},
    )


def _generee_apres_une_cloture_ancienne(instance, client, admin, machine, plan):
    """Une clôture il y a 29 jours (échéance dans 1 jour) puis la génération : DI + occurrence."""
    _cloturee_il_y_a(instance, plan, machine, PERIODE - 1)
    _generer(client, admin)
    (occ,) = [o for o in _occurrences(instance, plan, machine) if o[1] == "generated"]
    return occ


def test_rejet_ignore_l_occurrence_avec_audit_systeme(instance, client, admin, plan_periodique):
    machine, plan = plan_periodique
    sched, _, di = _generee_apres_une_cloture_ancienne(instance, client, admin, machine, plan)
    assert _rejeter(client, admin, di).status_code == 200
    ((occ_id, statut, raison, di_apres),) = instance.sql(
        "SELECT id::text, status, skip_reason, di_id FROM preventive_occurrence "
        "WHERE plan_id = %s AND scheduled_date = %s",
        (plan, sched),
    )
    assert (statut, raison, di_apres) == ("skipped", "Demande rejetée", di)
    lignes = [lg for lg in lignes_audit(instance, occ_id) if lg[1] != "created"]
    assert sorted(lg[1] for lg in lignes) == ["skip_reason_changed", "status_changed"]
    assert {(lg[0], lg[2], lg[3]) for lg in lignes} == {
        ("preventive_occurrence", "SYSTEM_CASCADE", True)
    }
    # Le rejet garde son propre motif.
    motifs = {x[2] for x in lignes_audit(instance, str(di)) if x[1] == "statut_changed"}
    assert motifs == {"OTHER"}


def test_echeancier_en_retard_apres_rejet(instance, client, admin, plan_periodique):
    machine, plan = plan_periodique
    # Clôture il y a 40 jours : échéance dépassée de 10 jours, occurrence générée puis rejetée.
    _cloturee_il_y_a(instance, plan, machine, 40)
    _generer(client, admin)
    (occ,) = [o for o in _occurrences(instance, plan, machine) if o[1] == "generated"]
    assert _rejeter(client, admin, occ[2]).status_code == 200
    (ligne,) = _lignes(client, admin, machine)
    assert ligne["state"] == "overdue"
    assert ligne["days_overdue"] == 10


def test_generation_suivante_cree_une_nouvelle_occurrence_et_demande(
    instance, client, admin, plan_periodique
):
    machine, plan = plan_periodique
    sched, _, di = _generee_apres_une_cloture_ancienne(instance, client, admin, machine, plan)
    assert _rejeter(client, admin, di).status_code == 200
    _generer(client, admin)
    actives = [o for o in _occurrences(instance, plan, machine) if o[1] == "generated"]
    assert len(actives) == 1
    # L'échéance (demain) est déjà prise par l'occurrence ignorée : la nouvelle est du jour.
    assert actives[0][0] == date.today()
    assert actives[0][2] != di
    assert sched == date.today() + timedelta(days=1)


def test_echeance_libre_est_conservee(instance, client, admin, plan_periodique):
    machine, plan = plan_periodique
    # Occurrence ignorée sur une date sans rapport avec l'échéance (clôture + 30 jours).
    _cloturee_il_y_a(instance, plan, machine, PERIODE - 1)
    di = _demande(instance, machine)
    instance.sql("UPDATE intervention_request SET statut = 'nouvelle' WHERE id = %s", (di,))
    _occurrence(instance, plan, machine, date.today() - timedelta(days=3), "generated", di)
    assert _rejeter(client, admin, di).status_code == 200
    _generer(client, admin)
    actives = [o for o in _occurrences(instance, plan, machine) if o[1] == "generated"]
    assert [o[0] for o in actives] == [date.today() + timedelta(days=1)]


def test_skipped_ordinaire_reste_une_reference(instance, client, admin, plan_periodique):
    machine, plan = plan_periodique
    sched = date.today() - timedelta(days=5)
    _occurrence(instance, plan, machine, sched, "skipped")
    (ligne,) = _lignes(client, admin, machine)
    assert ligne["reference_date"] == sched.isoformat()
    _generer(client, admin)
    assert len(_occurrences(instance, plan, machine)) == 1


def test_rejet_d_une_demande_non_preventive_inchange(instance, client, admin):
    _, machine = _classe_et_machine(instance)
    di = instance.sql(
        "INSERT INTO intervention_request (code, machine_id, demandeur_nom, description, statut) "
        "VALUES (%s, %s, 'Test', 'DI corrective', 'nouvelle') RETURNING id",
        (f"DI-PV8-{secrets.token_hex(3)}", machine),
    )[0][0]
    assert _rejeter(client, admin, di).status_code == 200
    assert instance.sql("SELECT statut FROM intervention_request WHERE id = %s", (di,)) == [
        ("rejetee",)
    ]


def test_rejet_sans_occurrence_active_ne_touche_rien(instance, client, admin, plan_periodique):
    machine, plan = plan_periodique
    di = _demande(instance, machine)
    instance.sql("UPDATE intervention_request SET statut = 'nouvelle' WHERE id = %s", (di,))
    # Occurrence déjà terminée liée à la demande : elle ne doit pas être modifiée.
    occ = _occurrence(instance, plan, machine, date.today() - timedelta(days=60), "completed", di)
    assert _rejeter(client, admin, di).status_code == 200
    assert instance.sql(
        "SELECT status, skip_reason FROM preventive_occurrence WHERE id = %s", (occ,)
    ) == [("completed", None)]
    assert lignes_audit(instance, str(occ)) == []


# ── Machines hors service exclues ────────────────────────────────────────


def _statut(instance, machine, code):
    instance.sql(
        "UPDATE machine SET statut_id = (SELECT id FROM equipement_statuts WHERE code = %s) "
        "WHERE id = %s",
        (code, machine),
    )


@pytest.mark.parametrize("code", ["ARRET", "REBUT"])
def test_machine_hors_service_exclue(instance, client, admin, plan_periodique, code):
    from api.jobs.repo import JobsRepository

    machine, plan = plan_periodique
    _statut(instance, machine, code)
    assert _lignes(client, admin, machine) == []
    _generer(client, admin)
    assert _occurrences(instance, plan, machine) == []
    # Une occurrence existante en retard ne donne pas de notification de retard.
    occ = _occurrence(instance, plan, machine, date.today() - timedelta(days=3), "generated")
    assert str(occ) not in {
        str(o["id"]) for o in JobsRepository().list_overdue_occurrences(date.today())
    }


def test_machine_en_service_inchangee(instance, client, admin, plan_periodique):
    from api.jobs.repo import JobsRepository

    machine, plan = plan_periodique
    _statut(instance, machine, "EN_SERVICE")
    assert len(_lignes(client, admin, machine)) == 1
    occ = _occurrence(instance, plan, machine, date.today() - timedelta(days=3), "generated")
    assert str(occ) in {
        str(o["id"]) for o in JobsRepository().list_overdue_occurrences(date.today())
    }
