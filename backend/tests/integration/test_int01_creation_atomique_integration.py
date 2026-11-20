"""Création atomique d'une intervention, de sa demande et de ses tâches (INT-01, ADR 0025).

Vrais middlewares, vraie base : une seule transaction, demande « directe » sans notification
ni mail, droits de la matrice contrôlés pour la demande et les tâches, trace d'audit avec
l'auteur du jeton.
"""

import uuid

import pytest

from tests.integration.etape2_helpers import MOTIF, demande, lignes_audit, machine

pytestmark = pytest.mark.integration


def _corps(machine_id, tech_id, **extra):
    return {
        "machine_id": machine_id,
        "type_inter": "CUR",
        "tech_id": tech_id,
        "title": "Fuite hydraulique",
        "request": {"demandeur_nom": "Atelier 2", "description": "Fuite sous la presse"},
        "reason_code": MOTIF,
        **extra,
    }


def _creer(client, account, corps):
    return client.post("/interventions", headers=account.headers, json=corps)


def _donnees(resp):
    return resp.json().get("data", resp.json())


def _compte(instance, table, machine_id=None, **colonnes):
    if table == "intervention_task":
        return instance.sql(
            "SELECT count(*) FROM intervention_task t WHERE t.label = %s", (colonnes["label"],)
        )[0][0]
    return instance.sql(f"SELECT count(*) FROM {table} WHERE machine_id = %s", (machine_id,))[0][0]


def test_demande_intervention_et_taches_ecrites_ensemble(client, admin, instance, make_user):
    make_user("TECH")  # destinataire possible d'une notification : la demande directe n'en émet pas
    machine_id = machine(instance)
    label = f"Tâche {uuid.uuid4()}"
    resp = _creer(
        client,
        admin,
        _corps(machine_id, admin.id, tasks=[{"label": label}, {"label": label, "sort_order": 1}]),
    )
    assert resp.status_code == 201, resp.text
    cree = _donnees(resp)
    assert cree["title"] == "Fuite hydraulique"
    assert len(cree["tasks"]) == 2
    assert cree["request"]["statut"] == "acceptee"

    origine, statut, intervention_id, par = instance.sql(
        "SELECT origine, statut, intervention_id::text, created_by::text FROM intervention_request "
        "WHERE machine_id = %s",
        (machine_id,),
    )[0]
    assert (origine, statut, intervention_id, par) == (
        "directe",
        "acceptee",
        cree["id"],
        str(admin.id),
    )
    journal = instance.sql(
        "SELECT status_from, status_to, changed_by::text FROM request_status_log "
        "WHERE request_id = %s",
        (cree["request"]["id"],),
    )
    assert ("nouvelle", "acceptee", str(admin.id)) in journal


def test_aucune_notification_ni_mail_pour_une_demande_directe(
    client, admin, instance, make_user, monkeypatch
):
    make_user("TECH")
    appels = []
    monkeypatch.setattr(
        "api.intervention_requests.routes.send_di_a_traiter_mails", lambda *a: appels.append(a)
    )
    machine_id = machine(instance)
    # Témoin : une demande signalée notifie bien le technicien (sinon le test serait creux).
    signalee = demande(client, admin, machine(instance))
    assert (
        instance.sql(
            "SELECT count(*) FROM notification WHERE type = 'di_a_traiter' AND entity_id = %s",
            (signalee,),
        )[0][0]
        > 0
    )

    resp = _creer(client, admin, _corps(machine_id, admin.id))
    assert resp.status_code == 201, resp.text
    request_id = _donnees(resp)["request"]["id"]
    assert (
        instance.sql(
            "SELECT count(*) FROM notification WHERE type = 'di_a_traiter' AND entity_id = %s",
            (request_id,),
        )[0][0]
        == 0
    )
    # Le témoin a déclenché son mail ; la demande directe, aucun.
    assert appels == [(signalee,)]


def test_une_tache_invalide_n_ecrit_rien(client, admin, instance, make_user):
    make_user("TECH")
    machine_id = machine(instance)
    label = f"Tâche {uuid.uuid4()}"
    resp = _creer(
        client,
        admin,
        _corps(
            machine_id,
            admin.id,
            # Technicien inexistant : refus de la base au milieu de la transaction.
            tasks=[{"label": label}, {"label": label, "assigned_to": str(uuid.uuid4())}],
        ),
    )
    assert resp.status_code >= 400
    assert "violates" not in resp.text and "foreign key" not in resp.text.lower()
    assert _compte(instance, "intervention_request", machine_id) == 0
    assert _compte(instance, "intervention", machine_id) == 0
    assert _compte(instance, "intervention_task", label=label) == 0
    assert (
        instance.sql(
            "SELECT count(*) FROM notification n JOIN intervention_request r ON r.id = n.entity_id "
            "WHERE r.machine_id = %s",
            (machine_id,),
        )[0][0]
        == 0
    )


