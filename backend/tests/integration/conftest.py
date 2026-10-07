"""Fixtures d'intégration : vraie base, vrai bootstrap, vrais middlewares (JWT, audit).

Actives seulement si TEST_DATABASE_URL_OWNER est défini (scripts/test-integration.sh
le fait avec un PostgreSQL jetable). Une base NEUVE est créée sur ce serveur, puis
supprimée en fin de session : aucun contact avec la base de dev.

Le rôle applicatif s'appelle tunnel_app_it (et non tunnel_app) pour ne pas gêner
test_bootstrap_integration.py, qui supprime tunnel_app sur le même serveur.
"""

import os
import re
import secrets
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

import psycopg2
import pytest
from fastapi.testclient import TestClient

OWNER_URL = os.environ.get("TEST_DATABASE_URL_OWNER")
BACKEND = Path(__file__).resolve().parents[2]
APP_ROLE = "tunnel_app_it"
ADMIN_EMAIL = "admin@example.org"


@dataclass
class Instance:
    owner_url: str
    app_url: str
    admin_email: str
    admin_password: str

    def sql(self, query: str, params=None):
        """Exécute une requête avec le rôle PROPRIÉTAIRE (mise en place et vérifications)."""
        conn = psycopg2.connect(self.owner_url)
        try:
            with conn.cursor() as cur:
                cur.execute(query, params)
                rows = cur.fetchall() if cur.description else []
            conn.commit()
            return rows
        finally:
            conn.close()


def _with_db(url: str, dbname: str, user=None, password=None) -> str:
    p = urlparse(url)
    user = user or p.username
    password = password or p.password
    return f"postgresql://{user}:{password}@{p.hostname}:{p.port}/{dbname}"


@pytest.fixture(scope="session")
def instance():
    """Base neuve + bootstrap (rôle applicatif, migrations, premier admin)."""
    if not OWNER_URL:
        pytest.skip("TEST_DATABASE_URL_OWNER absent")
    dbname = f"tunnel_it_{secrets.token_hex(4)}"
    app_password = secrets.token_hex(12)
    conn = psycopg2.connect(OWNER_URL)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(f'CREATE DATABASE "{dbname}"')
    owner_url = _with_db(OWNER_URL, dbname)
    app_url = _with_db(OWNER_URL, dbname, APP_ROLE, app_password)
    env = {
        **os.environ,
        "DATABASE_URL_OWNER": owner_url,
        "DATABASE_URL": app_url,
        "ADMIN_EMAIL": ADMIN_EMAIL,
        "API_ENV": "test",
        "JWT_SECRET_KEY": os.environ["JWT_SECRET_KEY"],
    }
    try:
        done = subprocess.run(
            [sys.executable, "-m", "scripts.bootstrap"],
            cwd=BACKEND,
            env=env,
            capture_output=True,
            text=True,
            timeout=300,
        )
        assert done.returncode == 0, done.stdout + done.stderr
        found = re.search(r"mot de passe : (\S+)", done.stdout)
        assert found, "mot de passe du premier admin introuvable dans la sortie du bootstrap"
        yield Instance(owner_url, app_url, ADMIN_EMAIL, found.group(1))
    finally:
        with conn.cursor() as cur:
            cur.execute(f'DROP DATABASE IF EXISTS "{dbname}" WITH (FORCE)')
            cur.execute(f"DROP ROLE IF EXISTS {APP_ROLE}")
        conn.close()


@pytest.fixture(scope="session")
def client(instance):
    """TestClient sur api.app:app avec son lifespan réel, pool connecté en tunnel_app_it."""
    from api.app import app
    from api.settings import settings

    previous = settings.DATABASE_URL
    settings.DATABASE_URL = instance.app_url
    try:
        with TestClient(app, raise_server_exceptions=False) as c:
            yield c
    finally:
        settings.DATABASE_URL = previous


def login(instance: Instance, client: TestClient, email: str, password: str):
    """POST /auth/login. Vide auth_attempt avant : l'anti-flood (20/h/IP) ne concerne pas ces tests."""
    instance.sql("DELETE FROM auth_attempt")
    return client.post("/auth/login", json={"email": email, "password": password})


@dataclass
class Account:
    id: str
    email: str
    password: str
    role: str
    token: str
    refresh_token: str

    @property
    def headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}


@pytest.fixture(scope="session")
def admin(instance, client) -> Account:
    resp = login(instance, client, instance.admin_email, instance.admin_password)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    return Account(
        body["user"]["id"],
        instance.admin_email,
        instance.admin_password,
        "ADMIN",
        body["access_token"],
        body["refresh_token"],
    )


@pytest.fixture
def make_user(instance, client, admin):
    """Fabrique un utilisateur actif du rôle demandé via l'API admin, puis le connecte."""

    def _make(role: str) -> Account:
        suffix = secrets.token_hex(4)
        email = f"{role.lower()}-{suffix}@example.org"
        password = f"Pw-{secrets.token_hex(8)}"
        created = client.post(
            "/admin/users",
            headers=admin.headers,
            json={
                "email": email,
                "password": password,
                "first_name": role,
                "initial": suffix[:3].upper(),
                "role_code": role,
            },
        )
        assert created.status_code == 201, created.text
        resp = login(instance, client, email, password)
        assert resp.status_code == 200, resp.text
        body = resp.json()
        return Account(
            created.json()["id"], email, password, role, body["access_token"], body["refresh_token"]
        )

    return _make


@pytest.fixture
def grant(instance, client):
    """Accorde des permissions de la matrice (ADR 0007) en SQL propriétaire, le temps du test.

    grant("TECH", "POST", "/suppliers") ou grant(..., allowed=False) pour retirer un droit
    de la matrice par défaut posée par le bootstrap. Les valeurs d'origine sont
    rétablies en fin de test et le cache du process est rechargé tout de suite.
    """
    from api.auth.permissions import permission_cache

    anciens: list[tuple[str, str, bool]] = []

    def _grant(role: str, method: str, path: str, allowed: bool = True) -> None:
        rows = instance.sql(
            "SELECT tp.role_id::text, tp.endpoint_id::text, tp.allowed FROM tunnel_permission tp "
            "JOIN tunnel_role tr ON tr.id = tp.role_id "
            "JOIN tunnel_endpoint te ON te.id = tp.endpoint_id "
            "WHERE tr.code = %s AND te.method = %s AND te.path = %s",
            (role, method, path),
        )
        assert len(rows) == 1, f"endpoint {method} {path} absent du catalogue pour {role}"
        role_id, endpoint_id, avant = rows[0]
        anciens.append((role_id, endpoint_id, avant))
        instance.sql(
            "UPDATE tunnel_permission SET allowed = %s WHERE role_id = %s AND endpoint_id = %s",
            (allowed, role_id, endpoint_id),
        )
        permission_cache.reload()

    yield _grant
    for role_id, endpoint_id, avant in reversed(anciens):
        instance.sql(
            "UPDATE tunnel_permission SET allowed = %s WHERE role_id = %s AND endpoint_id = %s",
            (avant, role_id, endpoint_id),
        )
    permission_cache.reload()
