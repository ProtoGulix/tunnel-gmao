"""Indicateurs d'organisation sur vraie base (ORG-01, ADR 0021).

Les données de la période sont posées en 2034, loin des autres tests ; les valeurs
attendues sont calculées à la main (voir le plan dans la fixture). Les indicateurs d'état
actuel (préventif, pièces) sont comparés avant/après avec des dates anciennes (1999).
"""

import secrets
from datetime import date

import pytest

from api.limiter import limiter

pytestmark = pytest.mark.integration

DEBUT, FIN = "2034-01-01", "2034-03-31"
URL = "/stats/organisation"
HEURES_VIDES = {"CUR": 0.0, "PRE": 0.0, "PRO": 0.0, "other": 0.0, "total": 0.0}


@pytest.fixture(autouse=True)
def _sans_limiteur(monkeypatch):
    monkeypatch.setattr(limiter, "enabled", False)


def _machine(instance):
    return str(
        instance.sql(
            "INSERT INTO machine (code, name) VALUES (%s, 'Presse ORG') RETURNING id",
            (f"ORG-{secrets.token_hex(3)}",),
        )[0][0]
    )


def _intervention(instance, machine, type_inter, reported, priority="normal", status="ouvert"):
    return str(
        instance.sql(
            "INSERT INTO intervention (title, machine_id, type_inter, tech_initials, "
            "status_actual, reported_date, priority) VALUES ('ORG', %s, %s, %s, %s, %s, %s) "
            "RETURNING id",
            (machine, type_inter, secrets.token_hex(3).upper(), status, reported, priority),
        )[0][0]
    )


def _mettre_en_attente_de_pieces(instance, iid):
    """Un déclencheur force 'ouvert' à l'insertion : le statut se pose par une mise à jour."""
    instance.sql("UPDATE intervention SET status_actual = 'attente_pieces' WHERE id = %s", (iid,))


def _action(instance, iid, tech, jour, heures=1.0):
    instance.sql(
        "INSERT INTO intervention_action (intervention_id, tech, created_at, time_spent) "
        "VALUES (%s, %s, %s, %s)",
        (iid, tech, f"{jour} 09:00:00+00", heures),
    )


@pytest.fixture
def equipe(instance, make_user):
    """Deux techniciens et des chantiers en janvier 2034 (J = janvier, M = mars).

    T1 : PRO1 10 et 20/01 ; PRE1 15 et 25/01 ; PRE2 12 et 18/01 ; PRE3 05 et 15/01 ;
         PRO3 deux actions le 26/01 ; urgence U1 le 15/01.
    T2 : PRO2 10 et 20/01 ; CUR non urgent C1 le 14/01 ; REA le 03/01 ; PRO4 le 29/03 et le 03/04.
    Coupés : PRO1 et PRE2 (urgence de T1 strictement entre les bornes). Non coupés : PRE1
    (urgence le premier jour), PRE3 (le dernier jour), PRO2 (CUR non urgent, urgence d'un
    autre technicien), PRO3 (un seul jour, ignoré).
    """
    t1, t2 = make_user("TECH").id, make_user("TECH").id
    m = _machine(instance)
    pro1 = _intervention(instance, m, "PRO", "2034-01-05")
    pre1 = _intervention(instance, m, "PRE", "2034-01-05")
    pre2 = _intervention(instance, m, "PRE", "2034-01-05")
    pre3 = _intervention(instance, m, "PRE", "2034-01-05")
    pro2 = _intervention(instance, m, "PRO", "2034-01-05")
    pro3 = _intervention(instance, m, "PRO", "2034-01-05")
    u1 = _intervention(instance, m, "CUR", "2034-01-15", priority="urgent")
    c1 = _intervention(instance, m, "CUR", "2034-01-14", priority="normale")
    rea = _intervention(instance, m, "REA", "2034-01-03")
    pro4 = _intervention(instance, m, "PRO", "2034-03-29")
    _intervention(instance, m, "CUR", "2033-12-20", priority="urgent")  # hors période
    for iid, jours in (
        (pro1, ("10", "20")),
        (pre1, ("15", "25")),
        (pre2, ("12", "18")),
        (pre3, ("05", "15")),
        (pro3, ("26", "26")),
    ):
        for j in jours:
            _action(instance, iid, t1, f"2034-01-{j}")
    _action(instance, u1, t1, "2034-01-15")
    for j in ("10", "20"):
        _action(instance, pro2, t2, f"2034-01-{j}")
    _action(instance, c1, t2, "2034-01-14", 0.5)
    _action(instance, rea, t2, "2034-01-03", 2.25)
    _action(instance, pro4, t2, "2034-03-29")
    _action(instance, pro4, t2, "2034-04-03")  # après la période : le chantier compte en mars
    return {"t1": t1, "t2": t2}


