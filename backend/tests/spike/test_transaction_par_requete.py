"""AUDC-00 : preuve d'une transaction par requête portée par un BaseHTTPMiddleware."""

import threading

import pytest
from fastapi.testclient import TestClient

from api import db
from tests.spike import prototype as proto

pytestmark = pytest.mark.integration


@pytest.fixture
def client(pool, sql):
    for k in proto.stats:
        proto.stats[k] = 0
    with TestClient(proto.build_app(), raise_server_exceptions=False) as c:
        yield c
    # Aucune fuite : toutes les connexions empruntées sont revenues au pool.
    assert len(pool._used) == 0


def labels(sql):
    return sorted(r[0] for r in sql("SELECT label FROM spike_item"))


def audits(sql):
    return sorted(r[0] for r in sql("SELECT detail FROM spike_audit"))


def test_route_sync_utilise_la_connexion_du_middleware(client, sql):
    """La route sync reçoit la connexion enveloppée du middleware et son travail est validé."""
    resp = client.post("/sync/a")
    assert resp.status_code == 200
    assert resp.json()["same"] is True
    assert labels(sql) == ["a"]


def test_meme_pid_route_et_middleware(pool, sql):
    """Le pid vu par la route (sync et async) est celui que le middleware a emprunté."""
    seen = {}
    orig = proto.TransactionMiddleware._write_audit_and_commit

    def spy(self, tx, request):
        with tx._real.cursor() as cur:
            cur.execute("SELECT pg_backend_pid()")
            seen["mw"] = cur.fetchone()[0]
        return orig(self, tx, request)

    proto.TransactionMiddleware._write_audit_and_commit = spy
    try:
        with TestClient(proto.build_app()) as c:
            pid_sync = c.post("/sync/x").json()["pid"]
            mw_sync = seen["mw"]
            pid_async = c.post("/async/y").json()["pid"]
            mw_async = seen["mw"]
    finally:
        proto.TransactionMiddleware._write_audit_and_commit = orig
    assert pid_sync == mw_sync
    assert pid_async == mw_async


def test_commit_du_repo_est_differe(pool, sql):
    """Pendant la route, après le commit() du repo, une autre connexion ne voit rien."""
    app = proto.build_app()
    vu_pendant = {}

    @app.post("/probe")
    def probe():
        proto.repo_insert("p")
        vu_pendant["autre_connexion"] = sql("SELECT count(*) FROM spike_item")[0][0]
        proto.tx_connection().events.append({"detail": "probe"})
        return {}

    with TestClient(app) as c:
        assert c.post("/probe").status_code == 200
    assert vu_pendant["autre_connexion"] == 0
    assert proto.stats["fake_commits"] >= 1
    assert labels(sql) == ["p"]  # validé ensuite, par le middleware


def test_audit_et_mutation_valides_ensemble(client, sql):
    assert client.post("/sync/m").status_code == 200
    assert labels(sql) == ["m"]
    assert audits(sql) == ["created m"]


def test_exception_de_route_annule_tout(client, sql):
    resp = client.post("/boom/e")
    assert resp.status_code == 500
    assert labels(sql) == []
    assert audits(sql) == []


def test_http_exception_annule_tout(client, sql):
    assert client.post("/http-error/h").status_code == 409
    assert labels(sql) == []
    assert audits(sql) == []


def test_exception_du_repo_relevee_annule_tout(client, sql):
    assert client.post("/repo-fails/r").status_code == 500
    assert labels(sql) == []
    assert audits(sql) == []


def test_echec_de_laudit_annule_la_mutation(pool, sql):
    mauvais = "INSERT INTO spike_audit (path, detail) VALUES (%s, NULL)"  # NOT NULL violé
    with TestClient(proto.build_app(audit_sql=mauvais), raise_server_exceptions=False) as c:
        resp = c.post("/sync/f")
        assert resp.status_code == 500
        assert labels(sql) == []
        assert audits(sql) == []
        assert len(pool._used) == 0


def test_requetes_simultanees_connexions_distinctes(pool, sql):
    """Deux POST réellement simultanés (barrière dans la route) : pids distincts."""
    barrier = threading.Barrier(2)
    results = []

    with TestClient(proto.build_app(barrier=barrier)) as c:

        def call():
            results.append(c.post("/rendezvous").json())

        threads = [threading.Thread(target=call) for _ in range(2)]
        [t.start() for t in threads]
        [t.join(timeout=20) for t in threads]
    assert len(results) == 2
    assert results[0]["pid"] != results[1]["pid"]
    assert results[0]["conn_id"] != results[1]["conn_id"]
    assert len(pool._used) == 0


