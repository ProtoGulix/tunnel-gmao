"""Tableau de bord d'un équipement et filtres de GET /interventions sur vraie base (TDB-01).

Les données sont posées en SQL propriétaire sur des équipements neufs : les agrégats
sont comparés à des valeurs calculées à la main.
"""

import secrets
from uuid import uuid4

import pytest

from api.limiter import limiter

pytestmark = pytest.mark.integration

DEBUT, FIN = "2033-01-01", "2033-03-31"


@pytest.fixture(autouse=True)
def _sans_limiteur(monkeypatch):
    monkeypatch.setattr(limiter, "enabled", False)


def _machine(instance, parent=None):
    return str(
        instance.sql(
            "INSERT INTO machine (code, name, equipement_mere) VALUES (%s, 'Presse TDB', %s) "
            "RETURNING id",
            (f"TDB-{secrets.token_hex(3)}", parent),
        )[0][0]
    )


def _intervention(instance, machine, type_inter, reported, status, printed=False, closed_on=None):
    """Insère une intervention ; closed_on pose le passage à 'ferme' dans le journal."""
    iid = str(
        instance.sql(
            "INSERT INTO intervention (title, machine_id, type_inter, tech_initials, "
            "status_actual, reported_date, printed_fiche) VALUES ('TDB', %s, %s, %s, %s, %s, %s) "
            "RETURNING id",
            (machine, type_inter, secrets.token_hex(3).upper(), status, reported, printed),
        )[0][0]
    )
    if closed_on:
        instance.sql(
            "INSERT INTO intervention_status_log (id, status_from, status_to, intervention_id, date) "
            "VALUES (%s, 'ouvert', 'ferme', %s, %s)",
            (str(uuid4()), iid, closed_on),
        )
    return iid


def _action(instance, iid, created, hours, score=None, factor=None, subcategory=None):
    instance.sql(
        "INSERT INTO intervention_action (intervention_id, created_at, time_spent, "
        "complexity_score, complexity_factor, action_subcategory) "
        "VALUES (%s, %s, %s, %s, %s, %s)",
        (iid, created, hours, score, factor, subcategory),
    )


def _sous_categorie(instance, code, name, color):
    cat = instance.sql(
        "INSERT INTO action_category (name, code, color) VALUES (%s, %s, %s) RETURNING id",
        (name, code, color),
    )[0][0]
    return instance.sql(
        "INSERT INTO action_subcategory (category_id, name, code) VALUES (%s, %s, %s) RETURNING id",
        (cat, f"sous {name}", f"S{code}"),
    )[0][0]


@pytest.fixture
def parc(instance):
    """Parent P et fille C, avec interventions et actions connues (voir commentaires)."""
    suffixe = secrets.token_hex(2).upper()
    p = _machine(instance)
    c = _machine(instance, p)
    s1 = _sous_categorie(instance, f"K1{suffixe}", f"Mécanique {suffixe}", "blue")
    s2 = _sous_categorie(instance, f"K2{suffixe}", f"Électrique {suffixe}", "red")
    # P : I1 curatif archivé fermé le 15/01 (délai 5 j), I2 préventif ouvert en mars.
    i1 = _intervention(instance, p, "CUR", "2033-01-10", "ferme", True, "2033-01-15 10:00:00")
    i2 = _intervention(instance, p, "PRE", "2033-03-05", "ouvert")
    # C : I3 curatif fermé le 10/03 (délai 49 j), I4 de type inconnu ouvert, I5 hors période.
    i3 = _intervention(instance, c, "CUR", "2033-01-20", "ferme", False, "2033-03-10 08:00:00")
    i4 = _intervention(instance, c, "ZZZ", "2033-02-02", "ouvert")
    _intervention(instance, c, "CUR", "2032-12-31", "ouvert")
    _action(instance, i1, "2033-01-11 09:00:00+00", 1.5, 3, "DIAG", s1)
    _action(instance, i1, "2033-01-12 09:00:00+00", 0.5, 5, "DIAG", s1)
    _action(instance, i1, "2032-12-01 09:00:00+00", 9, 1, None, s1)  # hors période
    _action(instance, i2, None, 2)  # created_at nul : date de l'intervention (mars)
    _action(instance, i3, "2033-02-10 09:00:00+00", 4, 2, "ACC", s2)
    return {"p": p, "c": c, "i4": i4, "cat1": f"K1{suffixe}", "cat2": f"K2{suffixe}"}


