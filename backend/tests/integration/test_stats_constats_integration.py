"""Indicateurs des constats sur vraie base (DIR-01, ADR 0044).

Les constats sont créés par l'API puis datés en 2035 (base jetable) pour isoler la période.
"""

import secrets

import pytest

from api.limiter import limiter
from tests.integration.test_cst02_constat_integration import (
    CHOIX_PRE,
    CHOIX_PRO,
    CHOIX_SANS_TYPE,
    _constat,
    _corriger,
    _data,
    _idee,
    _intervention,
)

pytestmark = pytest.mark.integration

URL = "/stats/constats"
PERIODE = {"start_date": "2035-01-01", "end_date": "2035-03-31"}
CHOIX_RIEN = ["NOTHING", "SIGNAL_NONE", "PART_PLC"]
CHOIX_FORMATION_ET_TACHE = [
    "TRAINING",
    "TASK",
    "FREQ_MONTHLY",
    "DOM_ELECTRICAL",
    "SIGNAL_NONE",
    "PART_PLC",
]


@pytest.fixture(autouse=True)
def _sans_limiteur(monkeypatch):
    monkeypatch.setattr(limiter, "enabled", False)


def _dater(instance, constat, jour):
    """Date le constat (version d'origine) au jour donné ; il n'a pas toujours de demande."""
    instance.sql(
        "UPDATE constat SET created_at = %s WHERE id = %s", (f"{jour} 10:00+00", constat["id"])
    )


def _creer(client, admin, instance, choix, jour):
    intervention_id, machine_id = _intervention(client, admin)
    r = _constat(client, admin, intervention_id, choix)
    assert r.status_code in (200, 201), r.text
    constat = _data(r)
    _dater(instance, constat, jour)
    return constat, machine_id


def _par_code(lignes):
    return {x["code"]: x for x in lignes}


@pytest.fixture(scope="module")
def jeu(client, admin, instance):
    """Six constats dans la période (une correction, un rattaché, deux sans demande), un hors."""
    a, _ = _creer(client, admin, instance, CHOIX_PRE, "2035-01-15")
    b, _ = _creer(client, admin, instance, CHOIX_PRO, "2035-01-20")
    c, machine = _creer(client, admin, instance, CHOIX_FORMATION_ET_TACHE, "2035-03-05")
    d, _ = _creer(client, admin, instance, CHOIX_PRE, "2035-02-10")
    e, _ = _creer(client, admin, instance, CHOIX_RIEN, "2035-01-25")  # sans demande
    f, _ = _creer(client, admin, instance, CHOIX_SANS_TYPE, "2035-03-10")  # sans demande
    assert e["request_id"] is None and f["request_id"] is None
    _creer(client, admin, instance, CHOIX_PRE, "2036-06-01")  # hors période
    # Correction de b : même demande, une 2e version datée plus tard, sans changer mois ni total
    r = _corriger(client, admin, b["id"], CHOIX_PRE)
    assert r.status_code in (200, 201), r.text
    instance.sql(
        "UPDATE constat SET created_at = '2035-02-25 10:00+00' WHERE supersedes_id = %s",
        (b["id"],),
    )
    # Rattachement de c à une idée ouverte de sa machine
    idee = _idee(client, admin, machine)
    r = client.post(f"/constats/{c['id']}/link", json={"request_id": idee}, headers=admin.headers)
    assert r.status_code == 200, r.text
    return a, b, c, d


def _get(client, headers, **params):
    r = client.get(URL, params=params or PERIODE, headers=headers)
    assert r.status_code == 200, r.text
    return r.json()


def test_total_et_mois_dont_ceux_a_zero(client, admin, jeu):
    d = _get(client, admin.headers)
    assert d["period"] == PERIODE
    assert d["total"] == 6
    assert d["by_month"] == [
        {"month": "2035-01", "count": 3},
        {"month": "2035-02", "count": 1},
        {"month": "2035-03", "count": 2},
    ]


def test_mois_a_zero_present(client, admin, jeu):
    d = _get(client, admin.headers, start_date="2034-11-01", end_date="2035-01-31")
    assert d["by_month"] == [
        {"month": "2034-11", "count": 0},
        {"month": "2034-12", "count": 0},
        {"month": "2035-01", "count": 3},
    ]


