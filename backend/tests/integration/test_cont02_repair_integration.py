"""Réparation des demandes orphelines (POST /intervention-requests/repair), CONT-02.

Chaque demande acceptée dont l'intervention est fermée passe à « cloturee » avec un événement
du système (is_system, motif SYSTEM_CASCADE) dont l'auteur est le jeton de l'appelant.
"""

import pytest

from tests.integration.etape2_helpers import MOTIF, intervention_liee, lignes_audit

pytestmark = pytest.mark.integration


def _orpheline(client, admin, instance) -> str:
    """Demande « acceptee » dont l'intervention est fermée (cascade non déclenchée)."""
    intervention_id, request_id = intervention_liee(client, admin, instance)
    instance.sql(
        "UPDATE intervention SET status_actual = 'ferme' WHERE id = %s", (intervention_id,)
    )
    instance.sql("UPDATE intervention_request SET statut = 'acceptee' WHERE id = %s", (request_id,))
    return request_id


def test_repair_ecrit_un_evenement_systeme_par_demande_reparee_au_nom_du_jeton(
    instance, client, admin
):
    reparee = _orpheline(client, admin, instance)
    avant = lignes_audit(instance, reparee)

    resp = client.post("/intervention-requests/repair", headers=admin.headers)

    assert resp.status_code == 200, resp.text
    ids = [d["id"] for d in resp.json().get("data", resp.json())["details"]]
    assert reparee in ids
    assert instance.sql("SELECT statut FROM intervention_request WHERE id = %s", (reparee,)) == [
        ("cloturee",)
    ]
    nouvelles = lignes_audit(instance, reparee)[len(avant) :]
    assert nouvelles == [("request", "status_transitioned", "SYSTEM_CASCADE", True, admin.id)], (
        nouvelles
    )


def test_repair_est_idempotent_et_n_ecrit_rien_sans_demande_orpheline(instance, client, admin):
    reparee = _orpheline(client, admin, instance)
    client.post("/intervention-requests/repair", headers=admin.headers)
    avant = instance.sql("SELECT count(*) FROM audit_log")[0][0]

    resp = client.post(
        "/intervention-requests/repair", headers=admin.headers, json={"reason_code": MOTIF}
    )

    assert resp.status_code == 200, resp.text
    assert instance.sql("SELECT count(*) FROM audit_log")[0][0] == avant
    assert reparee not in [d["id"] for d in resp.json().get("data", resp.json())["details"]]