def test_rafale_concurrente_sans_melange_ni_fuite(pool, sql):
    """12 requêtes en 4 threads sur un pool de 4 : chaque ligne et son audit restent liés."""
    with TestClient(proto.build_app()) as c:
        errors = []

        def work(n):
            for i in range(3):
                r = c.post(f"/sync/t{n}-{i}")
                if r.status_code != 200:
                    errors.append(r.status_code)

        threads = [threading.Thread(target=work, args=(n,)) for n in range(4)]
        [t.start() for t in threads]
        [t.join(timeout=30) for t in threads]
    assert errors == []
    assert len(labels(sql)) == 12
    assert len(audits(sql)) == 12
    assert len(pool._used) == 0


def test_get_sans_transaction(client, sql):
    body = client.get("/read").json()
    assert body["tx"] is False
    assert body["wrapped"] is False
    assert proto.stats["tx_opened"] == 0
    assert body["used_in_pool"] == 1  # seulement la connexion de la route elle-même


def test_plusieurs_repos_dans_une_route(client, sql):
    resp = client.post("/multi/p")
    assert resp.status_code == 200
    assert resp.json()["count"] == 2  # le 3e repo voit les écritures non validées des deux autres
    assert labels(sql) == ["p-a", "p-b"]
    assert proto.stats["fake_releases"] >= 3


def test_rollback_repo_au_milieu_mode_naif_perd_le_travail_precedent(pool, sql):
    """Piège : un rollback() réel d'un repo efface aussi les écritures des repos d'avant."""
    with TestClient(proto.build_app(mode="naive"), raise_server_exceptions=False) as c:
        resp = c.post("/mid-rollback/n")
    # Réponse 200 alors que "n-avant" a disparu : perte silencieuse.
    assert resp.status_code == 200
    assert labels(sql) == ["n-apres"]


def test_rollback_repo_au_milieu_mode_savepoint_isole_le_repo(client, sql):
    """Avec un SAVEPOINT par emprunt, seul le travail du repo fautif est annulé."""
    resp = client.post("/mid-rollback/s")
    assert resp.status_code == 200
    assert labels(sql) == ["s-apres", "s-avant"]
    assert audits(sql) == ["mid s"]


def test_repo_qui_avale_lerreur_mode_savepoint(client, sql):
    resp = client.post("/swallow/w")
    assert resp.status_code == 200
    assert labels(sql) == ["w-apres", "w-avant"]


def test_repo_qui_avale_lerreur_mode_naif(pool, sql):
    with TestClient(proto.build_app(mode="naive"), raise_server_exceptions=False) as c:
        assert c.post("/swallow/w").status_code == 200
    assert labels(sql) == ["w-apres"]  # w-avant perdu


def test_contextvar_pose_par_la_route_ne_remonte_pas(client):
    """Piège : le middleware et la route sont dans des tâches distinctes (copie du contexte)."""
    assert client.post("/marker").status_code == 200
    assert proto.route_marker.get() is None  # et le middleware ne le verrait pas non plus


def test_background_task_apres_la_transaction(client, sql):
    """La tâche de fond s'exécute après validation : elle n'est plus dans la transaction."""
    resp = client.post("/background/b")
    assert resp.status_code == 200
    # Repli du prototype : transaction fermée -> connexion propre du pool, commit réel
    # par le repo lui-même (hors audit, hors atomicité).
    assert labels(sql) == ["b-route", "b-tache"]
    assert audits(sql) == ["bg"]


def test_streaming_ecrit_apres_la_validation(client, sql):
    resp = client.post("/stream/s")
    assert resp.status_code == 200
    assert resp.content == b"debut;fin"
    assert labels(sql) == ["s-flux", "s-route"]
    # "s-flux" a été écrit hors transaction (cf. rapport) : aucun audit ne le couvre.


def test_pool_epuise_donne_une_erreur_propre_et_sans_fuite(client, sql, pool):
    """Pool de 4 : quatre connexions retenues, le POST échoue (500) sans rien laisser."""
    tenues = [db.get_connection() for _ in range(4)]
    try:
        resp = client.post("/sync/z")
        assert resp.status_code == 500
    finally:
        for c in tenues:
            db.release_connection(c)
    assert labels(sql) == []
    assert len(pool._used) == 0
    assert client.post("/sync/z").status_code == 200  # le pool se rétablit


def test_pool_epuise_par_requetes_longues_simultanees(pool, sql):
    """5 POST de 0,5 s sur un pool de 4 : une requête au moins échoue, aucune fuite."""
    codes = []
    with TestClient(proto.build_app(), raise_server_exceptions=False) as c:

        def call(n):
            codes.append(c.post(f"/slow/{n}").status_code)

        threads = [threading.Thread(target=call, args=(n,)) for n in range(6)]
        [t.start() for t in threads]
        [t.join(timeout=30) for t in threads]
    assert codes.count(200) <= 4
    assert 500 in codes
    assert len(pool._used) == 0
    assert len(labels(sql)) == codes.count(200)
