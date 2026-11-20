"""Motifs de suppression (migration 0009, AUDC-30) : présents après bootstrap, OTHER
applicable à toutes les entités et à la décision deleted."""

import pytest

pytestmark = pytest.mark.integration


@pytest.mark.parametrize(
    "code, label",
    [("DELETE_CREATED_BY_MISTAKE", "Créé par erreur"), ("DELETE_DUPLICATE", "Doublon")],
)
def test_motifs_de_suppression_existent(instance, code, label):
    ligne = instance.sql(
        "SELECT label, category, entity_types, decision_types, is_active "
        "FROM audit_reason_code WHERE code = %s",
        (code,),
    )
    assert ligne == [(label, "user", None, ["deleted"], True)]


def test_other_couvre_toutes_entites_et_deleted(instance):
    ligne = instance.sql(
        "SELECT entity_types, decision_types FROM audit_reason_code WHERE code = 'OTHER'"
    )
    assert ligne == [
        (
            None,
            ["task_done", "task_skipped", "deleted", "occurrence_skipped", "intervention_reopened"],
        )
    ]
    # Une entité hors de l'ancienne liste (action) est désormais couverte.
    proposes = instance.sql(
        "SELECT code FROM audit_reason_code WHERE is_active "
        "AND ('action' = ANY(entity_types) OR entity_types IS NULL) AND code = 'OTHER'"
    )
    assert proposes == [("OTHER",)]


def test_la_liste_des_motifs_expose_decision_types(client, admin):
    """La fenêtre de motif filtre les suppressions sur decision_types : la réponse doit le
    porter (il était lu en base puis retiré par le schéma de réponse)."""
    resp = client.get(
        "/audit/reasons", params={"entity_type": "intervention"}, headers=admin.headers
    )
    assert resp.status_code == 200, resp.text
    motifs = {m["code"]: m for m in resp.json()}
    assert motifs["DELETE_CREATED_BY_MISTAKE"]["decision_types"] == ["deleted"]
    assert "deleted" in motifs["OTHER"]["decision_types"]


def test_le_400_d_une_suppression_sans_motif_porte_les_motifs_de_suppression(
    client, admin, instance
):
    """La fenêtre de motif du web prend la liste jointe au 400 et la filtre sur `deleted` :
    chaque motif doit y porter ses decision_types (vide à l'écran avant le correctif)."""
    from tests.integration.etape2_helpers import demande, machine

    request_id = demande(client, admin, machine(instance))
    resp = client.request("DELETE", f"/intervention-requests/{request_id}", headers=admin.headers)
    assert resp.status_code == 400, resp.text
    motifs = {m["code"]: m for m in resp.json()["audit"]["reasons"]}
    assert motifs["DELETE_CREATED_BY_MISTAKE"]["decision_types"] == ["deleted"]
    assert "deleted" in motifs["OTHER"]["decision_types"]
