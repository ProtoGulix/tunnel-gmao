"""Accueil direction (ACD-01) : filtre `idle` des interventions et `constat_id` des demandes."""

import itertools
from datetime import date, timedelta

import pytest

from api.settings import settings
from tests.integration.etape2_helpers import demande, machine

pytestmark = pytest.mark.integration

_COMPTEUR = itertools.count()


def _intervention(instance, machine_id, reported: date, statut="ouvert") -> str:
    # Le code d'intervention est unique (machine, type, date, initiales) : initiales distinctes.
    initiales = f"T{next(_COMPTEUR)}"
    intervention_id = instance.sql(
        "INSERT INTO intervention (title, machine_id, type_inter, tech_initials, "
        "reported_date) VALUES ('Essai ACD', %s, 'CUR', %s, %s) RETURNING id::text",
        (machine_id, initiales, reported),
    )[0][0]
    if statut != "ouvert":  # le statut posé à l'insertion est ramené à « ouvert »
        instance.sql(
            "UPDATE intervention SET status_actual = %s WHERE id = %s", (statut, intervention_id)
        )
    return intervention_id


def _action(instance, intervention_id, days_ago: int) -> None:
    instance.sql(
        "INSERT INTO intervention_action (intervention_id, description, time_spent, created_at) "
        "VALUES (%s, 'Essai', 0.5, now() - make_interval(days => %s))",
        (intervention_id, days_ago),
    )


def _liste(client, admin, machine_id, **params):
    resp = client.get(
        "/interventions",
        headers=admin.headers,
        params={"equipement_id": machine_id, "include_printed": True, **params},
    )
    assert resp.status_code == 200, resp.text
    return {row["id"]: row for row in resp.json()["items"]}


def test_idle_reprend_la_definition_du_job(instance, client, admin):
    seuil = settings.REMINDER_INTERVAL_DAYS
    machine_id = machine(instance)
    today = date.today()
    recente = _intervention(instance, machine_id, today - timedelta(days=seuil + 20))
    _action(instance, recente, 0)
    signalee_hier = _intervention(instance, machine_id, today - timedelta(days=1))
    ancienne_action = _intervention(instance, machine_id, today - timedelta(days=seuil + 20))
    _action(instance, ancienne_action, seuil + 3)
    sans_action = _intervention(instance, machine_id, today - timedelta(days=seuil + 5))
    fermee = _intervention(instance, machine_id, today - timedelta(days=seuil + 30), "ferme")

    idle = _liste(client, admin, machine_id, idle=True)
    assert set(idle) == {ancienne_action, sans_action}
    assert idle[ancienne_action]["days_without_action"] == seuil + 3
    assert idle[sans_action]["days_without_action"] == seuil + 5
    assert idle[sans_action]["last_activity_date"] == str(today - timedelta(days=seuil + 5))

    # Même ensemble que le job de relance (hors fermées, seuil atteint).
    from api.jobs.repo import JobsRepository

    du_job = {
        str(r["id"])
        for r in JobsRepository().list_open_interventions_activity()
        if r["id"] and (today - r["last_activity"]).days >= seuil
    }
    assert {ancienne_action, sans_action} <= du_job
    assert not ({recente, signalee_hier, fermee} & du_job)

    tout = _liste(client, admin, machine_id)
    assert set(tout) == {recente, signalee_hier, ancienne_action, sans_action, fermee}
    assert tout[recente]["days_without_action"] == 0
    assert tout[fermee]["days_without_action"] is None
    assert tout[fermee]["last_activity_date"] is None


def test_idle_total_coherent_avec_la_liste(instance, client, admin):
    seuil = settings.REMINDER_INTERVAL_DAYS
    machine_id = machine(instance)
    _intervention(instance, machine_id, date.today() - timedelta(days=seuil + 2))
    _intervention(instance, machine_id, date.today())
    resp = client.get(
        "/interventions",
        headers=admin.headers,
        params={"equipement_id": machine_id, "include_printed": True, "idle": True},
    )
    assert resp.json()["pagination"]["total"] == 1


def _constat(instance, request_id, machine_id, intervention_id, supersedes=None) -> str:
    user = instance.sql("SELECT id::text FROM tunnel_user LIMIT 1")[0][0]
    return instance.sql(
        "INSERT INTO constat (intervention_id, machine_id, created_by, request_id, "
        "supersedes_id) VALUES (%s, %s, %s, %s, %s) RETURNING id::text",
        (intervention_id, machine_id, user, request_id, supersedes),
    )[0][0]


def test_demandes_portent_constat_id(instance, client, admin):
    machine_id = machine(instance)
    avec = demande(client, admin, machine_id)
    sans = demande(client, admin, machine_id)
    intervention_id = _intervention(instance, machine_id, date.today())
    premier = _constat(instance, avec, machine_id, intervention_id)
    # Constat corrigé citant la même demande : le plus récent est renvoyé, une seule ligne.
    courant = _constat(instance, avec, machine_id, intervention_id, supersedes=premier)

    resp = client.get(
        "/intervention-requests", headers=admin.headers, params={"machine_id": machine_id}
    )
    assert resp.status_code == 200, resp.text
    lignes = {row["id"]: row for row in resp.json()["items"]}
    assert set(lignes) == {avec, sans}
    assert lignes[avec]["constat_id"] == courant
    assert lignes[sans]["constat_id"] is None
