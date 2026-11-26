"""Constat après intervention : réserves de la revue (CST-05, ADR 0043)."""

import pytest

from tests.integration.test_cst02_constat_integration import (
    CHOIX_PRE,
    CHOIX_PRO,
    _constat,
    _corriger,
    _data,
    _idee,
    _intervention,
)

pytestmark = pytest.mark.integration


def _constat_de_tech(client, admin, make_user):
    tech = make_user("TECH")
    intervention_id, machine_id = _intervention(client, admin)
    return tech, _data(_constat(client, tech, intervention_id, CHOIX_PRO)), machine_id


def _rattacher(client, account, constat_id, idee_id):
    return client.post(
        f"/constats/{constat_id}/link", json={"request_id": idee_id}, headers=account.headers
    )


def test_correction_d_une_version_remplacee_est_refusee_en_409(client, admin, make_user, instance):
    tech, constat, _ = _constat_de_tech(client, admin, make_user)
    assert _corriger(client, tech, constat["id"], CHOIX_PRE).status_code == 201
    lignes_avant = instance.sql(
        "SELECT count(*) FROM audit_log WHERE entity_id = %s", (constat["id"],)
    )[0][0]
    r = _corriger(client, tech, constat["id"], CHOIX_PRO)
    assert r.status_code == 409, r.text
    # Le refus n'écrit rien et ne crée pas de troisième version
    assert (
        instance.sql("SELECT count(*) FROM audit_log WHERE entity_id = %s", (constat["id"],))[0][0]
        == lignes_avant
    )
    assert (
        instance.sql(
            "SELECT count(*) FROM constat WHERE request_id = %s", (constat["request_id"],)
        )[0][0]
        == 2
    )


def test_correction_sans_motif_est_refusee_avec_les_motifs_proposes(client, admin, make_user):
    tech, constat, _ = _constat_de_tech(client, admin, make_user)
    r = _corriger(client, tech, constat["id"], CHOIX_PRE, reason_code=None)
    assert r.status_code == 400
    assert [m["code"] for m in r.json()["audit"]["reasons"]] == ["CONSTAT_CORRECTION"]


def test_correction_avec_un_motif_invalide_est_refusee(client, admin, make_user, instance):
    tech, constat, _ = _constat_de_tech(client, admin, make_user)
    # Inconnu, puis existant mais d'une autre décision
    for motif in ("MOTIF_QUI_N_EXISTE_PAS", "ROUTINE"):
        r = _corriger(client, tech, constat["id"], CHOIX_PRE, reason_code=motif)
        assert r.status_code == 400, f"{motif} : {r.text}"
    assert (
        instance.sql(
            "SELECT count(*) FROM constat WHERE request_id = %s", (constat["request_id"],)
        )[0][0]
        == 1
    )


def test_rattachement_d_un_constat_deja_rattache_est_refuse(client, admin, make_user, instance):
    resp = make_user("RESP")
    _, constat, machine_id = _constat_de_tech(client, admin, make_user)
    premiere = _idee(client, admin, machine_id)
    seconde = _idee(client, admin, machine_id)
    assert _rattacher(client, resp, constat["id"], premiere).status_code == 200
    r = _rattacher(client, resp, constat["id"], seconde)
    assert r.status_code == 400, r.text
    # Le lien d'origine est conservé
    lie = instance.sql(
        "SELECT linked_request_id::text FROM constat WHERE id = %s", (constat["id"],)
    )
    assert lie[0][0] == premiere


def test_rattachement_ecrit_une_seule_decision_de_rejet(client, admin, make_user, instance):
    resp = make_user("RESP")
    _, constat, machine_id = _constat_de_tech(client, admin, make_user)
    idee = _idee(client, admin, machine_id)
    assert _rattacher(client, resp, constat["id"], idee).status_code == 200
    lignes = instance.sql(
        "SELECT decision_type, new_value->>'statut' FROM audit_log "
        "WHERE entity_id = %s AND decision_type <> 'created'",
        (constat["request_id"],),
    )
    assert [tuple(x) for x in lignes] == [("statut_changed", "rejetee")], lignes
