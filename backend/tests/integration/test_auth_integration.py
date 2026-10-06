"""Authentification de bout en bout : vrai JWTMiddleware, vraie base."""

from datetime import datetime, timedelta, timezone

import jwt
import pytest

pytestmark = pytest.mark.integration

ROUTE_METIER = "/interventions"


def test_anonyme_refuse_sur_une_route_metier(client):
    assert client.get(ROUTE_METIER).status_code == 401


def test_jeton_mal_forme_refuse(client):
    resp = client.get(ROUTE_METIER, headers={"Authorization": "Bearer pas-un-jeton"})
    assert resp.status_code == 401


def test_jeton_signe_avec_une_autre_cle_refuse(client, make_user):
    tech = make_user("TECH")
    maintenant = datetime.now(timezone.utc)
    faux = jwt.encode(
        {
            "sub": tech.id,
            "role": "TECH",
            "permissions": [],
            "iat": maintenant,
            "exp": maintenant + timedelta(minutes=5),
        },
        "une-autre-cle-de-signature-tres-differente-0123456789",
        algorithm="HS256",
    )
    resp = client.get(ROUTE_METIER, headers={"Authorization": f"Bearer {faux}"})
    assert resp.status_code == 401


def test_jeton_valide_accepte(client, make_user):
    tech = make_user("TECH")
    assert client.get(ROUTE_METIER, headers=tech.headers).status_code == 200


def test_utilisateur_desactive_apres_emission_refuse(instance, client, make_user):
    tech = make_user("TECH")
    assert client.get(ROUTE_METIER, headers=tech.headers).status_code == 200
    instance.sql("UPDATE tunnel_user SET is_active = false WHERE id = %s", (tech.id,))
    assert client.get(ROUTE_METIER, headers=tech.headers).status_code == 401


def test_role_change_en_base_apres_emission_refuse(instance, client, make_user):
    tech = make_user("TECH")
    instance.sql(
        "UPDATE tunnel_user SET role_id = (SELECT id FROM tunnel_role WHERE code = 'RESP') "
        "WHERE id = %s",
        (tech.id,),
    )
    assert client.get(ROUTE_METIER, headers=tech.headers).status_code == 401


def test_refresh_rotation_puis_reutilisation_revoque_tout(instance, client, make_user):
    tech = make_user("TECH")
    ancien = tech.refresh_token

    rotation = client.post("/auth/refresh", json={"refresh_token": ancien})
    assert rotation.status_code == 200, rotation.text
    nouveau = rotation.json()["refresh_token"]
    assert nouveau != ancien
    assert client.get(ROUTE_METIER, headers=_bearer(rotation.json()["access_token"])).status_code

    # Réutiliser l'ancien jeton signale un vol : refus, et tous les jetons sont révoqués.
    rejoue = client.post("/auth/refresh", json={"refresh_token": ancien})
    assert rejoue.status_code == 401
    actifs = instance.sql(
        "SELECT count(*) FROM refresh_token WHERE user_id = %s AND NOT revoked", (tech.id,)
    )
    assert actifs == [(0,)]
    assert client.post("/auth/refresh", json={"refresh_token": nouveau}).status_code == 401


def _bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
