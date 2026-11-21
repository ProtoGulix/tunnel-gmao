"""Chargeur de la base de démonstration (ADR 0036, DEMO-06) sur de vraies bases jetables.

Chaque base porte « demo » dans son nom (garde-fou du chargeur) et est installée par le vrai
bootstrap. Le test casse dès qu'une migration rend le chargeur invalide.
"""

import importlib.util
import json
import os
import re
import secrets
import subprocess
import sys
from datetime import date

import bcrypt
import psycopg2
import pytest

from tests.integration.conftest import BACKEND, OWNER_URL, _with_db

pytestmark = pytest.mark.integration

DEMO_DIR = BACKEND.parent / "deploy" / "demo"
SCENARIO = DEMO_DIR / "scenario"
PASSWORD = "Demo-Mdp-2026"
TODAY = date(2026, 11, 21)


def _load_module():
    spec = importlib.util.spec_from_file_location("load_demo", DEMO_DIR / "load_demo.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


load_demo = _load_module()


def _scenario():
    factory = json.loads((SCENARIO / "usine.json").read_text(encoding="utf-8"))
    items = json.loads((SCENARIO / "interventions.json").read_text(encoding="utf-8"))
    return factory, items


def _create_database(name_suffix):
    """Base neuve « demo » + bootstrap ; rend (dbname, owner_url, app_url)."""
    if not OWNER_URL:
        pytest.skip("TEST_DATABASE_URL_OWNER absent")
    dbname = f"tunnel_it_demo_{name_suffix}_{secrets.token_hex(3)}"
    app_password = secrets.token_hex(12)
    admin = psycopg2.connect(OWNER_URL)
    admin.autocommit = True
    with admin.cursor() as cur:
        cur.execute(f'CREATE DATABASE "{dbname}"')
    admin.close()
    owner_url = _with_db(OWNER_URL, dbname)
    # Un rôle applicatif par base : le rôle d'une base ne bloque pas la suppression de l'autre.
    role = f"tunnel_app_demo_{name_suffix}_it"
    app_url = _with_db(OWNER_URL, dbname, role, app_password)
    env = {
        **os.environ,
        "DATABASE_URL_OWNER": owner_url,
        "DATABASE_URL": app_url,
        "ADMIN_EMAIL": "admin@example.org",
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
    return dbname, owner_url, app_url, role


def _drop_database(dbname, role):
    admin = psycopg2.connect(OWNER_URL)
    admin.autocommit = True
    with admin.cursor() as cur:
        cur.execute(f'DROP DATABASE IF EXISTS "{dbname}" WITH (FORCE)')
        cur.execute(f"DROP ROLE IF EXISTS {role}")
    admin.close()


def _run_loader(owner_url, today=TODAY, password=PASSWORD):
    env = {**os.environ, "DATABASE_URL_OWNER": owner_url, "DEMO_PASSWORD": password}
    return subprocess.run(
        [sys.executable, str(DEMO_DIR / "load_demo.py"), "--today", today.isoformat()],
        env=env,
        capture_output=True,
        text=True,
        timeout=300,
    )


def _query(url, sql, params=None):
    conn = psycopg2.connect(url)
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchall() if cur.description else []
    finally:
        conn.close()


@pytest.fixture(scope="module")
def demo_db():
    dbname, owner_url, app_url, role = _create_database("a")
    try:
        done = _run_loader(owner_url)
        assert done.returncode == 0, done.stdout + done.stderr
        yield {"owner": owner_url, "app": app_url, "name": dbname, "stdout": done.stdout}
    finally:
        _drop_database(dbname, role)


def test_volumes_du_scenario(demo_db):
    _, items = _scenario()
    with_intervention = [x for x in items if x["intervention"]]
    actions = sum(len(x["intervention"]["actions"]) for x in with_intervention)
    tasks = sum(len(x["intervention"]["taches"]) for x in with_intervention)
    owner = demo_db["owner"]
    assert _query(owner, "SELECT count(*) FROM intervention")[0][0] == len(with_intervention)
    assert _query(owner, "SELECT count(*) FROM intervention_action")[0][0] == actions
    assert _query(owner, "SELECT count(*) FROM intervention_task")[0][0] == tasks
    assert _query(owner, "SELECT count(*) FROM intervention_request")[0][0] == len(items)
    # Les statuts courants de l'intervention et de la demande suivent le scénario.
    closed = sum(1 for x in with_intervention if x["statut_demande"] == "cloturee")
    assert (
        _query(owner, "SELECT count(*) FROM intervention WHERE status_actual = 'ferme'")[0][0]
        == closed
    )
    assert (
        _query(owner, "SELECT count(*) FROM intervention_request WHERE statut = 'cloturee'")[0][0]
        == closed
    )


def test_achats_charges_quand_le_scenario_les_fournit(demo_db):
    path = SCENARIO / "achats.json"
    if not path.exists():
        pytest.skip("achats.json absent")
    shop = json.loads(path.read_text(encoding="utf-8"))
    owner = demo_db["owner"]
    assert _query(owner, "SELECT count(*) FROM purchase_request")[0][0] == len(shop["demandes"])
    assert _query(owner, "SELECT count(*) FROM supplier_order")[0][0] == len(shop["commandes"])
    # Modèle réel des pièces (DEMO-08) : une pièce par article, aucun ancien stock_item.
    assert _query(owner, "SELECT count(*) FROM part")[0][0] == len(shop["articles"])
    assert _query(owner, "SELECT count(*) FROM part_manufacturer_ref")[0][0] == len(
        shop["articles"]
    )
    assert _query(owner, "SELECT count(*) FROM part_supplier_ref")[0][0] == sum(
        len(a["fournisseurs"]) for a in shop["articles"]
    )
    assert _query(owner, "SELECT count(*) FROM stock_item")[0][0] == 0
    with_article = sum(1 for d in shop["demandes"] if d.get("article"))
    assert (
        _query(owner, "SELECT count(*) FROM purchase_request WHERE part_id IS NOT NULL")[0][0]
        == with_article
    )
    assert (
        _query(owner, "SELECT count(*) FROM purchase_request WHERE stock_item_id IS NOT NULL")[0][0]
        == 0
    )
    assert (
        _query(
            owner,
            "SELECT count(*) FROM supplier_order_line WHERE part_id IS NULL "
            "OR stock_item_id IS NOT NULL",
        )[0][0]
        == 0
    )
    # Les triggers laissés actifs ont fait leur travail : total de commande et références.
    assert (
        _query(
            demo_db["owner"],
            "SELECT count(*) FROM supplier_order o WHERE o.total_amount IS DISTINCT FROM "
            "COALESCE((SELECT SUM(total_price) FROM supplier_order_line WHERE supplier_order_id = o.id), 0)",
        )[0][0]
        == 0
    )
    assert _query(owner, "SELECT count(*) FROM part WHERE internal_ref IS NULL")[0][0] == 0


def test_comptes_publics_connectables_et_collegues_sans_connexion(demo_db):
    rows = _query(
        demo_db["owner"],
        "SELECT u.email, u.password_hash, r.code FROM tunnel_user u JOIN tunnel_role r "
        "ON r.id = u.role_id WHERE u.email LIKE '%@demo.frezille.fr'",
    )
    roles = {email: role for email, _, role in rows}
    assert roles == {
        "technicien@demo.frezille.fr": "TECH",
        "acheteur@demo.frezille.fr": "ACHETEUR",
        "direction@demo.frezille.fr": "RESP",
    }
    for _, password_hash, _ in rows:
        assert bcrypt.checkpw(PASSWORD.encode(), password_hash.encode())
    colleagues = _query(
        demo_db["owner"],
        "SELECT email, password_hash FROM tunnel_user WHERE email LIKE '%.example' "
        "AND email <> 'admin@example.org'",
    )
    assert colleagues
    for email, password_hash in colleagues:
        assert email.endswith("@morvance.example")
        assert not bcrypt.checkpw(PASSWORD.encode(), password_hash.encode())


def test_vue_d_accueil_de_resp(demo_db):
    rows = _query(
        demo_db["owner"],
        "SELECT h.home_view FROM role_home_view h JOIN tunnel_role r ON r.id = h.role_id "
        "WHERE r.code = 'RESP'",
    )
    assert rows == [("direction_technique",)]


def test_prochaine_echeance_preventive_en_retard(demo_db):
    from api.preventive_occurrences.repo import PreventiveOccurrenceRepository
    from api.preventive_occurrences.schedule import STATE_OVERDUE
    from api.settings import settings

    conn = psycopg2.connect(demo_db["owner"])
    try:
        with conn.cursor() as cur:
            rows = PreventiveOccurrenceRepository._fetch_schedule_rows(cur, "", [])
    finally:
        conn.close()
    lines = PreventiveOccurrenceRepository._build_schedule(
        rows, TODAY, settings.PREVENTIVE_LEAD_DAYS, STATE_OVERDUE
    )
    assert lines, "aucun préventif en retard dans l'échéancier de la démonstration"
    assert all(line["reference_date"] is not None for line in lines)


def test_journaux_et_audit_portent_les_auteurs_fictifs(demo_db):
    owner = demo_db["owner"]
    # Chaque demande a son journal, chaque intervention le sien, avec un auteur sauf pour
    # le système.
    assert (
        _query(
            owner,
            "SELECT count(*) FROM intervention_request r WHERE NOT EXISTS "
            "(SELECT 1 FROM request_status_log l WHERE l.request_id = r.id AND l.status_to = r.statut)",
        )[0][0]
        == 0
    )
    assert (
        _query(
            owner,
            "SELECT count(*) FROM intervention i WHERE NOT EXISTS (SELECT 1 FROM intervention_status_log l "
            "WHERE l.intervention_id = i.id AND l.status_to = i.status_actual)",
        )[0][0]
        == 0
    )
    assert (
        _query(owner, "SELECT count(*) FROM audit_log WHERE NOT is_system AND changed_by IS NULL")[
            0
        ][0]
        == 0
    )
    # Une décision humaine hors travail normal (rejet) et une clôture sont tracées.
    assert (
        _query(
            owner,
            "SELECT count(*) FROM audit_log l JOIN audit_reason_code c ON c.id = l.reason_code_id "
            "WHERE l.decision_type = 'statut_changed' AND c.code = 'OTHER' AND l.reason_text <> ''",
        )[0][0]
        >= 1
    )
    assert (
        _query(
            owner,
            "SELECT count(*) FROM audit_log WHERE entity_type = 'intervention' "
            "AND decision_type = 'status_actual_changed' AND new_value->>'status_actual' = 'ferme'",
        )[0][0]
        >= 1
    )
    # Les dates relatives sont calées sur le jour du chargement.
    oldest, newest = _query(
        owner, "SELECT min(logged_at)::date, max(logged_at)::date FROM audit_log"
    )[0]
    assert (TODAY - oldest).days <= 365 and newest <= TODAY


def test_triggers_reactives_et_journaux_en_ajout_seul(demo_db):
    assert (
        _query(
            demo_db["owner"],
            "SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal AND tgenabled <> 'O'",
        )[0][0]
        == 0
    )
    conn = psycopg2.connect(demo_db["app"])
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM audit_log")
            assert cur.fetchone()[0] > 0
            with pytest.raises(psycopg2.errors.InsufficientPrivilege):
                cur.execute("UPDATE audit_log SET reason_text = 'x'")
    finally:
        conn.close()


def test_garde_fou_du_nom_de_base(instance):
    """La base des autres tests ne contient pas « demo » : refus, rien n'est écrit."""
    tables = "SELECT (SELECT count(*) FROM service), (SELECT count(*) FROM machine), "
    tables += "(SELECT count(*) FROM tunnel_user), (SELECT count(*) FROM audit_log)"
    before = instance.sql(tables)
    done = _run_loader(instance.owner_url)
    assert done.returncode == 1
    assert "demo" in done.stderr and "refusé" in done.stderr
    assert instance.sql(tables) == before


def test_seconde_execution_refusee_sur_base_non_vide(demo_db):
    before = _query(demo_db["owner"], "SELECT count(*) FROM audit_log")[0][0]
    done = _run_loader(demo_db["owner"])
    assert done.returncode == 1
    assert "déjà" in done.stderr
    assert _query(demo_db["owner"], "SELECT count(*) FROM audit_log")[0][0] == before


def test_mot_de_passe_refuse_sans_majuscule_ni_chiffre(demo_db):
    done = _run_loader(demo_db["owner"], password="tropfaible")
    assert done.returncode == 1 and "DEMO_PASSWORD" in done.stderr


def test_meme_contenu_a_decalage_de_dates_pres(demo_db):
    """Deux chargements (bases recréées) à des jours différents : mêmes volumes, mêmes écarts."""
    dbname, owner_url, _, role = _create_database("b")
    try:
        done = _run_loader(owner_url, today=date(2027, 3, 2))
        assert done.returncode == 0, done.stdout + done.stderr
        tables = (
            "intervention",
            "intervention_request",
            "intervention_action",
            "intervention_task",
            "request_status_log",
            "intervention_status_log",
            "preventive_occurrence",
            "purchase_request",
            "supplier_order",
            "audit_log",
        )
        for table in tables:
            assert (
                _query(owner_url, f"SELECT count(*) FROM {table}")[0][0]
                == _query(demo_db["owner"], f"SELECT count(*) FROM {table}")[0][0]
            ), table
        spans = [
            _query(
                url,
                "SELECT max(created_at)::date - min(created_at)::date FROM intervention_action",
            )[0][0]
            for url in (owner_url, demo_db["owner"])
        ]
        assert spans[0] == spans[1]
        codes = [
            re.sub(r"\d{8}", "D", c)
            for (c,) in _query(owner_url, "SELECT code FROM intervention ORDER BY code")
        ]
        assert codes == [
            re.sub(r"\d{8}", "D", c)
            for (c,) in _query(demo_db["owner"], "SELECT code FROM intervention ORDER BY code")
        ]
    finally:
        _drop_database(dbname, role)
