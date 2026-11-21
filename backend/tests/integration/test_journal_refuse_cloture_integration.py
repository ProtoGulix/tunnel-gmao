"""Le journal de statut refuse la clôture (ADR 0027, CLO-01)."""

import pytest

from tests.integration.etape2_helpers import intervention_liee

pytestmark = pytest.mark.integration


def _poster(client, admin, intervention_id, status_to):
    return client.post(
        "/intervention-status-log",
        headers=admin.headers,
        json={
            "intervention_id": intervention_id,
            "status_from": "ouvert",
            "status_to": status_to,
            "technician_id": admin.id,
            "date": "2026-11-20T10:00:00",
        },
    )


def _etat(instance, intervention_id):
    statut = instance.sql(
        "SELECT status_actual FROM intervention WHERE id = %s", (intervention_id,)
    )
    lignes = instance.sql(
        "SELECT count(*) FROM intervention_status_log WHERE intervention_id = %s",
        (intervention_id,),
    )
    return statut[0][0], lignes[0][0]


def test_le_journal_refuse_la_cloture_et_ne_change_rien(client, admin, instance):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    avant = _etat(instance, intervention_id)
    resp = _poster(client, admin, intervention_id, "ferme")
    assert resp.status_code == 400, resp.text
    assert "clôture" in resp.text
    assert _etat(instance, intervention_id) == avant
    assert avant[0] == "ouvert"
    demande = instance.sql("SELECT statut FROM intervention_request WHERE id = %s", (request_id,))
    assert demande[0][0] != "cloturee"


def test_le_journal_accepte_un_autre_statut(client, admin, instance):
    intervention_id, _ = intervention_liee(client, admin, instance)
    avant = _etat(instance, intervention_id)
    resp = _poster(client, admin, intervention_id, "attente_pieces")
    assert resp.status_code == 201, resp.text
    statut, lignes = _etat(instance, intervention_id)
    assert statut == "attente_pieces"
    assert lignes > avant[1]
