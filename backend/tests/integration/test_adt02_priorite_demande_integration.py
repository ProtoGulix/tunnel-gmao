"""Urgence d'une demande sur vraie base (ADT-02, ADR 0047)."""

import secrets

import pytest

from api.limiter import limiter
from tests.integration.test_cst02_constat_integration import _data

pytestmark = pytest.mark.integration


@pytest.fixture(autouse=True)
def _sans_limiteur(monkeypatch):
    monkeypatch.setattr(limiter, "enabled", False)


@pytest.fixture(scope="module")
def site(client, admin):
    r = client.post(
        "/equipements", json={"name": f"Eq urgence {secrets.token_hex(3)}"}, headers=admin.headers
    )
    assert r.status_code in (200, 201), r.text
    return _data(r)["id"]


def _creer(client, admin, site, **extra):
    r = client.post(
        "/intervention-requests",
        json={"machine_id": site, "demandeur_nom": "Atelier", "description": "Panne", **extra},
        headers=admin.headers,
    )
    return r


def _id(r):
    assert r.status_code == 201, r.text
    return _data(r)["id"]


def _patch(client, who, demande, priorite):
    return client.patch(
        f"/intervention-requests/{demande}/priority",
        json={"priorite": priorite},
        headers=who.headers,
    )


def test_creation_avec_et_sans_urgence(client, admin, site):
    avec = _data(_creer(client, admin, site, priorite="urgent"))
    sans = _data(_creer(client, admin, site))
    assert avec["priorite"] == "urgent"
    assert sans["priorite"] is None
    detail = client.get(f"/intervention-requests/{avec['id']}", headers=admin.headers)
    assert _data(detail)["priorite"] == "urgent"


def test_creation_urgence_hors_liste_refusee_en_400(client, admin, site):
    r = _creer(client, admin, site, priorite="critique")
    assert r.status_code == 400, r.text
    assert "faible" in r.text


def test_demande_systeme_sans_urgence_reste_inchangee(client, admin, site):
    cree = _data(_creer(client, admin, site, is_system=True))
    assert cree["is_system"] is True
    assert cree["priorite"] is None


def test_changement_d_urgence_par_resp_et_admin_trace_l_auteur(
    client, admin, make_user, instance, site
):
    resp = make_user("RESP")
    demande = _id(_creer(client, admin, site))
    r = _patch(client, resp, demande, "important")
    assert r.status_code == 200, r.text
    assert _data(r)["priorite"] == "important"
    r = _patch(client, admin, demande, "faible")
    assert r.status_code == 200, r.text
    assert _data(r)["priorite"] == "faible"
    auteurs = instance.sql(
        "SELECT DISTINCT changed_by::text FROM audit_log "
        "WHERE entity_type = 'request' AND entity_id = %s AND changed_by IS NOT NULL",
        (demande,),
    )
    assert (resp.id,) in auteurs


@pytest.mark.parametrize("role", ["TECH", "ACHETEUR"])
def test_changement_d_urgence_refuse_aux_autres_roles(client, admin, make_user, site, role):
    demande = _id(_creer(client, admin, site))
    r = _patch(client, make_user(role), demande, "urgent")
    assert r.status_code == 403, r.text
    detail = client.get(f"/intervention-requests/{demande}", headers=admin.headers)
    assert _data(detail)["priorite"] is None


def test_changement_d_urgence_refuse_a_une_cle_mcp(client, admin, make_user, site):
    demande = _id(_creer(client, admin, site))
    cle = client.post(
        "/api-keys", headers=admin.headers, json={"name": f"it-{secrets.token_hex(3)}"}
    )
    secret = cle.json()["secret"]
    r = client.patch(
        f"/intervention-requests/{demande}/priority",
        json={"priorite": "urgent"},
        headers={"X-API-Key": secret},
    )
    assert r.status_code == 403, r.text


def test_valeur_hors_liste_refusee_en_400(client, admin, site):
    demande = _id(_creer(client, admin, site))
    r = _patch(client, admin, demande, "critique")
    assert r.status_code == 400, r.text


@pytest.mark.parametrize("statut", ["acceptee", "rejetee", "cloturee"])
def test_demande_fermee_refusee_en_400(client, admin, instance, site, statut):
    demande = _id(_creer(client, admin, site))
    instance.sql("UPDATE intervention_request SET statut = %s WHERE id = %s", (statut, demande))
    r = _patch(client, admin, demande, "urgent")
    assert r.status_code == 400, r.text


def test_demande_inconnue_en_404(client, admin):
    r = _patch(client, admin, "00000000-0000-0000-0000-000000000000", "urgent")
    assert r.status_code == 404, r.text


def test_tri_par_urgence_puis_anciennete(client, admin, instance):
    racine = client.post(
        "/equipements", json={"name": f"Eq tri {secrets.token_hex(3)}"}, headers=admin.headers
    )
    machine = _data(racine)["id"]
    ids = {}
    for nom, prio in (("sans", None), ("faible", "faible"), ("urgent_recent", "urgent")):
        ids[nom] = _id(_creer(client, admin, machine, priorite=prio))
    ids["urgent_ancien"] = _id(_creer(client, admin, machine, priorite="urgent"))
    instance.sql(
        "UPDATE intervention_request SET created_at = created_at - interval '2 days' WHERE id = %s",
        (ids["urgent_ancien"],),
    )
    r = client.get(
        "/intervention-requests",
        params={"machine_id": machine, "sort": "urgence"},
        headers=admin.headers,
    )
    assert r.status_code == 200, r.text
    ordre = [d["id"] for d in r.json()["items"]]
    assert ordre == [
        ids["urgent_ancien"],
        ids["urgent_recent"],
        ids["faible"],
        ids["sans"],
    ]
    r = client.get("/intervention-requests", params={"sort": "n_importe"}, headers=admin.headers)
    assert r.status_code == 422
