"""Rejeter une demande exige un motif de rejet choisi (REJ-02, ADR 0038)."""

import pytest

from tests.integration.etape2_helpers import demande, lignes_audit, machine

pytestmark = pytest.mark.integration

_MOTIFS_REJET = {
    "REJECT_OUT_OF_SCOPE",
    "REJECT_DUPLICATE",
    "REJECT_ALREADY_HANDLED",
    "REJECT_INCOMPLETE",
    "OTHER",
}


def _transition(client, admin, request_id, **corps):
    return client.post(
        f"/intervention-requests/{request_id}/transition", headers=admin.headers, json=corps
    )


def _statut(instance, request_id):
    return instance.sql("SELECT statut FROM intervention_request WHERE id = %s", (request_id,))[0][
        0
    ]


def test_rejet_sans_motif_refuse_avec_les_seuls_motifs_de_rejet(client, admin, instance):
    request_id = demande(client, admin, machine(instance))
    resp = _transition(client, admin, request_id, status_to="rejetee")
    assert resp.status_code == 400, resp.text
    assert resp.json()["audit"]["required"] is True
    assert {r["code"] for r in resp.json()["audit"]["reasons"]} == _MOTIFS_REJET
    assert _statut(instance, request_id) == "nouvelle"


def test_rejet_avec_motif_de_rejet_accepte_et_trace(client, admin, instance):
    request_id = demande(client, admin, machine(instance))
    resp = _transition(
        client, admin, request_id, status_to="rejetee", reason_code="REJECT_DUPLICATE"
    )
    assert resp.status_code == 200, resp.text
    assert _statut(instance, request_id) == "rejetee"
    codes = {x[2] for x in lignes_audit(instance, request_id) if x[1] == "statut_changed"}
    assert codes == {"REJECT_DUPLICATE"}


def test_rejet_avec_un_motif_hors_rejet_refuse(client, admin, instance):
    request_id = demande(client, admin, machine(instance))
    # Motif de la base jetable, applicable à une demande mais pas à un rejet.
    instance.sql(
        "INSERT INTO audit_reason_code (id, code, label, category, entity_types, decision_types, "
        "is_active) SELECT COALESCE(MAX(id), 0) + 1, 'TEST_HORS_REJET', 'Hors rejet', 'user', "
        "'{request}', '{updated}', true FROM audit_reason_code"
    )
    resp = _transition(
        client, admin, request_id, status_to="rejetee", reason_code="TEST_HORS_REJET"
    )
    assert resp.status_code == 400, resp.text
    assert _statut(instance, request_id) == "nouvelle"


def test_rejet_other_exige_un_texte(client, admin, instance):
    request_id = demande(client, admin, machine(instance))
    sans = _transition(client, admin, request_id, status_to="rejetee", reason_code="OTHER")
    assert sans.status_code == 400, sans.text
    avec = _transition(
        client, admin, request_id, status_to="rejetee", reason_code="OTHER", reason_text="Test"
    )
    assert avec.status_code == 200, avec.text


def test_mise_en_attente_reste_sans_motif(client, admin, instance):
    request_id = demande(client, admin, machine(instance))
    resp = _transition(client, admin, request_id, status_to="en_attente")
    assert resp.status_code == 200, resp.text


def test_acceptation_sans_motif_reste_acceptee(client, admin, instance):
    request_id = demande(client, admin, machine(instance))
    resp = _transition(
        client,
        admin,
        request_id,
        status_to="acceptee",
        type_inter="CUR",
        tech_id=admin.id,
        tech_initials="AD",
    )
    assert resp.status_code == 200, resp.text
    assert _statut(instance, request_id) == "acceptee"
