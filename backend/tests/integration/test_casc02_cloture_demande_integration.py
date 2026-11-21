"""La demande ne ferme plus son intervention ; transitions permises par l'API (CASC-02)."""

import pytest

from tests.integration.etape2_helpers import MOTIF, demande, intervention_liee, machine

pytestmark = pytest.mark.integration


def _transition(client, account, request_id, status_to):
    return client.post(
        f"/intervention-requests/{request_id}/transition",
        headers=account.headers,
        json={"status_to": status_to, "reason_code": MOTIF},
    )


def _detail(client, account, request_id):
    resp = client.get(f"/intervention-requests/{request_id}", headers=account.headers)
    assert resp.status_code == 200, resp.text
    return resp.json().get("data", resp.json())


def test_cloture_refusee_avec_intervention_ouverte_sans_ecriture(client, admin, instance):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    avant = instance.sql("SELECT * FROM intervention WHERE id = %s", (intervention_id,))
    resp = _transition(client, admin, request_id, "cloturee")
    assert resp.status_code == 400, resp.text
    assert "Clore l'intervention" in resp.text
    assert instance.sql("SELECT * FROM intervention WHERE id = %s", (intervention_id,)) == avant
    assert _detail(client, admin, request_id)["allowed_transitions"] == []


def test_cloture_acceptee_sans_intervention(client, admin, instance):
    request_id = demande(client, admin, machine(instance))
    instance.sql("UPDATE intervention_request SET statut = 'acceptee' WHERE id = %s", (request_id,))
    assert _detail(client, admin, request_id)["allowed_transitions"] == ["cloturee"]
    resp = _transition(client, admin, request_id, "cloturee")
    assert resp.status_code == 200, resp.text
    assert (resp.json().get("data") or resp.json())["allowed_transitions"] == []


def test_cloture_acceptee_avec_intervention_fermee(client, admin, instance):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    instance.sql(
        "UPDATE intervention SET status_actual = 'ferme' WHERE id = %s", (intervention_id,)
    )
    instance.sql("UPDATE intervention_request SET statut = 'acceptee' WHERE id = %s", (request_id,))
    assert _detail(client, admin, request_id)["allowed_transitions"] == ["cloturee"]
    resp = _transition(client, admin, request_id, "cloturee")
    assert resp.status_code == 200, resp.text
    statut = instance.sql("SELECT statut FROM intervention_request WHERE id = %s", (request_id,))
    assert statut[0][0] == "cloturee"


def test_allowed_transitions_dans_la_liste_et_pour_un_role_sans_droit(
    client, admin, instance, make_user, grant
):
    request_id = demande(client, admin, machine(instance))
    liste = client.get("/intervention-requests?limit=500", headers=admin.headers).json()
    item = next(i for i in liste["items"] if i["id"] == request_id)
    assert item["allowed_transitions"] == ["en_attente", "acceptee", "rejetee"]

    tech = make_user("TECH")
    grant("TECH", "POST", "/intervention-requests/{request_id}/transition", allowed=False)
    grant("TECH", "GET", "/intervention-requests/{request_id}", allowed=True)
    assert _detail(client, tech, request_id)["allowed_transitions"] == []
