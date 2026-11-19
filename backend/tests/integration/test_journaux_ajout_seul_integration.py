"""Journaux en ajout seul pour le rôle de l'application (TRI-03, ADR 0007 point 6).

Le rôle applicatif peut lire et ajouter (y compris via fn_audit_log_decision, qui
s'exécute avec ses droits), jamais modifier, supprimer ni vider ces tables."""

import secrets

import psycopg2
import pytest

pytestmark = pytest.mark.integration

# table -> une colonne quelconque pour un UPDATE sans effet
JOURNAUX = {
    "audit_log": "id",
    "permission_audit_log": "id",
    "security_log": "id",
    "alembic_version_backend": "version_num",
}


def _app_execute(instance, query, params=None):
    conn = psycopg2.connect(instance.app_url)
    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return cur.fetchall() if cur.description else []
    finally:
        conn.rollback()
        conn.close()


def test_ajout_par_fn_audit_log_decision_reussit_avec_le_role_applicatif(instance, make_user):
    auteur = make_user("ADMIN")
    entite = secrets.token_hex(16)
    entite = f"{entite[:8]}-{entite[8:12]}-{entite[12:16]}-{entite[16:20]}-{entite[20:32]}"
    code = instance.sql(
        "SELECT code FROM audit_reason_code WHERE category <> 'system' AND is_active LIMIT 1"
    )[0][0]
    ligne = _app_execute(
        instance,
        "SELECT fn_audit_log_decision('intervention', %s, 'TEST', NULL, '{}'::jsonb, %s, 'essai', %s, false)",
        (entite, code, auteur.id),
    )
    assert ligne[0][0] is not None


@pytest.mark.parametrize("table", JOURNAUX)
def test_modification_suppression_et_vidage_refuses_au_role_applicatif(instance, table):
    colonne = JOURNAUX[table]
    for ordre in (
        f"UPDATE {table} SET {colonne} = {colonne}",
        f"DELETE FROM {table}",
        f"TRUNCATE {table}",
    ):
        with pytest.raises(psycopg2.errors.InsufficientPrivilege):
            _app_execute(instance, ordre)
    # la lecture reste permise
    _app_execute(instance, f"SELECT count(*) FROM {table}")
