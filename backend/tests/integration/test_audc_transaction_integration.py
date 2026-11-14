"""Transaction par requête (ADR 0018, AUDC-11) sur l'application réelle et une vraie base.

Les routes de test sont montées sur api.app:app le temps d'un test puis retirées : aucun
fichier de production n'est touché.
"""

import secrets

import pytest

pytestmark = pytest.mark.integration


@pytest.fixture
def monter():
    """Monte des routes de test sur l'application réelle ; les retire en fin de test."""
    from api.app import app

    ajoutees = []

    def _monter(chemin, endpoint, methodes=("POST",)):
        app.add_api_route(chemin, endpoint, methods=list(methodes))
        ajoutees.append(app.router.routes[-1])

    yield _monter
    for route in ajoutees:
        app.router.routes.remove(route)


def _machine(code):
    from psycopg2.extras import RealDictCursor  # noqa: F401  (repos réels : même chemin)

    from api.db import get_connection, release_connection

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO machine (code, name) VALUES (%s, 'Test AUDC-11')", (code,))
        conn.commit()
    finally:
        release_connection(conn)


def _nb_machines(instance, code):
    return instance.sql("SELECT count(*) FROM machine WHERE code = %s", (code,))[0][0]


def test_transaction_en_erreur_sans_rollback_nest_jamais_validee(instance, client, admin, monter):
    """Erreur SQL avalée SANS rollback() : COMMIT passerait en silence, la requête est annulée."""

    def erreur_avalee(code: str):
        _machine(code)
        from api.db import get_connection, release_connection

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 / 0")
        except Exception:
            pass  # avalée, aucun rollback()
        finally:
            release_connection(conn)
        return {"ok": True}

    monter("/test-audc/erreur-avalee", erreur_avalee)
    code = f"TE-{secrets.token_hex(3)}"
    resp = client.post(f"/test-audc/erreur-avalee?code={code}", headers=admin.headers)
    assert resp.status_code == 500, resp.text
    assert resp.json()["error_type"] == "InternalServerError"
    assert "division" not in resp.text  # aucun détail SQL vers le client
    assert _nb_machines(instance, code) == 0


def test_requete_saine_est_validee_et_la_connexion_est_rendue(instance, client, admin, monter):
    from api import db

    def saine(code: str):
        _machine(code)
        return {"ok": True}

    monter("/test-audc/saine", saine)
    code = f"OK-{secrets.token_hex(3)}"
    resp = client.post(f"/test-audc/saine?code={code}", headers=admin.headers)
    assert resp.status_code == 200, resp.text
    assert _nb_machines(instance, code) == 1
    assert len(db._pool._used) == 0


def test_reponse_4xx_annule_les_ecritures(instance, client, admin, monter):
    from fastapi import HTTPException

    def refuse(code: str):
        _machine(code)
        raise HTTPException(status_code=409, detail="conflit")

    monter("/test-audc/refuse", refuse)
    code = f"CF-{secrets.token_hex(3)}"
    resp = client.post(f"/test-audc/refuse?code={code}", headers=admin.headers)
    assert resp.status_code == 409
    assert _nb_machines(instance, code) == 0


def test_get_nouvre_pas_de_transaction_de_requete(client, admin, monter):
    from api.db import RequestConnection, get_connection, release_connection

    def lecture():
        conn = get_connection()
        try:
            return {"enveloppee": isinstance(conn, RequestConnection)}
        finally:
            release_connection(conn)

    monter("/test-audc/lecture", lecture, methodes=("GET",))
    resp = client.get("/test-audc/lecture", headers=admin.headers)
    assert resp.status_code == 200, resp.text
    assert resp.json() == {"enveloppee": False}


def test_echec_de_connexion_reste_enregistre_hors_transaction(instance, client, admin):
    """/auth/login est exclu de la transaction de requête : la tentative survit au 401."""
    instance.sql("DELETE FROM auth_attempt")
    email = f"inconnu-{secrets.token_hex(3)}@example.org"
    resp = client.post("/auth/login", json={"email": email, "password": "mauvais-mot-de-passe"})
    assert resp.status_code == 401, resp.text
    rows = instance.sql("SELECT success FROM auth_attempt WHERE email = %s", (email,))
    assert rows == [(False,)]


def test_taches_de_fond_demarrent_apres_la_validation_avec_leur_connexion(
    instance, client, admin, monter
):
    """La tâche voit la mutation de la requête (déjà validée) et écrit hors transaction."""
    from fastapi import BackgroundTasks

    from api.db import RequestConnection, get_connection, release_connection

    vu = {}

    def tache(code: str):
        conn = get_connection()
        try:
            vu["enveloppee"] = isinstance(conn, RequestConnection)
            with conn.cursor() as cur:
                cur.execute("SELECT count(*) FROM machine WHERE code = %s", (code,))
                vu["mutation_visible"] = cur.fetchone()[0] == 1
            conn.commit()
        finally:
            release_connection(conn)

    def avec_tache(code: str, background: BackgroundTasks):
        _machine(code)
        background.add_task(tache, code)
        return {"ok": True}

    monter("/test-audc/avec-tache", avec_tache)
    code = f"BG-{secrets.token_hex(3)}"
    resp = client.post(f"/test-audc/avec-tache?code={code}", headers=admin.headers)
    assert resp.status_code == 200, resp.text
    assert vu == {"enveloppee": False, "mutation_visible": True}


def test_tache_de_fond_dune_requete_annulee_ne_sexecute_pas(instance, client, admin, monter):
    from fastapi import BackgroundTasks

    lancee = []

    def avec_tache_et_erreur(code: str, background: BackgroundTasks):
        _machine(code)
        background.add_task(lancee.append, code)
        from api.db import get_connection

        get_connection().rollback()  # rollback() de repo avalé : la requête sera annulée
        return {"ok": True}

    monter("/test-audc/tache-annulee", avec_tache_et_erreur)
    code = f"BA-{secrets.token_hex(3)}"
    resp = client.post(f"/test-audc/tache-annulee?code={code}", headers=admin.headers)
    assert resp.status_code == 500, resp.text
    assert _nb_machines(instance, code) == 0
    assert lancee == []


def test_requete_refusee_par_les_droits_nouvre_pas_la_route(
    instance, client, make_user, grant, monter
):
    """Le contrôle des droits est en amont : la route de test n'est jamais appelée."""
    appels = []

    def route(code: str):
        appels.append(code)
        return {"ok": True}

    monter("/test-audc/jamais", route)
    tech = make_user("TECH")
    resp = client.post("/test-audc/jamais?code=x", headers=tech.headers)
    assert resp.status_code == 403, resp.text
    assert appels == []
