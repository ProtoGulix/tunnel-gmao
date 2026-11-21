"""Échéancier du préventif (PREV-01) sur vraie base : requête, filtres, droits."""

import secrets
from datetime import date, timedelta

import pytest

pytestmark = pytest.mark.integration

URL = "/preventive-occurrences/schedule"


def _classe_et_machine(instance):
    classe = instance.sql(
        "INSERT INTO equipement_class (code, label) VALUES (%s, 'Classe PREV-01') RETURNING id",
        (f"PV1-{secrets.token_hex(3)}",),
    )[0][0]
    machine = instance.sql(
        "INSERT INTO machine (code, name, equipement_class_id) VALUES (%s, 'Presse PV1', %s) "
        "RETURNING id",
        (f"PV1-M-{secrets.token_hex(3)}", classe),
    )[0][0]
    return classe, machine


def _plan(instance, classe, trigger="periodicity", jours=30):
    return instance.sql(
        "INSERT INTO preventive_plan (code, label, equipement_class_id, trigger_type, "
        "periodicity_days, hours_threshold) VALUES (%s, 'Plan PV1', %s, %s, %s, %s) RETURNING id",
        (
            f"PL-{secrets.token_hex(3)}",
            classe,
            trigger,
            jours if trigger == "periodicity" else None,
            100 if trigger == "hours" else None,
        ),
    )[0][0]


def _demande(instance, machine, cloturee_le=None):
    di = instance.sql(
        "INSERT INTO intervention_request (code, machine_id, demandeur_nom, description, statut) "
        "VALUES (%s, %s, 'Systeme', 'DI PV1', 'acceptee') RETURNING id",
        (f"DI-PV1-{secrets.token_hex(3)}", machine),
    )[0][0]
    if cloturee_le:
        # Les triggers écrivent eux-mêmes la ligne de clôture (à l'instant présent) : on la date.
        instance.sql("UPDATE intervention_request SET statut = 'cloturee' WHERE id = %s", (di,))
        instance.sql(
            "UPDATE request_status_log SET date = %s WHERE request_id = %s "
            "AND status_to = 'cloturee'",
            (cloturee_le, di),
        )
    return di


def _occurrence(instance, plan, machine, sched, status, di=None):
    return instance.sql(
        "INSERT INTO preventive_occurrence "
        "(plan_id, machine_id, scheduled_date, status, di_id, skip_reason) "
        "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
        # La production refuse une occurrence ignorée sans motif (CONT-01).
        (plan, machine, sched, status, di, "Motif de test" if status == "skipped" else None),
    )[0][0]


def _lignes(client, admin, machine, **params):
    resp = client.get(URL, headers=admin.headers, params={"machine_id": str(machine), **params})
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_reference_date_de_cloture_de_la_demande(instance, client, admin):
    classe, machine = _classe_et_machine(instance)
    plan = _plan(instance, classe, jours=30)
    cloture = date.today() - timedelta(days=10)
    di = _demande(instance, machine, f"{cloture} 14:00+00")
    # scheduled_date très antérieure : la référence doit être la clôture, pas elle.
    _occurrence(instance, plan, machine, date.today() - timedelta(days=90), "completed", di)
    (ligne,) = _lignes(client, admin, machine)
    assert ligne["reference_date"] == cloture.isoformat()
    assert ligne["due_date"] == (cloture + timedelta(days=30)).isoformat()
    assert ligne["state"] == "ok"


def test_repli_sur_scheduled_date_sans_ligne_de_cloture(instance, client, admin):
    classe, machine = _classe_et_machine(instance)
    plan = _plan(instance, classe, jours=30)
    sched = date.today() - timedelta(days=40)
    _occurrence(instance, plan, machine, sched, "completed", _demande(instance, machine))
    (ligne,) = _lignes(client, admin, machine)
    assert ligne["reference_date"] == sched.isoformat()
    assert ligne["state"] == "overdue"
    assert ligne["days_overdue"] == 10


def test_occurrence_active_l_emporte(instance, client, admin):
    classe, machine = _classe_et_machine(instance)
    plan = _plan(instance, classe, jours=30)
    _occurrence(instance, plan, machine, date.today() - timedelta(days=60), "completed")
    sched = date.today() + timedelta(days=3)
    occ = _occurrence(instance, plan, machine, sched, "generated")
    (ligne,) = _lignes(client, admin, machine)
    assert ligne["due_date"] == sched.isoformat()
    assert ligne["state"] == "due_soon"
    assert ligne["occurrence_id"] == str(occ)


def test_sans_historique_et_plan_heures(instance, client, admin):
    classe, machine = _classe_et_machine(instance)
    _plan(instance, classe, jours=30)
    _plan(instance, classe, trigger="hours")
    lignes = _lignes(client, admin, machine)
    assert [x["state"] for x in lignes] == ["due_soon", "not_computed"]
    assert lignes[0]["due_date"] == date.today().isoformat()
    assert lignes[1]["due_date"] is None


def test_filtre_state_et_valeur_invalide(instance, client, admin):
    classe, machine = _classe_et_machine(instance)
    _plan(instance, classe)
    _plan(instance, classe, trigger="hours")
    assert [x["state"] for x in _lignes(client, admin, machine, state="not_computed")] == [
        "not_computed"
    ]
    assert client.get(URL, headers=admin.headers, params={"state": "nimporte"}).status_code == 400


def test_plan_inactif_exclu(instance, client, admin):
    classe, machine = _classe_et_machine(instance)
    plan = _plan(instance, classe)
    instance.sql("UPDATE preventive_plan SET active = false WHERE id = %s", (plan,))
    assert _lignes(client, admin, machine) == []


@pytest.mark.parametrize("role", ["RESP", "TECH", "ACHETEUR"])
def test_lecture_ouverte_aux_roles_qui_lisent(client, make_user, role):
    compte = make_user(role)
    assert client.get(URL, headers=compte.headers).status_code == 200


def test_sans_jeton_refuse(client):
    assert client.get(URL).status_code == 401
