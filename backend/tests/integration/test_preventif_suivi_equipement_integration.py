"""Historique préventif d'une machine et lancement en avance (PREV-14) sur vraie base."""

import secrets
from datetime import date, timedelta
from uuid import uuid4

import pytest

from tests.integration.etape2_helpers import lignes_audit
from tests.integration.test_audc24_preventif_integration import _classe_machines_plan
from tests.integration.test_preventif_echeancier_integration import (
    _classe_et_machine,
    _demande,
    _occurrence,
    _plan,
)

pytestmark = pytest.mark.integration

HISTORY = "/preventive-occurrences/history"
ANTICIPATE = "/preventive-occurrences/anticipate"


@pytest.fixture
def couple(instance):
    """Une machine et un plan de 30 jours avec une étape de gamme ; plan désactivé à la fin."""
    (machine,), plan = _classe_machines_plan(instance, 1, auto_accept=False)
    yield machine, plan
    instance.sql("UPDATE preventive_plan SET active = false WHERE id = %s", (plan,))


def _lancer(client, admin, plan, machine):
    return client.post(
        ANTICIPATE, headers=admin.headers, json={"plan_id": str(plan), "machine_id": str(machine)}
    )


# --- Historique ----------------------------------------------------------------------


def test_historique_ordre_et_ecart_en_avance_en_retard_non_terminee(instance, client, admin):
    classe, machine = _classe_et_machine(instance)
    plan = _plan(instance, classe, jours=30)
    today = date.today()
    # En avance de 5 jours : échéance dans -20 j, clôturée il y a 25 jours.
    ech_avance = today - timedelta(days=20)
    di1 = _demande(instance, machine, f"{today - timedelta(days=25)} 10:00+00")
    o1 = _occurrence(instance, plan, machine, ech_avance, "completed", di1)
    # En retard de 4 jours.
    ech_retard = today - timedelta(days=60)
    di2 = _demande(instance, machine, f"{today - timedelta(days=56)} 10:00+00")
    o2 = _occurrence(instance, plan, machine, ech_retard, "completed", di2)
    # Non terminée, échéance la plus récente.
    o3 = _occurrence(instance, plan, machine, today + timedelta(days=5), "generated")

    resp = client.get(HISTORY, headers=admin.headers, params={"machine_id": str(machine)})

    assert resp.status_code == 200, resp.text
    items = resp.json()["items"]
    assert [i["occurrence_id"] for i in items] == [str(o3), str(o1), str(o2)]
    assert items[0]["done_on"] is None and items[0]["delta_days"] is None
    assert items[1]["done_on"] == (today - timedelta(days=25)).isoformat()
    assert items[1]["delta_days"] == -5
    assert items[2]["delta_days"] == 4
    assert items[0]["plan_id"] == str(plan) and items[0]["plan_code"].startswith("PL-")
    assert items[1]["di_id"] == str(di1)


def test_historique_machine_inconnue_404(client, admin):
    resp = client.get(HISTORY, headers=admin.headers, params={"machine_id": str(uuid4())})
    assert resp.status_code == 404


@pytest.mark.parametrize("role", ["RESP", "TECH", "ACHETEUR"])
def test_historique_lisible_par_les_roles_qui_lisent(instance, client, make_user, role):
    _classe, machine = _classe_et_machine(instance)
    compte = make_user(role)
    resp = client.get(HISTORY, headers=compte.headers, params={"machine_id": str(machine)})
    assert resp.status_code == 200


# --- Lancement en avance -------------------------------------------------------------


def test_lancement_en_avance_cree_occurrence_et_demande(instance, client, admin, couple):
    machine, plan = couple
    cloture = date.today() - timedelta(days=10)
    di = _demande(instance, machine, f"{cloture} 14:00+00")
    _occurrence(instance, plan, machine, date.today() - timedelta(days=90), "completed", di)

    resp = _lancer(client, admin, plan, machine)

    assert resp.status_code == 201, resp.text
    occ = resp.json()["data"]
    echeance = cloture + timedelta(days=30)
    assert occ["scheduled_date"] == echeance.isoformat()
    assert occ["status"] == "generated" and occ["di_id"] is not None
    assert occ["di_statut"] == "nouvelle" and len(occ["tasks"]) == 1
    # Même demande système que la génération : visible, d'origine système, échéance en deadline.
    assert instance.sql(
        "SELECT is_system, suggested_type_inter, deadline FROM intervention_request WHERE id = %s",
        (occ["di_id"],),
    ) == [(True, "PRE", echeance)]
    # La génération qui suit ne crée pas de doublon.
    assert client.post("/preventive-occurrences/generate", headers=admin.headers).status_code == 200
    assert instance.sql(
        "SELECT count(*) FROM preventive_occurrence WHERE plan_id = %s AND machine_id = %s "
        "AND status IN ('generated', 'in_progress')",
        (plan, machine),
    ) == [(1,)]