def _dashboard(client, headers, equipement, **params):
    r = client.get(
        f"/equipements/{equipement}/dashboard",
        params={"start_date": DEBUT, "end_date": FIN, **params},
        headers=headers,
    )
    assert r.status_code == 200, r.text
    return r.json()["data"]


def _par_code(rows, key="code"):
    return {r[key]: r for r in rows}


def test_dashboard_equipement_seul(client, admin, parc):
    d = _dashboard(client, admin.headers, parc["p"])

    assert d["period"] == {"start": DEBUT, "end": FIN}
    assert d["scope"] == {
        "equipement_id": parc["p"],
        "include_descendants": False,
        "equipement_count": 1,
    }
    assert d["kpis"] == {
        "interventions_reported": 2,  # I1 (archivée comprise) et I2
        "interventions_closed": 1,
        "interventions_open_now": 1,
        "time_spent_hours": 4.0,  # 1,5 + 0,5 + 2 ; l'action de décembre 2032 est exclue
        "actions_count": 3,
        "avg_complexity": 4.0,  # (3 + 5) / 2 : l'action sans score n'entre pas
        "avg_close_delay_days": 5.0,
    }
    mois = {m["month"]: m for m in d["monthly"]}
    assert list(mois) == ["2033-01", "2033-02", "2033-03"]
    assert (mois["2033-01"]["reported"], mois["2033-01"]["closed"]) == (1, 1)
    assert mois["2033-01"]["reported_by_type"]["CUR"] == 1
    assert mois["2033-01"]["time_spent_hours"] == 2.0 and mois["2033-01"]["avg_complexity"] == 4.0
    # Mois vide : présent, comptes à zéro, moyenne null (jamais 0)
    assert mois["2033-02"]["reported"] == 0 and mois["2033-02"]["avg_complexity"] is None
    assert mois["2033-02"]["time_spent_hours"] == 0.0
    assert mois["2033-03"]["reported_by_type"]["PRE"] == 1
    assert mois["2033-03"]["time_spent_hours"] == 2.0 and mois["2033-03"]["avg_complexity"] is None

    types = _par_code(d["by_type"])
    assert len(d["by_type"]) == 8 and None not in types
    assert (types["CUR"]["count"], types["CUR"]["time_spent_hours"]) == (1, 2.0)
    assert (types["PRE"]["count"], types["PRE"]["time_spent_hours"]) == (1, 2.0)
    assert types["CUR"]["label"] == "Curatif" and types["REA"]["count"] == 0

    cats = _par_code(d["by_action_category"])
    assert cats[parc["cat1"]]["actions_count"] == 2
    assert cats[parc["cat1"]]["time_spent_hours"] == 2.0
    assert cats[None]["name"] == "Non renseigné" and cats[None]["actions_count"] == 1
    assert cats[None]["time_spent_hours"] == 2.0

    facteurs = _par_code(d["by_complexity_factor"])
    assert set(facteurs) == {"DIAG"} and facteurs["DIAG"]["count"] == 2
    assert facteurs["DIAG"]["label"].startswith("Diagnostic")


def test_dashboard_avec_descendants(client, admin, parc):
    d = _dashboard(client, admin.headers, parc["p"], include_descendants="true")

    assert d["scope"]["equipement_count"] == 2 and d["scope"]["include_descendants"] is True
    kpis = d["kpis"]
    assert kpis["interventions_reported"] == 4  # I1, I2, I3, I4 (I5 est hors période)
    assert kpis["interventions_closed"] == 2
    assert kpis["interventions_open_now"] == 3  # I2, I4 et I5 : l'état actuel ignore la période
    assert kpis["time_spent_hours"] == 8.0 and kpis["actions_count"] == 4
    assert kpis["avg_complexity"] == 3.33  # (3 + 5 + 2) / 3
    assert kpis["avg_close_delay_days"] == 27.0  # (5 + 49) / 2
    mois = {m["month"]: m for m in d["monthly"]}
    assert mois["2033-02"]["reported"] == 1 and mois["2033-02"]["time_spent_hours"] == 4.0
    assert mois["2033-03"]["closed"] == 1
    assert mois["2033-02"]["reported_by_type"]["null"] == 1

    types = _par_code(d["by_type"])
    assert (types["CUR"]["count"], types["CUR"]["time_spent_hours"]) == (2, 6.0)
    # Type inconnu du référentiel : code null et libellé « Non renseigné », pas omis
    assert types[None]["label"] == "Non renseigné" and types[None]["count"] == 1
    assert _par_code(d["by_action_category"])[parc["cat2"]]["actions_count"] == 1
    assert _par_code(d["by_complexity_factor"])["ACC"]["count"] == 1


