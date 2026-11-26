"""Rattachement d'un constat : lien et rejet dans une seule transaction (ADR 0018, 0043)."""

import pytest

from tests.integration.test_cst02_constat_integration import (
    CHOIX_PRO,
    _constat,
    _data,
    _idee,
    _intervention,
)

pytestmark = pytest.mark.integration


def test_echec_apres_le_rejet_annule_aussi_le_lien(client, admin, make_user, instance, monkeypatch):
    tech, resp = make_user("TECH"), make_user("RESP")
    intervention_id, machine_id = _intervention(client, admin)
    constat = _data(_constat(client, tech, intervention_id, CHOIX_PRO))
    idee = _idee(client, admin, machine_id)

    # Panne simulée après le rejet de la demande, dernière étape du rattachement
    def panne(*args, **kwargs):
        raise RuntimeError("panne simulée")

    monkeypatch.setattr("api.constats.repo.record_audit_event", panne)
    r = client.post(
        f"/constats/{constat['id']}/link", json={"request_id": idee}, headers=resp.headers
    )
    assert r.status_code == 500, r.text

    etat = instance.sql(
        "SELECT c.linked_request_id, ir.statut FROM constat c "
        "JOIN intervention_request ir ON ir.id = c.request_id WHERE c.id = %s",
        (constat["id"],),
    )
    assert [tuple(x) for x in etat] == [(None, "nouvelle")]
    journal = instance.sql(
        "SELECT count(*) FROM request_status_log WHERE request_id = %s AND status_to = 'rejetee'",
        (constat["request_id"],),
    )
    assert journal[0][0] == 0
