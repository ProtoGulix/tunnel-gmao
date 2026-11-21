"""Synthèse de l'audit sur vraie base (SYN-01, ADR 0032).

Les données sont posées en janvier et février 2035 ; le dépôt est appelé sur cette période
(la route, elle, part de la date du jour). Valeurs attendues calculées à la main, voir le
plan dans la fixture.
"""

import secrets
import uuid
from datetime import date

import pytest

from api.limiter import limiter
from api.stats.audit_synthese_repo import AuditSyntheseRepository

pytestmark = pytest.mark.integration

DEBUT, FIN = date(2035, 1, 1), date(2035, 2, 28)
URL = "/stats/audit-synthese"


@pytest.fixture(autouse=True)
def _sans_limiteur(monkeypatch):
    monkeypatch.setattr(limiter, "enabled", False)


def _tache(instance, iid, statut, garant, createur, jour, actions_par=()):
    """Crée une tâche (garant = assigned_to) et une action liée par exécutant."""
    tid = instance.sql(
        "INSERT INTO intervention_task (intervention_id, label, origin, status, assigned_to, "
        "created_by, created_at) VALUES (%s, 'SYN', 'resp', %s, %s, %s, %s) RETURNING id",
        (iid, statut, garant, createur, f"{jour} 09:00:00+00"),
    )[0][0]
    for tech in actions_par:
        aid = instance.sql(
            "INSERT INTO intervention_action (intervention_id, tech, created_at, time_spent) "
            "VALUES (%s, %s, %s, 1) RETURNING id",
            (iid, tech, f"{jour} 10:00:00+00"),
        )[0][0]
        instance.sql(
            "INSERT INTO intervention_action_task (action_id, task_id) VALUES (%s, %s)",
            (aid, tid),
        )


def _evenement(instance, jour, decision, motif_id=None, systeme=False):
    instance.sql(
        "INSERT INTO audit_log (entity_type, entity_id, decision_type, reason_code_id, "
        "is_system, logged_at) VALUES ('task', %s, %s, %s, %s, %s)",
        (str(uuid.uuid4()), decision, motif_id, systeme, f"{jour} 12:00:00+00"),
    )


def _motif(instance, categorie):
    rows = instance.sql(
        "SELECT id, code FROM audit_reason_code WHERE category = %s ORDER BY id LIMIT 1",
        (categorie,),
    )
    assert rows, f"aucun motif de catégorie {categorie} dans les données de référence"
    return rows[0]


@pytest.fixture
def jeu(instance, make_user):
    """Trois techniciens (a, b, c), sept tâches et neuf événements d'audit.

    Janvier, tâches : T1 sans garant (todo) ; T2 faite, garant a, créée par a, actions de a
    (repérée sur le terrain) ; T3 faite, garant a, actions de b seul (sans action du garant) ;
    T4 faite, garant a, actions de a et b (partagée) ; T5 faite sans garant, action de a ;
    T6 todo, garant a. Février : T7 faite, garant b, créée par b, actions de b et c
    (repérée et partagée).
    Événements, janvier : motif user x2 (status_changed, deleted), motif manual x1, tous
    comptés comme décisions ; motif system non système x1 ; sans motif x1 ; système avec motif
    x1 ; système sans motif x1 + 1 événement LEGACY_STATUS_CHANGE (8 événements, 2 système). Février : 1 décision user.
    """
    a, b, c = (make_user("TECH").id for _ in range(3))
    m = instance.sql(
        "INSERT INTO machine (code, name) VALUES (%s, 'Presse SYN') RETURNING id",
        (f"SYN-{secrets.token_hex(3)}",),
    )[0][0]
    iid = instance.sql(
        "INSERT INTO intervention (title, machine_id, type_inter, tech_initials, "
        "status_actual, reported_date) VALUES ('SYN', %s, 'CUR', 'ZZ', 'ouvert', '2035-01-02') "
        "RETURNING id",
        (m,),
    )[0][0]
    _tache(instance, iid, "todo", None, a, "2035-01-03")
    _tache(instance, iid, "done", a, a, "2035-01-04", (a,))
    _tache(instance, iid, "done", a, b, "2035-01-05", (b,))
    _tache(instance, iid, "done", a, b, "2035-01-06", (a, b))
    _tache(instance, iid, "done", None, b, "2035-01-07", (a,))
    _tache(instance, iid, "todo", a, b, "2035-01-08")
    _tache(instance, iid, "done", b, b, "2035-02-10", (b, c))

    user_id, _ = _motif(instance, "user")
    manual_id, _ = _motif(instance, "manual")
    system_id, _ = _motif(instance, "system")
    _evenement(instance, "2035-01-10", "status_changed", user_id)
    _evenement(instance, "2035-01-11", "deleted", user_id)
    _evenement(instance, "2035-01-12", "status_changed", manual_id)
    _evenement(instance, "2035-01-13", "status_changed", system_id)
    _evenement(instance, "2035-01-14", "updated")
    _evenement(instance, "2035-01-15", "updated", system_id, systeme=True)
    _evenement(instance, "2035-01-16", "updated", None, systeme=True)
    _evenement(instance, "2035-02-10", "status_changed", user_id)
    # Journal migré : non système, motif de catégorie user, mais jamais une décision
    legacy = instance.sql(
        "SELECT id, category FROM audit_reason_code WHERE code = 'LEGACY_STATUS_CHANGE'"
    )
    assert legacy and legacy[0][1] in ("user", "manual")
    _evenement(instance, "2035-01-17", "created", legacy[0][0])
    yield {"user": user_id, "manual": manual_id, "techs": (a, b, c)}
    # Nettoyage : chaque test repart d'un jeu neuf, les comptes exacts ne s'additionnent pas.
    instance.sql("DELETE FROM intervention_task WHERE intervention_id = %s", (iid,))
    instance.sql("DELETE FROM intervention_action WHERE intervention_id = %s", (iid,))
    instance.sql(
        "DELETE FROM audit_log WHERE logged_at >= '2035-01-01' AND logged_at < '2035-03-01'"
    )


