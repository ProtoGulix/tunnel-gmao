"""Bilan des demandes sur vraie base (ADB-01, ADR 0046).

Chaque test travaille dans un site (équipement racine) neuf : le filtre `site_id` isole le jeu
des autres demandes de la base jetable. Les dates sont posées par SQL, relatives à aujourd'hui.
"""

import secrets
from datetime import date, timedelta

import pytest

from api.limiter import limiter
from tests.integration.test_cst02_constat_integration import _data

pytestmark = pytest.mark.integration

URL = "/stats/demandes"


@pytest.fixture(autouse=True)
def _sans_limiteur(monkeypatch):
    monkeypatch.setattr(limiter, "enabled", False)


def _equipement(client, admin, parent_id=None):
    body = {"name": f"Eq demandes {secrets.token_hex(3)}"}
    if parent_id:
        body["parent_id"] = parent_id
    r = client.post("/equipements", json=body, headers=admin.headers)
    assert r.status_code in (200, 201), r.text
    return _data(r)["id"]


def _demande(client, admin, machine_id):
    r = client.post(
        "/intervention-requests",
        json={"machine_id": machine_id, "demandeur_nom": "Atelier", "description": "Panne"},
        headers=admin.headers,
    )
    assert r.status_code in (200, 201), r.text
    return _data(r)["id"]


def _lundi(decalage_semaines=0):
    today = date.today()
    return today - timedelta(days=today.weekday()) - timedelta(weeks=decalage_semaines)


def _dater(instance, demande_id, created_at):
    """Date la création (demande et ligne « nouvelle » du journal)."""
    instance.sql(
        "UPDATE intervention_request SET created_at = %s WHERE id = %s", (created_at, demande_id)
    )
    instance.sql(
        "UPDATE request_status_log SET date = %s WHERE request_id = %s AND status_to = 'nouvelle'",
        (created_at, demande_id),
    )


def _sortir(instance, demande_id, statut, quand):
    """Sortie par le déclencheur de journal, puis date de la ligne de sortie posée à `quand`."""
    instance.sql("UPDATE intervention_request SET statut = %s WHERE id = %s", (statut, demande_id))
    instance.sql(
        "UPDATE request_status_log SET date = %s WHERE request_id = %s AND status_to = %s",
        (quand, demande_id, statut),
    )


def _bilan(client, admin, **params):
    r = client.get(URL, params=params, headers=admin.headers)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def jeu(client, admin, instance):
    """Un site, une ligne enfant, cinq demandes datées sur deux semaines."""
    site = _equipement(client, admin)
    ligne = _equipement(client, admin, site)
    presse = _equipement(client, admin, ligne)
    autre_site = _equipement(client, admin)
    w1 = _lundi(1)  # semaine passée
    w0 = _lundi(0)  # semaine courante
    ids = {}
    # a : créée semaine passée, acceptée cette semaine ; b : créée semaine passée, rejetée
    # semaine passée ; c : créée semaine passée, reste en stock (âge 40 j) ; d : créée cette
    # semaine, en stock ; e : sur un autre site, en stock.
    for nom, machine in (
        ("a", presse),
        ("b", ligne),
        ("c", presse),
        ("d", site),
        ("e", autre_site),
    ):
        ids[nom] = _demande(client, admin, machine)
    _dater(instance, ids["a"], f"{w1} 10:00+00")
    _dater(instance, ids["b"], f"{w1} 11:00+00")
    _dater(instance, ids["c"], f"{date.today() - timedelta(days=40)} 08:00+00")
    _dater(instance, ids["d"], f"{w0} 00:30+00")
    _dater(instance, ids["e"], f"{w1} 12:00+00")
    _sortir(instance, ids["b"], "rejetee", f"{w1} 15:00+00")
    _sortir(instance, ids["a"], "acceptee", f"{w0} 00:45+00")
    return {"site": site, "autre": autre_site, "presse": presse, "ligne": ligne, "ids": ids}


def test_flux_sur_un_jeu_date(client, admin, jeu):
    bilan = _bilan(client, admin, site_id=jeu["site"], weeks=2)
    passee, courante = bilan["flow"]
    assert passee["week_start"] == str(_lundi(1)) and courante["week_start"] == str(_lundi(0))
    # c (40 j) date d'avant la fenêtre ou de sa première semaine selon le jour : on ne compte
    # donc que a, b et d.
    assert passee["rejected"] == 1 and passee["accepted"] == 0
    assert courante["accepted"] == 1 and courante["rejected"] == 0
    assert courante["created"] == 1  # d
    assert bilan["weeks"] == 2


def test_stock_courant_egal_stock_end_et_tranches_et_sites(client, admin, jeu):
    bilan = _bilan(client, admin, site_id=jeu["site"], weeks=4)
    assert bilan["stock"] == 2  # c et d
    assert bilan["flow"][-1]["stock_end"] == bilan["stock"]
    assert sum(b["count"] for b in bilan["age_buckets"]) == bilan["stock"]
    assert sum(s["count"] for s in bilan["sites"]) == bilan["stock"]
    assert bilan["journal_gaps"] == 0