def _organisation(client, headers, **params):
    r = client.get(URL, params={"start_date": DEBUT, "end_date": FIN, **params}, headers=headers)
    assert r.status_code == 200, r.text
    return r.json()


def test_organisation_mois_totaux_et_projets(client, admin, equipe):
    d = _organisation(client, admin.headers)

    assert d["period"] == {"start": DEBUT, "end": FIN}
    mois = {m["month"]: m for m in d["monthly"]}
    assert list(mois) == ["2034-01", "2034-02", "2034-03"]  # tous les mois, même vides

    jan = mois["2034-01"]
    assert (jan["interventions_reported"], jan["urgent_count"]) == (9, 1)
    assert jan["urgent_share"] == 11.1  # 'normale' et 'normal' ne comptent pas ; U1 seule
    assert jan["hours"] == {"CUR": 1.5, "PRE": 6.0, "PRO": 6.0, "other": 2.25, "total": 15.75}
    assert (jan["chantiers_started"], jan["chantiers_interrupted"]) == (5, 2)
    assert jan["interrupted_share"] == 40.0
    # Journées-technicien : T1 en a 8 (dont le 15/01 à 3 interventions), T2 en a 4
    assert jan["tech_days"] == 12
    assert jan["avg_interventions_per_tech_day"] == 1.17  # 14 / 12
    assert jan["scattered_days_share"] == 8.3  # 1 / 12

    fev = mois["2034-02"]
    assert fev["interventions_reported"] == 0 and fev["hours"] == HEURES_VIDES
    assert fev["urgent_share"] is None and fev["interrupted_share"] is None
    assert fev["avg_interventions_per_tech_day"] is None and fev["scattered_days_share"] is None

    mar = mois["2034-03"]
    assert (mar["interventions_reported"], mar["urgent_share"]) == (1, 0.0)
    assert (mar["chantiers_started"], mar["chantiers_interrupted"]) == (1, 0)
    assert mar["interrupted_share"] == 0.0
    assert mar["hours"]["PRO"] == 1.0  # l'action du 03/04 est hors période
    assert (mar["tech_days"], mar["avg_interventions_per_tech_day"]) == (1, 1.0)
    assert mar["scattered_days_share"] == 0.0

    t = d["totals"]
    assert (t["interventions_reported"], t["urgent_count"], t["urgent_share"]) == (10, 1, 10.0)
    assert t["hours"]["PRO"] == 7.0 and t["hours"]["total"] == 16.75
    assert (t["chantiers_started"], t["chantiers_interrupted"]) == (6, 2)
    assert t["interrupted_share"] == 33.3
    assert (t["tech_days"], t["avg_interventions_per_tech_day"]) == (13, 1.15)
    assert t["scattered_days_share"] == 7.7

    # PRO1 et PRO2 (2 jours actifs sur 11), PRO4 (2 sur 6) ; PRO3 (un jour) est écartée
    assert d["projects"] == {
        "count": 3,
        "avg_active_days": 2.0,
        "avg_span_days": 9.33,
        "active_ratio": 21.4,  # 6 / 28
    }