def test_indicateurs_par_mois_et_totaux(instance, client, jeu):
    d = AuditSyntheseRepository().get_synthese(DEBUT, FIN)
    mois = {m["month"]: m for m in d["monthly"]}
    assert list(mois) == ["2035-01", "2035-02"]
    jan, fev = mois["2035-01"], mois["2035-02"]

    assert (jan["tasks_created"], jan["tasks_without_guarantor"]) == (6, 2)
    assert jan["without_guarantor_share"] == 33.3
    assert (jan["tasks_done"], jan["tasks_done_with_guarantor"]) == (4, 3)
    assert jan["done_without_guarantor_action"] == 1  # T3 : seul b a agi, le garant est a
    assert jan["done_without_guarantor_action_share"] == 33.3
    assert jan["spotted_in_field"] == 1  # T2 ; T4 et T5 non (créateur différent ou sans garant)
    assert jan["spotted_in_field_share"] == 33.3
    assert jan["shared_tasks"] == 1  # T4 : deux exécutants
    assert jan["shared_tasks_share"] == 25.0

    assert (fev["tasks_created"], fev["tasks_without_guarantor"]) == (1, 0)
    assert (fev["spotted_in_field"], fev["shared_tasks"]) == (1, 1)
    assert fev["done_without_guarantor_action"] == 0
    assert fev["done_without_guarantor_action_share"] == 0.0  # vrai zéro, pas null

    assert (jan["audit_events"], jan["system_events"], jan["system_share"]) == (8, 2, 25.0)
    assert (
        jan["decisions_total"] == 3
    )  # user/manual non système ; LEGACY_STATUS_CHANGE exclu, mais compté dans audit_events
    assert (fev["audit_events"], fev["system_events"], fev["decisions_total"]) == (1, 0, 1)

    t = d["totals"]
    assert (t["tasks_created"], t["tasks_without_guarantor"]) == (7, 2)
    assert (t["tasks_done"], t["tasks_done_with_guarantor"]) == (5, 4)
    assert (t["done_without_guarantor_action"], t["spotted_in_field"]) == (1, 2)
    assert t["shared_tasks"] == 2
    assert t["done_without_guarantor_action_share"] == 25.0
    assert t["spotted_in_field_share"] == 50.0
    assert t["shared_tasks_share"] == 40.0
    assert (t["audit_events"], t["system_events"], t["system_share"]) == (9, 2, 22.2)
    assert t["decisions_total"] == 4