def test_choix_comptes_sur_la_version_courante(client, admin, jeu):
    d = _get(client, admin.headers)
    leviers = _par_code(d["levers"])
    # a, d, c et la version corrigée de b (PRE) ; c et f (formation) ; plus aucun projet
    assert leviers["TASK"]["count"] == 4 and leviers["TASK"]["suggested_type_inter"] == "PRE"
    assert leviers["TRAINING"]["count"] == 2
    assert leviers["NOTHING"]["count"] == 1  # constat sans demande, compté dans les leviers
    assert leviers["PROJECT"]["count"] == 0  # choix actif à 0 présent
    assert _par_code(d["signals"])["SIGNAL_SEEN"]["count"] == 3
    assert _par_code(d["signals"])["SIGNAL_NONE"]["count"] == 3
    assert _par_code(d["known_since"])["SINCE_LT_1M"]["count"] == 0
    ordre = [x["code"] for x in d["known_since"]]
    assert ordre[0] == "SINCE_NEVER" and "SINCE_GT_3M" in ordre


def test_devenir_des_demandes_avec_rattachee(client, admin, jeu):
    d = _get(client, admin.headers)
    assert [o["code"] for o in d["outcomes"]] == [
        "nouvelle",
        "en_attente",
        "acceptee",
        "cloturee",
        "rejetee",
        "rattachee",
    ]
    o = _par_code(d["outcomes"])
    # Quatre constats avec demande : les deux sans demande ne sont pas des devenirs
    assert (o["nouvelle"]["count"], o["rattachee"]["count"], o["rejetee"]["count"]) == (3, 1, 0)
    assert sum(x["count"] for x in d["outcomes"]) == 4
    assert o["rattachee"]["label"] == "Rattachée à une idée"
    assert o["rattachee"]["color"] == o["rejetee"]["color"] and o["rejetee"]["color"]
    assert o["acceptee"]["count"] == 0


def test_choix_inactif_visible_seulement_avec_des_reponses(client, admin, jeu, instance):
    instance.sql("UPDATE constat_choice SET is_active = false WHERE code IN ('TRAINING', 'OTHER')")
    try:
        leviers = _par_code(_get(client, admin.headers)["levers"])
        assert "TRAINING" in leviers and "OTHER" not in leviers
    finally:
        instance.sql(
            "UPDATE constat_choice SET is_active = true WHERE code IN ('TRAINING', 'OTHER')"
        )


def test_constat_sans_demande_date_par_la_premiere_version_de_sa_chaine(client, admin, instance):
    constat, _ = _creer(client, admin, instance, CHOIX_RIEN, "2037-01-10")
    # Correction vers un levier générateur : la demande naît, le constat garde son mois
    r = _corriger(client, admin, constat["id"], CHOIX_PRE)
    assert r.status_code == 201, r.text
    d = _get(client, admin.headers, start_date="2037-01-01", end_date="2037-03-31")
    assert d["total"] == 1
    assert [m["count"] for m in d["by_month"]] == [1, 0, 0]
    assert _par_code(d["levers"])["NOTHING"]["count"] == 0  # version courante : TASK
    assert _par_code(d["levers"])["TASK"]["count"] == 1
    assert _par_code(d["outcomes"])["nouvelle"]["count"] == 1


def test_periode_sans_constat(client, admin):
    d = _get(client, admin.headers, start_date="2040-01-01", end_date="2040-02-29")
    assert d["total"] == 0 and [m["count"] for m in d["by_month"]] == [0, 0]
    assert all(x["count"] == 0 for x in d["levers"] + d["signals"] + d["outcomes"])


def test_periode_invalide_sans_message_brut(client, admin):
    inversee = client.get(
        URL, params={"start_date": "2035-02-01", "end_date": "2035-01-01"}, headers=admin.headers
    )
    longue = client.get(
        URL, params={"start_date": "2010-01-01", "end_date": "2034-01-01"}, headers=admin.headers
    )
    assert (inversee.status_code, longue.status_code) == (400, 400)
    for r in (inversee, longue):
        assert "psycopg2" not in r.text and "SELECT" not in r.text


def test_aucun_auteur_dans_la_reponse(client, admin, jeu):
    texte = client.get(URL, params=PERIODE, headers=admin.headers).text
    for mot in ("created_by", "author", "tech_id", admin.id):
        assert mot not in texte


def test_droits_par_role(client, admin, make_user, grant, instance):
    for role in ("TECH", "RESP", "ACHETEUR"):
        assert client.get(URL, headers=make_user(role).headers).status_code == 200, role
    code = instance.sql(
        "SELECT code FROM tunnel_endpoint WHERE method = 'GET' AND path = '/stats/constats'"
    )
    assert code == [("stats:get_constats",)]
    tech = make_user("TECH")
    grant("TECH", "GET", "/stats/constats", allowed=False)
    assert client.get(URL, headers=tech.headers).status_code == 403


def test_lisible_par_une_cle_mcp(client, admin):
    cle = client.post(
        "/api-keys", headers=admin.headers, json={"name": f"it-{secrets.token_hex(3)}"}
    )
    assert cle.status_code == 201, cle.text
    assert client.get(URL, headers={"X-API-Key": cle.json()["secret"]}).status_code == 200