def _cles_et_valeurs(obj, vus=None):
    vus = [] if vus is None else vus
    if isinstance(obj, dict):
        for cle, valeur in obj.items():
            vus.append(str(cle))
            _cles_et_valeurs(valeur, vus)
    elif isinstance(obj, list):
        for item in obj:
            _cles_et_valeurs(item, vus)
    return vus


def test_organisation_aucune_donnee_par_technicien(client, admin, equipe, instance):
    r = client.get(URL, params={"start_date": DEBUT, "end_date": FIN}, headers=admin.headers)
    cles = _cles_et_valeurs(r.json())
    assert "tech_days" in cles
    for cle in cles:
        assert not any(
            m in cle.lower() for m in ("tech_id", "initial", "technician", "name", "user")
        )
    # Ni identifiant ni initiales des techniciens de la fixture dans le texte brut
    initiales = instance.sql(
        "SELECT initial FROM tunnel_user WHERE id = ANY(%s::uuid[])",
        ([equipe["t1"], equipe["t2"]],),
    )
    assert len(initiales) == 2
    for identifiant in equipe.values():
        assert identifiant not in r.text
    for (initiale,) in initiales:
        assert f'"{initiale}"' not in r.text


@pytest.fixture
def etat_actuel(instance):
    """Fabrique le préventif et les pièces en attente (dates anciennes) ; nettoie en fin de test."""
    creations = {"occ": [], "di": [], "plans": [], "machines": [], "pieces": []}

    def _creer():
        m = _machine(instance)
        creations["machines"].append(m)
        suffixe = secrets.token_hex(3)
        for i, actif in enumerate((True, False)):
            creations["plans"].append(
                str(
                    instance.sql(
                        "INSERT INTO preventive_plan "
                        "(code, label, trigger_type, periodicity_days, active) "
                        "VALUES (%s, 'Plan ORG', 'periodicity', 30, %s) RETURNING id",
                        (f"ORG-{suffixe}-{i}", actif),
                    )[0][0]
                )
            )
        di = str(
            instance.sql(
                "INSERT INTO intervention_request (machine_id, demandeur_nom, description, "
                "code, statut, created_at) VALUES (%s, 'Système préventif', 'ORG', %s, "
                "'nouvelle', '1999-03-10 08:00:00+00') RETURNING id",
                (m, f"DI-ORG-{suffixe}"),
            )[0][0]
        )
        creations["di"].append(di)
        # Générée et non démarrée (1999), puis une autre déjà en cours déclenchée en 2099 :
        # seule la première compte comme « en attente », les deux datent la dernière génération.
        for jour, statut, declenche, ref in (
            ("1999-03-01", "generated", "1999-03-01 08:00:00+00", di),
            ("1999-03-02", "in_progress", "2099-01-01 08:00:00+00", di),
        ):
            creations["occ"].append(
                str(
                    instance.sql(
                        "INSERT INTO preventive_occurrence (plan_id, machine_id, scheduled_date, "
                        "status, triggered_at, di_id) VALUES (%s, %s, %s, %s, %s, %s) "
                        "RETURNING id",
                        (creations["plans"][0], m, jour, statut, declenche, ref),
                    )[0][0]
                )
            )
        for jour in ("1999-01-01", "1999-01-11"):
            _mettre_en_attente_de_pieces(instance, _intervention(instance, m, "CUR", jour))
        _intervention(instance, m, "CUR", "1999-01-01")

    yield _creer
    instance.sql(
        "DELETE FROM preventive_occurrence WHERE id = ANY(%s::uuid[])", (creations["occ"],)
    )
    instance.sql("DELETE FROM intervention_request WHERE id = ANY(%s::uuid[])", (creations["di"],))
    instance.sql("DELETE FROM preventive_plan WHERE id = ANY(%s::uuid[])", (creations["plans"],))
    for m in creations["machines"]:
        instance.sql(
            "DELETE FROM intervention_status_log WHERE intervention_id IN "
            "(SELECT id FROM intervention WHERE machine_id = %s)",
            (m,),
        )
        instance.sql("DELETE FROM intervention WHERE machine_id = %s", (m,))


