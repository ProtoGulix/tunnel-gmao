"""Archivage à l'unité avec vrais middlewares et vraie base (FICHE-02)."""

import pytest

from tests.integration.etape2_helpers import intervention_liee

# Ces tests portent sur la clôture, pas sur le constat (ADR 0043) : CUR n'en exige pas ici.
pytestmark = [pytest.mark.integration, pytest.mark.usefixtures("cur_sans_constat")]


def _fermer(client, admin, intervention_id):
    resp = client.put(
        f"/interventions/{intervention_id}",
        headers=admin.headers,
        json={"status_actual": "ferme", "reason_code": "ROUTINE"},
    )
    assert resp.status_code == 200, resp.text


def _marquer(client, headers, intervention_id):
    return client.post(f"/interventions/{intervention_id}/mark-printed", headers=headers)


def test_archivage_unitaire_regle_droits_audit_et_idempotence(client, admin, make_user, instance):
    ouverte, _ = intervention_liee(client, admin, instance)
    fermee, _ = intervention_liee(client, admin, instance)
    _fermer(client, admin, fermee)

    for role in ("TECH", "ACHETEUR"):
        assert _marquer(client, make_user(role).headers, fermee).status_code == 403, role
    assert _marquer(client, admin.headers, ouverte).status_code == 400
    inconnue = "00000000-0000-0000-0000-000000000000"
    assert _marquer(client, admin.headers, inconnue).status_code == 404

    r = _marquer(client, make_user("RESP").headers, fermee)
    assert r.status_code == 200, r.text
    assert r.json()["data"] == {"marked": 1}
    assert _marquer(client, admin.headers, fermee).json()["data"] == {"marked": 0}

    etats = dict(
        instance.sql(
            "SELECT id::text, printed_fiche FROM intervention WHERE id = ANY(%s::uuid[])",
            ([ouverte, fermee],),
        )
    )
    assert etats[fermee] is True and not etats[ouverte]
    lignes = instance.sql(
        "SELECT changed_by::text, old_value, new_value FROM audit_log "
        "WHERE entity_type = 'intervention' AND decision_type = 'printed_fiche_changed' "
        "AND entity_id = %s",
        (fermee,),
    )
    assert len(lignes) == 1
    assert lignes[0][1] == {"printed_fiche": False} and lignes[0][2] == {"printed_fiche": True}


def test_printed_fiche_refuse_au_put_et_a_la_creation(client, admin, instance):
    intervention_id, _ = intervention_liee(client, admin, instance)
    resp = client.put(
        f"/interventions/{intervention_id}", headers=admin.headers, json={"printed_fiche": True}
    )
    assert resp.status_code == 400, resp.text
    etat = instance.sql("SELECT printed_fiche FROM intervention WHERE id = %s", (intervention_id,))
    assert etat[0][0] in (False, None)


def test_marquage_refuse_une_intervention_ouverte_dans_la_requete(client, admin, instance):
    """Garde du repo, commune à l'unité et à la masse : le statut est relu sous verrou."""
    from api.exports.repo import ExportRepository

    ouverte, _ = intervention_liee(client, admin, instance)
    assert ExportRepository().mark_interventions_printed([ouverte]) == 0
    etat = instance.sql("SELECT printed_fiche FROM intervention WHERE id = %s", (ouverte,))
    assert etat[0][0] in (False, None)
