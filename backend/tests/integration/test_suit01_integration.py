"""SUIT-01 : règles de domaine qui ne verrouillent pas leur auteur, purge du catalogue,
nom de l'auteur d'un blocage d'IP, routes de référentiel retirées."""

import secrets

import pytest

from api.endpoints_catalog import purge_removed_endpoints, sync_catalog

pytestmark = pytest.mark.integration


@pytest.fixture
def domaines(instance):
    """Isole les règles de domaine : état vide au départ, rétabli à la fin."""
    avant = instance.sql("SELECT domain, allowed FROM email_domain_rule")
    instance.sql("DELETE FROM email_domain_rule")
    yield instance.admin_email.split("@")[-1].lower()
    instance.sql("DELETE FROM email_domain_rule")
    for domain, allowed in avant:
        instance.sql(
            "INSERT INTO email_domain_rule (domain, allowed) VALUES (%s, %s)", (domain, allowed)
        )


def _regles(instance):
    return dict(instance.sql("SELECT domain, allowed FROM email_domain_rule"))


def _post(client, admin, domain, allowed=True):
    return client.post(
        "/admin/email-domain-rules",
        headers=admin.headers,
        json={"domain": domain, "allowed": allowed},
    )


def test_regle_excluant_l_auteur_refusee_sans_ecriture(instance, client, admin, domaines):
    autre = f"autre-{secrets.token_hex(3)}.example.org"
    resp = _post(client, admin, autre)
    assert resp.status_code == 409, resp.text
    assert "connecter" in resp.json()["detail"]
    assert _regles(instance) == {}


def test_regle_couvrant_l_auteur_acceptee(instance, client, admin, domaines):
    assert _post(client, admin, domaines).status_code == 201
    autre = f"autre-{secrets.token_hex(3)}.example.org"
    assert _post(client, admin, autre).status_code == 201
    assert _regles(instance) == {domaines: True, autre: True}


def test_modification_interdisant_le_domaine_de_l_auteur_refusee(instance, client, admin, domaines):
    assert _post(client, admin, domaines).status_code == 201
    resp = _post(client, admin, domaines, allowed=False)
    assert resp.status_code == 409, resp.text
    assert _regles(instance) == {domaines: True}


def test_suppression_de_la_regle_de_l_auteur_refusee_si_il_en_reste_une_autre(
    instance, client, admin, domaines
):
    autre = f"autre-{secrets.token_hex(3)}.example.org"
    assert _post(client, admin, domaines).status_code == 201
    assert _post(client, admin, autre).status_code == 201
    regle_id = instance.sql("SELECT id FROM email_domain_rule WHERE domain = %s", (domaines,))[0][0]

    resp = client.request(
        "DELETE",
        f"/admin/email-domain-rules/{regle_id}",
        headers=admin.headers,
        json={"reason_code": "DELETE_CREATED_BY_MISTAKE"},
    )
    assert resp.status_code == 409, resp.text
    assert _regles(instance) == {domaines: True, autre: True}


def test_suppression_de_la_derniere_regle_acceptee(instance, client, admin, domaines):
    assert _post(client, admin, domaines).status_code == 201
    regle_id = instance.sql("SELECT id FROM email_domain_rule WHERE domain = %s", (domaines,))[0][0]
    resp = client.request(
        "DELETE",
        f"/admin/email-domain-rules/{regle_id}",
        headers=admin.headers,
        json={"reason_code": "DELETE_CREATED_BY_MISTAKE"},
    )
    assert resp.status_code == 200, resp.text
    assert _regles(instance) == {}


def test_catalogue_retire_les_endpoints_disparus_du_code(instance, client):
    from api.app import app
    from api.db import get_connection, release_connection

    code = f"zz-disparu:ancienne_route_{secrets.token_hex(3)}"
    instance.sql(
        "INSERT INTO tunnel_endpoint (code, method, path, description, module, is_sensitive) "
        "VALUES (%s, 'GET', '/zz-disparu', 'test', 'zz', false)",
        (code,),
    )
    instance.sql(
        "INSERT INTO tunnel_permission (role_id, endpoint_id, allowed) "
        "SELECT r.id, e.id, true FROM tunnel_role r, tunnel_endpoint e WHERE e.code = %s",
        (code,),
    )
    avant = instance.sql("SELECT count(*) FROM tunnel_endpoint")[0][0]

    conn = get_connection()
    try:
        sync_catalog(app.routes, conn)
    finally:
        release_connection(conn)

    assert instance.sql("SELECT 1 FROM tunnel_endpoint WHERE code = %s", (code,)) == []
    assert (
        instance.sql(
            "SELECT 1 FROM tunnel_permission p LEFT JOIN tunnel_endpoint e ON e.id = p.endpoint_id "
            "WHERE e.id IS NULL"
        )
        == []
    )
    assert instance.sql("SELECT count(*) FROM tunnel_endpoint")[0][0] == avant - 1


def test_purge_ignoree_si_aucune_route_n_est_fournie(instance):
    """Une application mal chargée ne doit jamais effacer la matrice des droits."""
    from api.db import get_connection, release_connection

    avant = instance.sql("SELECT count(*) FROM tunnel_endpoint")[0][0]
    droits = instance.sql("SELECT count(*) FROM tunnel_permission")[0][0]

    conn = get_connection()
    try:
        assert purge_removed_endpoints([], conn) == 0
        conn.commit()
    finally:
        release_connection(conn)

    assert instance.sql("SELECT count(*) FROM tunnel_endpoint")[0][0] == avant
    assert instance.sql("SELECT count(*) FROM tunnel_permission")[0][0] == droits


def test_liste_des_ip_bloquees_donne_le_nom_de_l_auteur(instance, client, admin):
    ip = f"203.0.113.{secrets.randbelow(250) + 1}"
    try:
        resp = client.post("/admin/ip-blocklist", headers=admin.headers, json={"ip_address": ip})
        assert resp.status_code == 201, resp.text
        lignes = client.get("/admin/ip-blocklist", headers=admin.headers).json()
        ligne = next(x for x in lignes if x["ip_address"] == ip)
        assert ligne["created_by"] == admin.id
        assert ligne["created_by_name"]
        assert ligne["created_by_name"] != admin.id

        instance.sql("UPDATE ip_blocklist SET created_by = NULL WHERE ip_address = %s", (ip,))
        lignes = client.get("/admin/ip-blocklist", headers=admin.headers).json()
        ligne = next(x for x in lignes if x["ip_address"] == ip)
        assert ligne["created_by"] is None and ligne["created_by_name"] is None
    finally:
        instance.sql("DELETE FROM ip_blocklist WHERE ip_address = %s", (ip,))


@pytest.mark.parametrize(
    "path",
    [
        "/admin/action-categories/1/active",
        "/admin/action-subcategories/1/active",
        "/admin/complexity-factors/1",
        "/admin/complexity-factors/1/active",
    ],
)
def test_routes_de_referentiel_retirees(client, admin, path):
    resp = client.patch(path, headers=admin.headers, json={"is_active": True})
    assert resp.status_code in (404, 405)