def test_organisation_preventif_et_pieces_en_attente(client, admin, etat_actuel):
    avant = _organisation(client, admin.headers)
    etat_actuel()
    apres = _organisation(client, admin.headers)

    pa, pb = avant["preventive"], apres["preventive"]
    assert pb["active_plans"] == pa["active_plans"] + 1  # le plan inactif n'est pas compté
    assert pb["occurrences_not_started"] == pa["occurrences_not_started"] + 1
    assert pb["pending_requests"] == pa["pending_requests"] + 1
    assert pb["oldest_not_started_days"] == (date.today() - date(1999, 3, 1)).days
    assert pb["oldest_pending_request_days"] == (date.today() - date(1999, 3, 10)).days
    assert pb["last_generated_at"].startswith("2099-01-01")

    wa, wb = avant["waiting_parts"], apres["waiting_parts"]
    age_1, age_2 = ((date.today() - date(1999, 1, j)).days for j in (1, 11))
    assert wb["count"] == wa["count"] + 2  # l'intervention ouverte n'est pas comptée
    assert wb["max_age_days"] == age_1
    if wa["count"] == 0:
        assert wb["median_age_days"] == round((age_1 + age_2) / 2, 1)


def test_organisation_periode_sans_donnee(client, admin):
    d = _organisation(client, admin.headers, start_date="2040-01-01", end_date="2040-02-29")
    assert [m["month"] for m in d["monthly"]] == ["2040-01", "2040-02"]
    assert d["totals"]["hours"] == HEURES_VIDES
    assert d["totals"]["urgent_share"] is None and d["totals"]["interrupted_share"] is None
    assert d["projects"] == {
        "count": 0,
        "avg_active_days": None,
        "avg_span_days": None,
        "active_ratio": None,
    }


def test_organisation_periode_par_defaut_douze_mois(client, admin):
    r = client.get(URL, headers=admin.headers)
    assert r.status_code == 200, r.text
    assert len(r.json()["monthly"]) == 12


def test_organisation_erreurs_sans_message_brut(client, admin):
    inversee = client.get(URL, params={"start_date": FIN, "end_date": DEBUT}, headers=admin.headers)
    longue = client.get(
        URL, params={"start_date": "2010-01-01", "end_date": "2034-01-01"}, headers=admin.headers
    )
    invalide = client.get(URL, params={"start_date": "pas-une-date"}, headers=admin.headers)
    assert (inversee.status_code, longue.status_code) == (400, 400)
    assert invalide.status_code in (400, 422)  # date illisible : validation FastAPI
    for r in (inversee, longue, invalide):
        assert "psycopg2" not in r.text and "SELECT" not in r.text


def test_organisation_droits_par_role(client, make_user, grant, instance):
    tech = make_user("TECH")
    assert client.get(URL, headers=tech.headers).status_code == 200
    code = instance.sql(
        "SELECT code FROM tunnel_endpoint WHERE method = 'GET' AND path = '/stats/organisation'"
    )
    assert code == [("stats:get_organisation",)]

    grant("TECH", "GET", "/stats/organisation", allowed=False)
    assert client.get(URL, headers=tech.headers).status_code == 403


def test_organisation_lisible_par_une_cle_mcp(client, admin):
    cle = client.post(
        "/api-keys", headers=admin.headers, json={"name": f"it-{secrets.token_hex(3)}"}
    )
    assert cle.status_code == 201, cle.text
    assert client.get(URL, headers={"X-API-Key": cle.json()["secret"]}).status_code == 200
