"""Suivi de la demande d'un constat et suppression refusée (CSV-01, ADR 0043)."""

import pytest

from tests.integration.test_cst02_constat_integration import (
    CHOIX_PRO,
    _constat,
    _data,
    _idee,
    _intervention,
)

pytestmark = pytest.mark.integration


def _constat_cree(client, admin, make_user):
    tech = make_user("TECH")
    intervention_id, machine_id = _intervention(client, admin)
    return _data(_constat(client, tech, intervention_id, CHOIX_PRO)), intervention_id, machine_id


def _lire(client, account, constat):
    r = client.get(f"/constats/by-request/{constat['request_id']}", headers=account.headers)
    assert r.status_code == 200, r.text
    return _data(r)


def _rejeter(client, admin, request_id, **corps):
    return client.post(
        f"/intervention-requests/{request_id}/transition",
        headers=admin.headers,
        json={"status_to": "rejetee", **corps},
    )


def _supprimer_demande(client, admin, request_id):
    return client.request(
        "DELETE",
        f"/intervention-requests/{request_id}",
        headers=admin.headers,
        json={"reason_code": "ROUTINE"},
    )


def _code(instance, table, row_id):
    return instance.sql(f"SELECT code FROM {table} WHERE id = %s", (row_id,))[0][0]  # noqa: S608


def _compte(instance, table, row_id):
    return instance.sql(f"SELECT count(*) FROM {table} WHERE id = %s", (row_id,))[0][0]  # noqa: S608


def _motif_audite(instance, request_id):
    """Motif d'audit du dernier événement de la demande (création ou changement de statut)."""
    rows = instance.sql(
        """
        SELECT arc.label FROM audit_log al
        LEFT JOIN audit_reason_code arc ON arc.id = al.reason_code_id
        WHERE al.entity_type = 'request' AND al.entity_id = %s
          AND al.decision_type IN ('created', 'statut_changed')
        ORDER BY al.logged_at DESC, al.decision_type = 'statut_changed' DESC LIMIT 1
        """,
        (request_id,),
    )
    return rows[0][0]


def test_demande_en_attente_expose_son_etat(client, admin, make_user, instance):
    constat, intervention_id, _ = _constat_cree(client, admin, make_user)
    lu = _lire(client, admin, constat)
    assert lu["request_status"] == "nouvelle"
    assert lu["request_status_label"] and lu["request_status_color"]
    assert lu["request_intervention_id"] is None and lu["request_intervention_code"] is None
    assert lu["request_status_reason"] == _motif_audite(instance, constat["request_id"])
    assert lu["source_intervention_code"] == _code(instance, "intervention", intervention_id)
    assert all(a["question_label"] for a in lu["answers"])
    liste = client.get(f"/interventions/{intervention_id}/constats", headers=admin.headers)
    assert liste.json()[0]["request_status_label"] == lu["request_status_label"]


def test_rejet_expose_le_motif_et_son_texte(client, admin, make_user, instance):
    constat, _, _ = _constat_cree(client, admin, make_user)
    r = _rejeter(
        client, admin, constat["request_id"], reason_code="REJECT_ALREADY_HANDLED", reason_text="Vu"
    )
    assert r.status_code == 200, r.text
    lu = _lire(client, admin, constat)
    assert lu["request_status"] == "rejetee"
    assert lu["request_status_reason"] == "Déjà traité"
    assert lu["request_status_comment"] == "Vu"
    nom = instance.sql(
        "SELECT concat_ws(' ', first_name, last_name) FROM tunnel_user WHERE id = %s", (admin.id,)
    )[0][0]
    assert lu["request_status_by"] == (nom or None)
    assert lu["request_status_at"]


def test_rattachement_expose_le_motif_de_doublon(client, admin, make_user):
    resp = make_user("RESP")
    constat, _, machine_id = _constat_cree(client, admin, make_user)
    idee = _idee(client, admin, machine_id)
    r = client.post(
        f"/constats/{constat['id']}/link", json={"request_id": idee}, headers=resp.headers
    )
    assert r.status_code == 200, r.text
    lu = _lire(client, admin, constat)
    assert lu["linked_request_id"] == idee
    assert lu["request_status_reason"].startswith("Doublon")


def test_acceptation_expose_l_intervention_creee(client, admin, make_user, instance):
    constat, _, machine_id = _constat_cree(client, admin, make_user)
    r = client.post(
        "/interventions",
        json={
            "machine_id": machine_id,
            "type_inter": "PRO",
            "tech_id": admin.id,
            "title": "Suite constat",
            "priority": "normal",
            "request_id": constat["request_id"],
        },
        headers=admin.headers,
    )
    assert r.status_code in (200, 201), r.text
    nouvelle = _data(r)["id"]
    lu = _lire(client, admin, constat)
    assert lu["request_status"] == "acceptee"
    assert lu["request_intervention_id"] == nouvelle
    assert lu["request_intervention_code"] == _code(instance, "intervention", nouvelle)
    assert lu["request_status_reason"] == _motif_audite(instance, constat["request_id"])


def test_demande_d_un_constat_ne_se_supprime_pas(client, admin, make_user, instance):
    constat, _, _ = _constat_cree(client, admin, make_user)
    r = _supprimer_demande(client, admin, constat["request_id"])
    assert r.status_code == 400, r.text
    assert "constat" in r.text
    assert _compte(instance, "intervention_request", constat["request_id"]) == 1


def test_idee_rattachee_ne_se_supprime_pas(client, admin, make_user, instance):
    resp = make_user("RESP")
    constat, _, machine_id = _constat_cree(client, admin, make_user)
    idee = _idee(client, admin, machine_id)
    client.post(f"/constats/{constat['id']}/link", json={"request_id": idee}, headers=resp.headers)
    r = _supprimer_demande(client, admin, idee)
    assert r.status_code == 400, r.text
    assert _compte(instance, "intervention_request", idee) == 1


def test_intervention_avec_constats_ne_se_supprime_pas(client, admin, make_user, instance):
    constat, intervention_id, _ = _constat_cree(client, admin, make_user)
    r = client.request(
        "DELETE",
        f"/interventions/{intervention_id}",
        headers=admin.headers,
        json={"reason_code": "ROUTINE"},
        params={"request_outcome": "reopen"},
    )
    assert r.status_code == 400, r.text
    assert _compte(instance, "intervention", intervention_id) == 1
    assert _compte(instance, "constat", constat["id"]) == 1