def test_sans_historique_ou_echeance_passee_date_du_jour(instance, client, admin, couple):
    machine, plan = couple
    occ = _lancer(client, admin, plan, machine).json()["data"]
    assert occ["scheduled_date"] == date.today().isoformat()


def test_apres_cloture_la_prochaine_echeance_part_de_la_cloture(instance, client, admin, couple):
    machine, plan = couple
    occ = _lancer(client, admin, plan, machine).json()["data"]
    instance.sql(
        "UPDATE preventive_occurrence SET status = 'completed' WHERE id = %s", (occ["id"],)
    )
    instance.sql(
        "UPDATE intervention_request SET statut = 'cloturee' WHERE id = %s", (occ["di_id"],)
    )

    resp = client.get(
        "/preventive-occurrences/schedule",
        headers=admin.headers,
        params={"machine_id": str(machine)},
    )

    (ligne,) = [x for x in resp.json() if x["plan_id"] == str(plan)]
    assert ligne["reference_date"] == date.today().isoformat()
    assert ligne["due_date"] == (date.today() + timedelta(days=30)).isoformat()
    assert ligne["state"] == "ok"


def test_audit_de_la_creation_comme_le_bouton_generer(instance, client, admin, couple):
    machine, plan = couple
    instance.sql("UPDATE preventive_plan SET auto_accept = true WHERE id = %s", (plan,))
    occ = _lancer(client, admin, plan, machine).json()["data"]
    intervention_id = occ["intervention_id"]
    assert intervention_id is not None
    for entite, entity_id in (
        ("preventive_occurrence", occ["id"]),
        ("request", occ["di_id"]),
        ("intervention", intervention_id),
    ):
        lignes = [lg for lg in lignes_audit(instance, entity_id) if lg[1] == "created"]
        assert lignes == [(entite, "created", "SYSTEM_CASCADE", True, admin.id)], (entite, lignes)


# --- Refus ---------------------------------------------------------------------------


def test_refus_409_occurrence_active_avec_son_id(instance, client, admin, couple):
    machine, plan = couple
    occ = _lancer(client, admin, plan, machine).json()["data"]
    resp = _lancer(client, admin, plan, machine)
    assert resp.status_code == 409
    assert occ["id"] in resp.json()["detail"]


def test_refus_422_plan_inactif_heures_machine_hors_service_ou_autre_classe(
    instance, client, admin, couple
):
    machine, plan = couple
    classe, autre_machine = _classe_et_machine(instance)
    plan_heures = _plan(
        instance,
        instance.sql("SELECT equipement_class_id FROM preventive_plan WHERE id = %s", (plan,))[0][
            0
        ],
        trigger="hours",
    )
    assert _lancer(client, admin, plan, autre_machine).status_code == 422
    assert _lancer(client, admin, plan_heures, machine).status_code == 422
    hors_service = instance.sql(
        "SELECT id FROM equipement_statuts WHERE code <> 'EN_SERVICE' LIMIT 1"
    )[0][0]
    instance.sql("UPDATE machine SET statut_id = %s WHERE id = %s", (hors_service, machine))
    assert _lancer(client, admin, plan, machine).status_code == 422
    instance.sql(
        "UPDATE machine SET statut_id = (SELECT id FROM equipement_statuts "
        "WHERE code = 'EN_SERVICE') WHERE id = %s",
        (machine,),
    )
    instance.sql("UPDATE preventive_plan SET active = false WHERE id = %s", (plan,))
    assert _lancer(client, admin, plan, machine).status_code == 422


def test_refus_404_plan_ou_machine_inconnu(client, admin, couple):
    machine, plan = couple
    assert _lancer(client, admin, uuid4(), machine).status_code == 404
    assert _lancer(client, admin, plan, uuid4()).status_code == 404


# --- Droits --------------------------------------------------------------------------


def test_lancement_ouvert_a_resp_ferme_a_tech_acheteur_et_mcp(
    instance, client, admin, make_user, couple
):
    machine, plan = couple
    for role in ("TECH", "ACHETEUR"):
        compte = make_user(role)
        assert _lancer(client, compte, plan, machine).status_code == 403, role
    cle = client.post(
        "/api-keys", headers=admin.headers, json={"name": f"PV14-{secrets.token_hex(3)}"}
    ).json()
    resp = client.post(
        ANTICIPATE,
        headers={"X-API-Key": cle["secret"]},
        json={"plan_id": str(plan), "machine_id": str(machine)},
    )
    assert resp.status_code == 403
    assert _lancer(client, make_user("RESP"), plan, machine).status_code == 201
