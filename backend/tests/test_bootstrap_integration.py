"""Test d'intégration de scripts.bootstrap sur une base PostgreSQL VIDE.

Ignoré sans TEST_DATABASE_URL_OWNER (check.sh reste rapide et sans base).
Lancer avec une base jetable, jamais la base de dev :

    TEST_DATABASE_URL_OWNER=postgresql://tunnel_owner:owner-test@127.0.0.1:55433/tunnel \
        .venv/bin/pytest -m integration tests/test_bootstrap_integration.py

Le test VIDE le schéma public de cette base. alembic et sqlalchemy doivent
être installés dans l'interpréteur qui lance pytest.
"""

import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

import psycopg2
import pytest

OWNER_URL = os.environ.get("TEST_DATABASE_URL_OWNER")
BACKEND = Path(__file__).resolve().parents[1]
APP_PASSWORD = "app-test-pw"

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(not OWNER_URL, reason="TEST_DATABASE_URL_OWNER absent"),
]

ADMIN_SQL = (
    "SELECT email FROM tunnel_user u JOIN tunnel_role r ON r.id = u.role_id "
    "WHERE r.code = 'ADMIN' AND u.is_active"
)


def _app_url() -> str:
    parsed = urlparse(OWNER_URL)
    return f"postgresql://tunnel_app:{APP_PASSWORD}@{parsed.hostname}:{parsed.port}{parsed.path}"


def _bootstrap() -> subprocess.CompletedProcess:
    env = {
        **os.environ,
        "DATABASE_URL_OWNER": OWNER_URL,
        "DATABASE_URL": _app_url(),
        "ADMIN_EMAIL": "admin@example.org",
        "API_ENV": "test",
        "JWT_SECRET_KEY": "cle-de-test-uniquement-pour-pytest-0123456789",
    }
    return subprocess.run(
        [sys.executable, "-m", "scripts.bootstrap"],
        cwd=BACKEND,
        env=env,
        capture_output=True,
        text=True,
        timeout=180,
    )


def _query(url: str, query: str):
    conn = psycopg2.connect(url)
    try:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()
    finally:
        conn.close()


@pytest.fixture(scope="module")
def first_run():
    conn = psycopg2.connect(OWNER_URL)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("DROP SCHEMA public CASCADE")
        cur.execute("CREATE SCHEMA public")
        cur.execute("SELECT 1 FROM pg_roles WHERE rolname = 'tunnel_app'")
        if cur.fetchone():
            cur.execute("DROP OWNED BY tunnel_app")
            cur.execute("DROP ROLE tunnel_app")
    conn.close()
    return _bootstrap()


def test_first_run_succeeds_and_prints_password_once(first_run):
    assert first_run.returncode == 0, first_run.stdout + first_run.stderr
    assert first_run.stdout.count("mot de passe :") == 1


def test_schema_roles_and_status_codes(first_run):
    tables = _query(
        OWNER_URL,
        "SELECT count(*) FROM information_schema.tables "
        "WHERE table_schema = 'public' AND table_type = 'BASE TABLE'",
    )
    assert tables[0][0] >= 60
    roles = _query(OWNER_URL, "SELECT code FROM tunnel_role ORDER BY code")
    assert [r[0] for r in roles] == ["ACHETEUR", "ADMIN", "MCP", "RESP", "TECH"]
    statuses = _query(OWNER_URL, "SELECT id, code FROM intervention_status_ref")
    assert len(statuses) == 4
    assert all(i == c and c for i, c in statuses)
    version = _query(OWNER_URL, "SELECT version_num FROM alembic_version_backend")
    assert version == [("0002_donnees_reference",)]


def test_app_role_is_not_superuser_and_can_read_write(first_run):
    flags = _query(
        OWNER_URL,
        "SELECT rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = 'tunnel_app'",
    )
    assert flags == [(False, False, False)]
    conn = psycopg2.connect(_app_url())
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM tunnel_role")
            assert cur.fetchone()[0] == 5
            cur.execute(
                "INSERT INTO tunnel_endpoint (code, method, path) VALUES ('t:t', 'GET', '/t')"
            )
            cur.execute("UPDATE tunnel_endpoint SET path = '/u' WHERE code = 't:t'")
            cur.execute("DELETE FROM tunnel_endpoint WHERE code = 't:t'")
    finally:
        conn.rollback()
        conn.close()


def test_seeds_default_matrix_and_home_views(first_run):
    allowed = _query(
        OWNER_URL,
        "SELECT r.code, count(*) FROM tunnel_permission p JOIN tunnel_role r ON r.id = p.role_id "
        "WHERE p.allowed GROUP BY r.code",
    )
    # Matrice par défaut (db/default_permissions.py) ; détail dans
    # tests/integration/test_default_permissions_integration.py.
    assert dict(allowed) == {"ADMIN": 256, "RESP": 220, "TECH": 118, "ACHETEUR": 156, "MCP": 109}
    assert _query(OWNER_URL, "SELECT count(*) FROM role_home_view")[0][0] == 4


def test_admin_created_and_second_run_changes_nothing(first_run):
    assert _query(OWNER_URL, ADMIN_SQL) == [("admin@example.org",)]
    before = _query(OWNER_URL, "SELECT id, password_hash FROM tunnel_user")
    second = _bootstrap()
    assert second.returncode == 0, second.stdout + second.stderr
    assert "mot de passe :" not in second.stdout
    assert _query(OWNER_URL, "SELECT id, password_hash FROM tunnel_user") == before
    assert _query(OWNER_URL, ADMIN_SQL) == [("admin@example.org",)]
