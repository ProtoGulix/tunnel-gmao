"""Base jetable du spike AUDC-00 : base neuve sur le serveur de test-integration.sh."""

import os
import secrets
from urllib.parse import urlparse

import psycopg2
import pytest

OWNER_URL = os.environ.get("TEST_DATABASE_URL_OWNER")


@pytest.fixture(scope="module")
def spike_url():
    if not OWNER_URL:
        pytest.skip("TEST_DATABASE_URL_OWNER absent")
    dbname = f"tunnel_spike_{secrets.token_hex(4)}"
    admin = psycopg2.connect(OWNER_URL)
    admin.autocommit = True
    with admin.cursor() as cur:
        cur.execute(f'CREATE DATABASE "{dbname}"')
    p = urlparse(OWNER_URL)
    url = f"postgresql://{p.username}:{p.password}@{p.hostname}:{p.port}/{dbname}"
    conn = psycopg2.connect(url)
    with conn.cursor() as cur:
        cur.execute("CREATE TABLE spike_item (id serial PRIMARY KEY, label text NOT NULL)")
        cur.execute(
            "CREATE TABLE spike_audit (id serial PRIMARY KEY, path text NOT NULL, "
            "detail text NOT NULL)"
        )
    conn.commit()
    conn.close()
    try:
        yield url
    finally:
        with admin.cursor() as cur:
            cur.execute(f'DROP DATABASE IF EXISTS "{dbname}" WITH (FORCE)')
        admin.close()


@pytest.fixture
def pool(spike_url):
    """Pool de 4 connexions, installé dans api.db le temps du test (restauré ensuite)."""
    from api import db

    previous = db._pool
    db._pool = None
    db.init_pool(spike_url, minconn=1, maxconn=4, retries=1)
    try:
        yield db._pool
    finally:
        db.close_pool()
        db._pool = previous


@pytest.fixture
def sql(spike_url, pool):
    """Lecture/écriture indépendante du pool (connexion propre, autocommit)."""

    def _sql(query, params=None):
        conn = psycopg2.connect(spike_url)
        conn.autocommit = True
        try:
            with conn.cursor() as cur:
                cur.execute(query, params)
                return cur.fetchall() if cur.description else []
        finally:
            conn.close()

    _sql("TRUNCATE spike_item, spike_audit")
    return _sql