def test_stock_sans_filtre_coherent(client, admin, jeu, instance):
    bilan = _bilan(client, admin, weeks=3)
    reel = instance.sql(
        "SELECT count(*) FROM intervention_request WHERE statut IN ('nouvelle', 'en_attente')"
    )[0][0]
    assert bilan["stock"] == reel == bilan["flow"][-1]["stock_end"]
    assert sum(b["count"] for b in bilan["age_buckets"]) == reel
    assert sum(s["count"] for s in bilan["sites"]) == reel


def test_tranche_de_40_jours_et_ou(client, admin, jeu):
    bilan = _bilan(client, admin, site_id=jeu["site"])
    tranches = {b["code"]: b for b in bilan["age_buckets"]}
    assert tranches["30_90"]["count"] == 1 and tranches["30_90"]["min_days"] == 40
    assert tranches["lt_7"]["count"] == 1
    (site,) = bilan["sites"]
    assert site["id"] == jeu["site"] and site["count"] == 2 and site["oldest_days"] == 40
    equip = {e["id"]: e for e in bilan["equipments"]}
    assert equip[jeu["presse"]]["count"] == 1 and equip[jeu["presse"]]["oldest_days"] == 40
    assert equip[jeu["site"]]["count"] == 1


def test_filtre_de_site_exclut_l_autre_site(client, admin, jeu):
    bilan = _bilan(client, admin, site_id=jeu["autre"])
    assert bilan["stock"] == 1
    assert [s["id"] for s in bilan["sites"]] == [jeu["autre"]]


def test_site_descendants_compris_depuis_un_sous_equipement(client, admin, jeu):
    bilan = _bilan(client, admin, site_id=jeu["ligne"])
    assert bilan["stock"] == 1  # c, sur la presse sous la ligne
    # Le site d'une demande reste l'équipement racine, même filtré par un sous-équipement
    assert [s["id"] for s in bilan["sites"]] == [jeu["site"]]


def test_top_equipements_limite_a_dix(client, admin, instance):
    site = _equipement(client, admin)
    for _ in range(12):
        _demande(client, admin, _equipement(client, admin, site))
    bilan = _bilan(client, admin, site_id=site)
    assert bilan["stock"] == 12 and len(bilan["equipments"]) == 10


def test_demande_supprimee_absente(client, admin, instance):
    site = _equipement(client, admin)
    machine = _equipement(client, admin, site)
    demande = _demande(client, admin, machine)
    _demande(client, admin, machine)
    assert _bilan(client, admin, site_id=site)["stock"] == 2
    instance.sql("DELETE FROM intervention_request WHERE id = %s", (demande,))
    bilan = _bilan(client, admin, site_id=site)
    assert bilan["stock"] == 1 and bilan["flow"][-1]["stock_end"] == 1
    assert bilan["journal_gaps"] == 0


def test_ecart_journal_signale_sans_fausser_le_stock(client, admin, instance):
    site = _equipement(client, admin)
    machine = _equipement(client, admin, site)
    demande = _demande(client, admin, machine)
    _demande(client, admin, machine)
    # Acceptée sans ligne de journal de sortie : écart compté, hors du stock
    instance.sql("ALTER TABLE intervention_request DISABLE TRIGGER USER")
    try:
        instance.sql(
            "UPDATE intervention_request SET statut = 'acceptee' WHERE id = %s", (demande,)
        )
    finally:
        instance.sql("ALTER TABLE intervention_request ENABLE TRIGGER USER")
    bilan = _bilan(client, admin, site_id=site)
    assert bilan["journal_gaps"] == 1
    assert bilan["stock"] == 1 and bilan["flow"][-1]["stock_end"] == 1
    assert bilan["flow"][-1]["accepted"] == 1  # repli sur la dernière mise à jour de la demande


def test_erreurs_sans_message_sql(client, admin):
    for params in ({"site_id": "pas-un-uuid"}, {"weeks": 0}, {"weeks": 99}):
        r = client.get(URL, params=params, headers=admin.headers)
        assert r.status_code == 400
        assert "psycopg2" not in r.text and "SELECT" not in r.text


def test_aucun_auteur_dans_la_reponse(client, admin, jeu):
    texte = client.get(URL, headers=admin.headers).text
    for mot in ("created_by", "author", "demandeur", admin.id):
        assert mot not in texte


def test_droits_par_role(client, admin, make_user, grant, instance):
    for role in ("TECH", "RESP", "ACHETEUR"):
        assert client.get(URL, headers=make_user(role).headers).status_code == 200, role
    code = instance.sql(
        "SELECT code FROM tunnel_endpoint WHERE method = 'GET' AND path = '/stats/demandes'"
    )
    assert code == [("stats:get_demandes",)]
    tech = make_user("TECH")
    grant("TECH", "GET", "/stats/demandes", allowed=False)
    assert client.get(URL, headers=tech.headers).status_code == 403


def test_lisible_par_une_cle_mcp(client, admin):
    cle = client.post(
        "/api-keys", headers=admin.headers, json={"name": f"it-{secrets.token_hex(3)}"}
    )
    assert cle.status_code == 201, cle.text
    assert client.get(URL, headers={"X-API-Key": cle.json()["secret"]}).status_code == 200
