"""Matrice par défaut appliquée par le bootstrap, et journaux en ajout seul (ADR 0007, 4 et 6)."""

import os
import subprocess
import sys
import uuid

import psycopg2
import pytest

from tests.integration.conftest import BACKEND

pytestmark = pytest.mark.integration

# Comptes attendus sur 256 endpoints : à mettre à jour avec les règles de
# db/default_permissions.py quand une route est ajoutée.
EXPECTED_ALLOWED = {"ADMIN": 256, "RESP": 220, "TECH": 120, "ACHETEUR": 156, "MCP": 109}


def _allowed_by_role(instance):
    rows = instance.sql(
        "SELECT r.code, count(*) FROM tunnel_permission p JOIN tunnel_role r ON r.id = p.role_id "
        "WHERE p.allowed GROUP BY r.code"
    )
    return dict(rows)


def _rerun_bootstrap(instance):
    env = {
        **os.environ,
        "DATABASE_URL_OWNER": instance.owner_url,
        "DATABASE_URL": instance.app_url,
        "ADMIN_EMAIL": instance.admin_email,
        "API_ENV": "test",
    }
    done = subprocess.run(
        [sys.executable, "-m", "scripts.bootstrap"],
        cwd=BACKEND,
        env=env,
        capture_output=True,
        text=True,
        timeout=300,
    )
    assert done.returncode == 0, done.stdout + done.stderr
    return done


def _perm(instance, role, method, path):
    rows = instance.sql(
        "SELECT p.id, p.role_id, p.endpoint_id, p.allowed FROM tunnel_permission p "
        "JOIN tunnel_role r ON r.id = p.role_id JOIN tunnel_endpoint e ON e.id = p.endpoint_id "
        "WHERE r.code = %s AND e.method = %s AND e.path = %s",
        (role, method, path),
    )
    assert len(rows) == 1
    return rows[0]


def test_base_neuve_matrice_attendue(instance):
    assert _allowed_by_role(instance) == EXPECTED_ALLOWED


def test_matrice_cas_precis(instance):
    def allowed(role, method, path):
        return _perm(instance, role, method, path)[3]

    assert allowed("TECH", "POST", "/intervention-requests")
    assert not allowed("TECH", "DELETE", "/interventions/{intervention_id}")
    assert allowed("ACHETEUR", "POST", "/supplier-orders")
    assert not allowed("RESP", "POST", "/admin/users")
    assert allowed("RESP", "GET", "/admin/users")
    assert not allowed("MCP", "GET", "/admin/users")
    assert not allowed("MCP", "POST", "/interventions")


def test_permission_modifiee_par_un_admin_n_est_pas_reecrite(instance):
    # Ouverte par un admin (ligne dans permission_audit_log) alors que le défaut la ferme.
    touched, role_id, endpoint_id, _ = _perm(
        instance, "TECH", "DELETE", "/interventions/{intervention_id}"
    )
    # Jamais touchée par un admin, changée hors audit : le bootstrap la remet au défaut.
    untouched = _perm(instance, "TECH", "POST", "/intervention-requests")[0]
    admin_id = instance.sql("SELECT id FROM tunnel_user LIMIT 1")[0][0]
    instance.sql("UPDATE tunnel_permission SET allowed = true WHERE id = %s", (touched,))
    instance.sql(
        "INSERT INTO permission_audit_log (changed_by, role_id, endpoint_id, old_allowed, "
        "new_allowed) VALUES (%s, %s, %s, false, true)",
        (admin_id, role_id, endpoint_id),
    )
    instance.sql("UPDATE tunnel_permission SET allowed = false WHERE id = %s", (untouched,))

    done = _rerun_bootstrap(instance)

    state = dict(
        instance.sql(
            "SELECT id::text, allowed FROM tunnel_permission WHERE id IN (%s, %s)",
            (touched, untouched),
        )
    )
    assert state[str(touched)] is True
    assert state[str(untouched)] is True
    assert "droits par défaut TECH : 1 ouverts, 0 fermés" in done.stdout
    # Idempotent : un deuxième passage ne change plus rien.
    assert "droits par défaut déjà à jour" in _rerun_bootstrap(instance).stdout


def test_application_ne_peut_pas_modifier_les_journaux(instance):
    conn = psycopg2.connect(instance.app_url)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            for table in ("audit_log", "permission_audit_log", "security_log"):
                for statement in (
                    f"UPDATE {table} SET id = id",
                    f"DELETE FROM {table}",
                    f"TRUNCATE {table}",
                ):
                    with pytest.raises(psycopg2.errors.InsufficientPrivilege):
                        cur.execute(statement)
    finally:
        conn.close()


def test_application_peut_lire_et_inserer_dans_audit_log(instance):
    conn = psycopg2.connect(instance.app_url)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO audit_log (entity_type, entity_id, decision_type) "
                "VALUES ('test', %s, 'test_insert')",
                (str(uuid.uuid4()),),
            )
            cur.execute("SELECT count(*) FROM audit_log WHERE decision_type = 'test_insert'")
            assert cur.fetchone()[0] == 1
    finally:
        conn.close()
