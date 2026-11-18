"""Génération glissante et anticipée du préventif (PREV-02) sur vraie base.

Référence = date de clôture de la demande ; l'occurrence est créée dès que l'échéance
tombe dans la prévenance (7 jours), avec scheduled_date = échéance.
"""

from datetime import date, timedelta

import pytest

from tests.integration.test_preventif_echeancier_integration import (
    _classe_et_machine,
    _demande,
    _occurrence,
    _plan,
)

pytestmark = pytest.mark.integration

LEAD = 7
PERIODE = 30


@pytest.fixture
def plan_periodique(instance):
    """Classe, machine et plan de 30 jours ; le plan est désactivé à la fin."""
    classe, machine = _classe_et_machine(instance)
    plan = _plan(instance, classe, jours=PERIODE)
    yield machine, plan
    instance.sql("UPDATE preventive_plan SET active = false WHERE id = %s", (plan,))


def _generer(client, admin):
    resp = client.post("/preventive-occurrences/generate", headers=admin.headers)
    assert resp.status_code == 200, resp.text
    return resp.json()["data"]


def _occurrences(instance, plan, machine):
    return instance.sql(
        "SELECT scheduled_date, status, di_id FROM preventive_occurrence "
        "WHERE plan_id = %s AND machine_id = %s ORDER BY scheduled_date",
        (plan, machine),
    )


def _cloturee_il_y_a(instance, plan, machine, jours_depuis_cloture, sched_jours=None):
    """Occurrence completed dont la demande a été clôturée il y a N jours."""
    cloture = date.today() - timedelta(days=jours_depuis_cloture)
    di = _demande(instance, machine, f"{cloture} 14:00+00")
    sched = date.today() - timedelta(days=sched_jours if sched_jours else 200)
    _occurrence(instance, plan, machine, sched, "completed", di)


def test_rien_cree_a_j_moins_8(instance, client, admin, plan_periodique):
    machine, plan = plan_periodique
    # Clôture il y a 22 jours : échéance dans 8 jours, hors prévenance.
    _cloturee_il_y_a(instance, plan, machine, PERIODE - LEAD - 1)
    _generer(client, admin)
    assert len(_occurrences(instance, plan, machine)) == 1


def test_cree_a_j_moins_7_avec_echeance_future(instance, client, admin, plan_periodique):
    machine, plan = plan_periodique
    _cloturee_il_y_a(instance, plan, machine, PERIODE - LEAD)
    data = _generer(client, admin)
    assert data["generated"] >= 1
    nouvelles = [o for o in _occurrences(instance, plan, machine) if o[1] == "generated"]
    assert [o[0] for o in nouvelles] == [date.today() + timedelta(days=LEAD)]
    # La demande système porte l'échéance dans sa date limite.
    (deadline,) = instance.sql(
        "SELECT deadline FROM intervention_request WHERE id = %s", (nouvelles[0][2],)
    )[0]
    assert deadline == date.today() + timedelta(days=LEAD)


def test_reference_cloture_et_non_scheduled_date(instance, client, admin, plan_periodique):
    machine, plan = plan_periodique
    # Planifiée il y a 40 jours (échéance fixe dépassée) mais clôturée hier : la clôture
    # tardive décale l'échéance à dans 29 jours, rien ne doit être créé.
    _cloturee_il_y_a(instance, plan, machine, 1, sched_jours=40)
    _generer(client, admin)
    assert len(_occurrences(instance, plan, machine)) == 1


def test_occurrence_active_toujours_respectee(instance, client, admin, plan_periodique):
    machine, plan = plan_periodique
    _occurrence(instance, plan, machine, date.today() - timedelta(days=5), "in_progress")
    data = _generer(client, admin)
    assert data["skipped_active"] >= 1
    assert len(_occurrences(instance, plan, machine)) == 1


def test_second_appel_le_meme_jour_ne_cree_rien(instance, client, admin, plan_periodique):
    machine, plan = plan_periodique
    _cloturee_il_y_a(instance, plan, machine, PERIODE - 3)
    _generer(client, admin)
    apres_premier = _occurrences(instance, plan, machine)
    _generer(client, admin)
    assert _occurrences(instance, plan, machine) == apres_premier
    assert len(apres_premier) == 2


def test_sans_historique_cree_aujourd_hui(instance, client, admin, plan_periodique):
    machine, plan = plan_periodique
    _generer(client, admin)
    assert [o[0] for o in _occurrences(instance, plan, machine)] == [date.today()]