def test_request_et_request_id_sont_exclusifs(client, admin, instance):
    machine_id = machine(instance)
    existante = demande(client, admin, machine_id)
    deux = _creer(client, admin, _corps(machine_id, admin.id, request_id=existante))
    aucun = _creer(client, admin, {**_corps(machine_id, admin.id), "request": None})
    assert deux.status_code == 422
    assert aucun.status_code == 422


def test_request_id_seul_garde_son_comportement(client, admin, instance):
    machine_id = machine(instance)
    existante = demande(client, admin, machine_id)
    corps = _corps(machine_id, admin.id, request_id=existante)
    corps.pop("request")
    resp = _creer(client, admin, corps)
    assert resp.status_code == 201, resp.text
    assert instance.sql(
        "SELECT statut, origine FROM intervention_request WHERE id = %s", (existante,)
    ) == [("acceptee", "signalee")]


def test_la_creation_est_tracee_avec_l_auteur_reel(client, admin, instance):
    machine_id = machine(instance)
    label = f"Tâche {uuid.uuid4()}"
    resp = _creer(client, admin, _corps(machine_id, admin.id, tasks=[{"label": label}]))
    assert resp.status_code == 201, resp.text
    cree = _donnees(resp)
    tache_id = cree["tasks"][0]["id"]
    for entity_id, entity_type in (
        (cree["id"], "intervention"),
        (cree["request"]["id"], "request"),
        (tache_id, "task"),
    ):
        lignes = lignes_audit(instance, entity_id)
        assert (entity_type, "created", MOTIF, False, str(admin.id)) in lignes, lignes
    # La demande est aussi tracée comme acceptée par la création de l'intervention.
    assert ("request", "statut_changed", MOTIF, False, str(admin.id)) in lignes_audit(
        instance, cree["request"]["id"]
    )


# ── Autorisation ────────────────────────────────────────────────────────────


@pytest.fixture
def tech_droits(make_user, grant):
    """TECH autorisé à créer des interventions, sans droit sur les demandes ni les tâches."""
    tech = make_user("TECH")
    grant("TECH", "POST", "/interventions")
    grant("TECH", "POST", "/intervention-requests", allowed=False)
    grant("TECH", "POST", "/intervention-tasks", allowed=False)
    return tech


def test_request_exige_le_droit_de_creer_une_demande(client, instance, tech_droits):
    machine_id = machine(instance)
    resp = _creer(client, tech_droits, _corps(machine_id, tech_droits.id))
    assert resp.status_code == 403
    assert _compte(instance, "intervention_request", machine_id) == 0
    assert _compte(instance, "intervention", machine_id) == 0


def test_tasks_exige_le_droit_de_creer_une_tache(client, admin, instance, tech_droits, grant):
    grant("TECH", "POST", "/intervention-requests")
    machine_id = machine(instance)
    label = f"Tâche {uuid.uuid4()}"
    resp = _creer(client, tech_droits, _corps(machine_id, tech_droits.id, tasks=[{"label": label}]))
    assert resp.status_code == 403
    assert _compte(instance, "intervention_request", machine_id) == 0
    assert _compte(instance, "intervention_task", label=label) == 0


def test_avec_les_trois_droits_la_creation_passe_et_l_auteur_est_le_jeton(
    client, instance, tech_droits, grant
):
    grant("TECH", "POST", "/intervention-requests")
    grant("TECH", "POST", "/intervention-tasks")
    machine_id = machine(instance)
    label = f"Tâche {uuid.uuid4()}"
    resp = _creer(client, tech_droits, _corps(machine_id, tech_droits.id, tasks=[{"label": label}]))
    assert resp.status_code == 201, resp.text
    cree = _donnees(resp)
    assert ("request", "created", MOTIF, False, str(tech_droits.id)) in lignes_audit(
        instance, cree["request"]["id"]
    )


# ── Acceptation : titre et technicien reçus conservés ───────────────────────


def test_l_acceptation_garde_le_titre_et_le_technicien_recus(client, admin, instance):
    machine_id = machine(instance)
    request_id = demande(client, admin, machine_id)
    resp = client.post(
        f"/intervention-requests/{request_id}/transition",
        headers=admin.headers,
        json={
            "status_to": "acceptee",
            "type_inter": "CUR",
            "title": "Titre choisi à l'acceptation",
            "tech_id": admin.id,
            "reason_code": MOTIF,
        },
    )
    assert resp.status_code == 200, resp.text
    titre, tech_id = instance.sql(
        "SELECT i.title, i.tech_id::text FROM intervention i "
        "JOIN intervention_request r ON r.intervention_id = i.id WHERE r.id = %s",
        (request_id,),
    )[0]
    assert (titre, tech_id) == ("Titre choisi à l'acceptation", str(admin.id))