def test_dashboard_equipement_sans_donnee(client, admin, instance):
    d = _dashboard(client, admin.headers, _machine(instance))

    assert d["kpis"] == {
        "interventions_reported": 0,
        "interventions_closed": 0,
        "interventions_open_now": 0,
        "time_spent_hours": 0.0,
        "actions_count": 0,
        "avg_complexity": None,
        "avg_close_delay_days": None,
    }
    assert len(d["monthly"]) == 3 and all(m["avg_complexity"] is None for m in d["monthly"])
    assert d["by_action_category"] == [] and d["by_complexity_factor"] == []
    assert all(t["count"] == 0 for t in d["by_type"])


def test_dashboard_periode_par_defaut_douze_mois(client, admin, instance):
    r = client.get(f"/equipements/{_machine(instance)}/dashboard", headers=admin.headers)
    assert r.status_code == 200, r.text
    assert len(r.json()["data"]["monthly"]) == 12


def test_dashboard_erreurs_sans_message_brut(client, admin, instance):
    machine = _machine(instance)
    url = f"/equipements/{machine}/dashboard"
    inversee = client.get(url, params={"start_date": FIN, "end_date": DEBUT}, headers=admin.headers)
    longue = client.get(
        url, params={"start_date": "2010-01-01", "end_date": "2033-01-01"}, headers=admin.headers
    )
    inconnu = client.get(f"/equipements/{uuid4()}/dashboard", headers=admin.headers)
    invalide = client.get("/equipements/pas-un-uuid/dashboard", headers=admin.headers)

    assert (inversee.status_code, longue.status_code) == (400, 400)
    assert inconnu.status_code == 404
    assert invalide.status_code == 400
    for r in (inversee, longue, inconnu, invalide):
        assert "psycopg2" not in r.text and "SELECT" not in r.text


def test_dashboard_droits_par_role(client, admin, make_user, grant, instance):
    machine = _machine(instance)
    url = f"/equipements/{machine}/dashboard"
    tech = make_user("TECH")
    assert client.get(url, headers=tech.headers).status_code == 200

    code = instance.sql(
        "SELECT code FROM tunnel_endpoint WHERE method = 'GET' "
        "AND path = '/equipements/{equipement_id}/dashboard'"
    )
    assert code == [("equipements:get_equipement_dashboard",)]

    grant("TECH", "GET", "/equipements/{equipement_id}/dashboard", allowed=False)
    assert client.get(url, headers=tech.headers).status_code == 403


def test_dashboard_lisible_par_une_cle_mcp(client, admin, instance):
    cle = client.post(
        "/api-keys", headers=admin.headers, json={"name": f"it-{secrets.token_hex(3)}"}
    )
    assert cle.status_code == 201, cle.text
    url = f"/equipements/{_machine(instance)}/dashboard"
    assert client.get(url, headers={"X-API-Key": cle.json()["secret"]}).status_code == 200


# --- Filtres de GET /interventions ---


def _liste(client, headers, **params):
    r = client.get("/interventions", params={"limit": 1000, **params}, headers=headers)
    assert r.status_code == 200, r.text
    return r.json()


def test_interventions_filtre_type_et_dates(client, admin, parc):
    # Sans printed : actives seulement (comportement inchangé), I1 archivée est donc absente.
    base = {"equipement_id": parc["p"], "include_descendants": "true"}
    sans_filtre = _liste(client, admin.headers, **base)["pagination"]["total"]
    cur = _liste(client, admin.headers, **{**base, "type_inter": "CUR"})
    pre_zzz = _liste(client, admin.headers, **{**base, "type_inter": "PRE"})
    fenetre = _liste(
        client,
        admin.headers,
        **{**base, "reported_from": "2033-01-20", "reported_to": "2033-02-02"},
    )

    def types(rep):
        return sorted(i["type_inter"] for i in rep["items"])

    assert types(cur) == ["CUR", "CUR"]  # I5 (30/12/2032) et I3 ; I1 est archivée
    assert types(pre_zzz) == ["PRE"]
    assert types(fenetre) == ["CUR", "ZZZ"]  # bornes incluses : I3 (20/01) et I4 (02/02)
    assert sans_filtre == 4  # I2, I3, I4, I5


def test_interventions_filtre_type_invalide_en_400(client, admin):
    r = client.get("/interventions", params={"type_inter": "CUR,XXX"}, headers=admin.headers)
    assert r.status_code == 400
    r = client.get(
        "/interventions",
        params={"reported_from": "2033-02-01", "reported_to": "2033-01-01"},
        headers=admin.headers,
    )
    assert r.status_code == 400
