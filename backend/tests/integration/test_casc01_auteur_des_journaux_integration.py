"""Auteur des journaux de statut et fin des doublons (CASC-01, ADR 0029, migration 0022)."""

import importlib.util
from pathlib import Path

import pytest

from tests.integration.etape2_helpers import intervention_liee
from tests.integration.test_audc_transaction_integration import monter  # noqa: F401

# Ces tests portent sur la clôture, pas sur le constat (ADR 0043) : CUR n'en exige pas ici.
pytestmark = [pytest.mark.integration, pytest.mark.usefixtures("cur_sans_constat")]

_MIGRATION = Path(__file__).resolve().parents[2] / "alembic/versions/0022_auteur_des_journaux.py"
_COLONNE = (
    "SELECT data_type, is_nullable FROM information_schema.columns "
    "WHERE table_name = 'intervention_status_log' AND column_name = 'changed_by'"
)
_FONCTIONS = (
    "SELECT proname, md5(prosrc) FROM pg_proc WHERE proname IN "
    "('trg_log_status_change', 'fn_log_request_status_change', 'fn_init_request_status_log', "
    "'fn_sync_status_log_to_intervention', 'trg_init_status_log') ORDER BY proname"
)
_COMPTES = (
    "SELECT (SELECT count(*) FROM request_status_log), "
    "(SELECT count(*) FROM intervention_status_log)"
)


def _migration():
    spec = importlib.util.spec_from_file_location("migration_0022", _MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _fermer(client, admin, instance):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    resp = client.put(
        f"/interventions/{intervention_id}",
        headers=admin.headers,
        json={"status_actual": "ferme"},
    )
    assert resp.status_code == 200, resp.text
    return intervention_id, request_id


def test_revision_et_parent():
    module = _migration()
    assert module.revision == "0022_auteur_des_journaux"
    assert len(module.revision) <= 32
    assert module.down_revision == "0021_motifs_reouverture"


def test_cloture_une_seule_ligne_de_demande_avec_son_auteur(client, admin, instance):
    intervention_id, request_id = _fermer(client, admin, instance)
    lignes = instance.sql(
        "SELECT changed_by FROM request_status_log WHERE request_id = %s AND status_to = 'cloturee'",
        (request_id,),
    )
    assert [str(ligne[0]) for ligne in lignes] == [admin.id]
    journal = instance.sql(
        "SELECT changed_by FROM intervention_status_log "
        "WHERE intervention_id = %s AND status_to = 'ferme'",
        (intervention_id,),
    )
    assert [str(ligne[0]) for ligne in journal] == [admin.id]


def test_creation_de_demande_porte_son_auteur(client, admin, instance):
    _, request_id = intervention_liee(client, admin, instance)
    auteurs = instance.sql(
        "SELECT changed_by FROM request_status_log WHERE request_id = %s AND status_from IS NULL",
        (request_id,),
    )
    assert [str(ligne[0]) for ligne in auteurs] == [admin.id]


def test_aucun_auteur_residuel_sur_les_connexions_du_pool(client, admin, instance, monter):  # noqa: F811
    """Le réglage est local à la transaction : aucune connexion du pool n'en garde trace."""

    def lire():
        from api.db import get_connection

        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT current_setting('app.user_id', true)")
            return {"auteur": cur.fetchone()[0]}

    monter("/_casc01/auteur", lire)
    resp = client.post("/_casc01/auteur", headers=admin.headers)
    assert resp.status_code == 200, resp.text
    assert resp.json()["auteur"] == admin.id

    from api import db

    empruntees = []
    try:
        for _ in range(10):
            try:
                empruntees.append(db._borrow())
            except Exception:
                break
        assert empruntees
        for conn in empruntees:
            with conn.cursor() as cur:
                cur.execute("SELECT NULLIF(current_setting('app.user_id', true), '')")
                assert cur.fetchone()[0] is None
            conn.rollback()
    finally:
        for conn in empruntees:
            db.release_connection(conn)


def test_get_et_requete_anonyme_ne_posent_aucun_auteur(client, instance):
    from api import db

    conn = db._borrow()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT NULLIF(current_setting('app.user_id', true), '')")
            assert cur.fetchone()[0] is None
    finally:
        db.release_connection(conn)


def test_migration_rejouee_sans_erreur_ni_ligne_ecrite(instance):
    module = _migration()
    colonne = instance.sql(_COLONNE)
    fonctions = instance.sql(_FONCTIONS)
    comptes = instance.sql(_COMPTES)
    assert colonne == [("uuid", "YES")]
    for _ in range(2):
        for statement in module.upgrade_statements():
            instance.sql(statement)
    assert (instance.sql(_COLONNE), instance.sql(_FONCTIONS), instance.sql(_COMPTES)) == (
        colonne,
        fonctions,
        comptes,
    )


def test_retour_arriere_puis_remontee(instance):
    module = _migration()
    fonctions = instance.sql(_FONCTIONS)
    for statement in module.downgrade_statements():
        instance.sql(statement)
    assert instance.sql(_COLONNE) == []
    assert instance.sql(_FONCTIONS) != fonctions
    for statement in module.upgrade_statements():
        instance.sql(statement)
    assert instance.sql(_FONCTIONS) == fonctions
    assert instance.sql(_COLONNE) == [("uuid", "YES")]