def test_decisions_par_type_et_motif(instance, client, jeu):
    d = AuditSyntheseRepository().get_synthese(DEBUT, FIN)
    codes = {
        r[0]: r[1]
        for r in instance.sql(
            "SELECT id, code FROM audit_reason_code WHERE id = ANY(%s)",
            ([jeu["user"], jeu["manual"]],),
        )
    }
    attendu = {
        ("2035-01", "status_changed", codes[jeu["user"]]): 1,
        ("2035-01", "deleted", codes[jeu["user"]]): 1,
        ("2035-01", "status_changed", codes[jeu["manual"]]): 1,
        ("2035-02", "status_changed", codes[jeu["user"]]): 1,
    }
    obtenu = {
        (r["month"], r["decision_type"], r["reason_code"]): r["count"] for r in d["decisions"]
    }
    assert obtenu == attendu
    assert all(r["reason_label"] for r in d["decisions"])


def test_mois_anterieurs_signales_incomplets(client):
    d = AuditSyntheseRepository().get_synthese(date(2026, 10, 1), date(2026, 12, 31))
    drapeaux = {m["month"]: m["incomplete_data"] for m in d["monthly"]}
    # Novembre 2026 commence avant le 2026-11-20 : partiellement incomplet aussi
    assert drapeaux == {"2026-10": True, "2026-11": True, "2026-12": False}
    assert d["cascades_traced_from"] == date(2026, 11, 20)


def test_periode_sans_donnee(client):
    d = AuditSyntheseRepository().get_synthese(date(2040, 1, 1), date(2040, 2, 29))
    assert [m["month"] for m in d["monthly"]] == ["2040-01", "2040-02"]
    t = d["totals"]
    assert t["tasks_created"] == 0 and t["system_share"] is None
    assert t["without_guarantor_share"] is None and d["decisions"] == []


def test_route_aucune_donnee_de_personne(client, admin, jeu, instance):
    r = client.get(URL, headers=admin.headers)
    assert r.status_code == 200, r.text
    d = r.json()
    assert len(d["monthly"]) == 3  # défaut : 3 mois
    cles = set()

    def parcourir(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                cles.add(k)
                parcourir(v)
        elif isinstance(obj, list):
            for v in obj:
                parcourir(v)

    parcourir(d)
    for cle in cles:
        assert not any(
            m in cle.lower() for m in ("tech_id", "initial", "technician", "name", "user")
        )
    # Réponse brute : ni identifiant ni initiales des techniciens de la fixture
    initiales = instance.sql(
        "SELECT initial FROM tunnel_user WHERE id = ANY(%s::uuid[])", (list(jeu["techs"]),)
    )
    assert len(initiales) == 3
    for identifiant in jeu["techs"]:
        assert str(identifiant) not in r.text
    for (initiale,) in initiales:
        assert f'"{initiale}"' not in r.text
    # Les motifs de la réponse sont des libellés de référence, pas des personnes
    for r_dec in d["decisions"]:
        assert set(r_dec) == {"month", "decision_type", "reason_code", "reason_label", "count"}


def test_route_months_borne_et_erreurs(client, admin):
    assert len(client.get(URL, params={"months": 1}, headers=admin.headers).json()["monthly"]) == 1
    assert (
        len(client.get(URL, params={"months": 12}, headers=admin.headers).json()["monthly"]) == 12
    )
    for mauvais in (0, -1, 121):
        r = client.get(URL, params={"months": mauvais}, headers=admin.headers)
        assert r.status_code == 400, mauvais
        assert "psycopg2" not in r.text and "SELECT" not in r.text
    assert client.get(URL, params={"months": "abc"}, headers=admin.headers).status_code in (
        400,
        422,
    )


def test_droits_par_role(client, make_user, grant, instance):
    tech = make_user("TECH")
    assert client.get(URL, headers=tech.headers).status_code == 200
    code = instance.sql(
        "SELECT code FROM tunnel_endpoint WHERE method = 'GET' AND path = '/stats/audit-synthese'"
    )
    assert code == [("stats:get_audit_synthese",)]

    grant("TECH", "GET", "/stats/audit-synthese", allowed=False)
    assert client.get(URL, headers=tech.headers).status_code == 403


def test_lisible_par_une_cle_mcp(client, admin):
    cle = client.post(
        "/api-keys", headers=admin.headers, json={"name": f"it-{secrets.token_hex(3)}"}
    )
    assert cle.status_code == 201, cle.text
    assert client.get(URL, headers={"X-API-Key": cle.json()["secret"]}).status_code == 200
