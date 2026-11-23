"""Rouvrir une intervention exige un motif et rouvre la demande liée (ADR 0028, REO-02)."""

import pytest

from tests.integration.etape2_helpers import intervention_liee, lignes_audit

# Ces tests portent sur la clôture, pas sur le constat (ADR 0043) : CUR n'en exige pas ici.
pytestmark = [pytest.mark.integration, pytest.mark.usefixtures("cur_sans_constat")]


def _put(client, admin, intervention_id, status, **extra):
    return client.put(
        f"/interventions/{intervention_id}",
        headers=admin.headers,
        json={"status_actual": status, **extra},
    )


def _fermee(client, admin, instance):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    assert _put(client, admin, intervention_id, "ferme").status_code == 200
    return intervention_id, request_id


def _statuts(instance, intervention_id, request_id):
    inter = instance.sql("SELECT status_actual FROM intervention WHERE id = %s", (intervention_id,))
    dem = instance.sql("SELECT statut FROM intervention_request WHERE id = %s", (request_id,))
    return inter[0][0], dem[0][0]


def test_rouvrir_sans_motif_explicite_est_refuse(client, admin, instance):
    intervention_id, request_id = _fermee(client, admin, instance)
    resp = _put(client, admin, intervention_id, "ouvert")
    assert resp.status_code == 400, resp.text
    motifs = {r["code"] for r in resp.json()["audit"]["reasons"]}
    assert {"INTERVENTION_CLOSED_BY_MISTAKE", "INTERVENTION_REWORK", "OTHER"} <= motifs
    reponse = instance.sql(
        "SELECT code FROM audit_reason_code WHERE 'intervention_reopened' = ANY(decision_types)"
    )
    assert motifs <= {r[0] for r in reponse}
    assert _statuts(instance, intervention_id, request_id) == ("ferme", "cloturee")


def test_rouvrir_avec_motif_rouvre_la_demande_et_trace(client, admin, instance):
    intervention_id, request_id = _fermee(client, admin, instance)
    resp = _put(client, admin, intervention_id, "ouvert", reason_code="INTERVENTION_REWORK")
    assert resp.status_code == 200, resp.text
    assert _statuts(instance, intervention_id, request_id) == ("ouvert", "acceptee")
    lignes = lignes_audit(instance, intervention_id)
    assert any(code == "INTERVENTION_REWORK" for _, _, code, _, _ in lignes)
    systeme = [
        ligne
        for ligne in lignes_audit(instance, request_id)
        if ligne[2] == "SYSTEM_CASCADE" and ligne[3] and ligne[1] == "status_transitioned"
    ]
    assert systeme and systeme[-1][4] == admin.id


def test_reclore_apres_reouverture_recloture_la_demande(client, admin, instance):
    intervention_id, request_id = _fermee(client, admin, instance)
    _put(client, admin, intervention_id, "ouvert", reason_code="INTERVENTION_REWORK")
    avant = len(lignes_audit(instance, request_id))
    assert _put(client, admin, intervention_id, "ferme").status_code == 200
    assert _statuts(instance, intervention_id, request_id) == ("ferme", "cloturee")
    assert len(lignes_audit(instance, request_id)) > avant


def test_other_exige_un_texte_et_un_motif_d_ailleurs_est_refuse(client, admin, instance):
    intervention_id, request_id = _fermee(client, admin, instance)
    sans_texte = _put(client, admin, intervention_id, "ouvert", reason_code="OTHER")
    assert sans_texte.status_code == 400, sans_texte.text
    ailleurs = instance.sql(
        "SELECT code FROM audit_reason_code WHERE category IN ('manual','user') "
        "AND is_active AND 'intervention' = ANY(entity_types) "
        "AND NOT ('intervention_reopened' = ANY(COALESCE(decision_types, '{}'))) LIMIT 1"
    )
    assert ailleurs, "aucun motif d'une autre décision pour le test"
    autre = _put(client, admin, intervention_id, "ouvert", reason_code=ailleurs[0][0])
    assert autre.status_code == 400, autre.text
    assert _statuts(instance, intervention_id, request_id) == ("ferme", "cloturee")
    avec_texte = _put(
        client, admin, intervention_id, "ouvert", reason_code="OTHER", reason_text="Test"
    )
    assert avec_texte.status_code == 200, avec_texte.text


def test_le_journal_refuse_la_sortie_de_ferme(client, admin, instance):
    intervention_id, request_id = _fermee(client, admin, instance)
    resp = client.post(
        "/intervention-status-log",
        headers=admin.headers,
        json={
            "intervention_id": intervention_id,
            "status_from": "ferme",
            "status_to": "ouvert",
            "technician_id": admin.id,
            "date": "2026-11-20T10:00:00",
        },
    )
    assert resp.status_code == 400, resp.text
    assert _statuts(instance, intervention_id, request_id) == ("ferme", "cloturee")


def test_un_changement_de_statut_hors_ferme_reste_routinier(client, admin, instance):
    intervention_id, _ = intervention_liee(client, admin, instance)
    assert _put(client, admin, intervention_id, "attente_pieces").status_code == 200
    # un PUT sans status_actual sur une intervention fermée n'est pas une réouverture
    fermee, _ = _fermee(client, admin, instance)
    resp = client.put(f"/interventions/{fermee}", headers=admin.headers, json={"title": "Titre"})
    assert resp.status_code == 200, resp.text


@pytest.mark.parametrize("role", ["ACHETEUR"])
def test_rouvrir_refuse_a_un_role_sans_droit_d_ecriture(client, admin, instance, make_user, role):
    intervention_id, request_id = _fermee(client, admin, instance)
    resp = client.put(
        f"/interventions/{intervention_id}",
        headers=make_user(role).headers,
        json={"status_actual": "ouvert", "reason_code": "INTERVENTION_REWORK"},
    )
    assert resp.status_code == 403, resp.text
    assert _statuts(instance, intervention_id, request_id) == ("ferme", "cloturee")
