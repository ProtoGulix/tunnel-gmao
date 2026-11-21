"""Série mensuelle de /stats/service-status sur vraie base (BIL-05, ADR 0034 point 12).

Les actions sont posées en 2036, loin des autres tests.
"""

import secrets

import pytest

from api.limiter import limiter

pytestmark = pytest.mark.integration

URL = "/stats/service-status"
DEBUT, FIN = "2036-01-01", "2036-03-31"


@pytest.fixture(autouse=True)
def _sans_limiteur(monkeypatch):
    monkeypatch.setattr(limiter, "enabled", False)


def _sous_categorie(instance, category_id):
    rows = instance.sql(
        "SELECT id FROM action_subcategory WHERE category_id = %s LIMIT 1", (category_id,)
    )
    if not rows:
        pytest.skip(
            f"aucune sous-catégorie de la catégorie {category_id} dans les données de départ"
        )
    return rows[0][0]


@pytest.fixture
def actions_2036(instance, make_user):
    """Janvier : 6 h production, 2 h fragmentation (cat. 23), 2 h pilotage (cat. 21). Mars : 8 h."""
    tech = make_user("TECH").id
    machine = instance.sql(
        "INSERT INTO machine (code, name) VALUES (%s, 'Presse SVC') RETURNING id",
        (f"SVC-{secrets.token_hex(3)}",),
    )[0][0]
    iid = instance.sql(
        "INSERT INTO intervention (title, machine_id, type_inter, tech_initials, status_actual, "
        "reported_date, priority) VALUES ('SVC', %s, 'CUR', %s, 'ouvert', '2036-01-05', 'normale') "
        "RETURNING id",
        (machine, secrets.token_hex(3).upper()),
    )[0][0]
    frag, pilot = _sous_categorie(instance, 23), _sous_categorie(instance, 21)
    for jour, heures, sous_cat in (
        ("2036-01-10", 6.0, None),
        ("2036-01-11", 2.0, frag),
        ("2036-01-12", 2.0, pilot),
        ("2036-03-10", 8.0, None),
    ):
        instance.sql(
            "INSERT INTO intervention_action (intervention_id, tech, created_at, time_spent, "
            "action_subcategory) VALUES (%s, %s, %s, %s, %s)",
            (iid, tech, f"{jour} 09:00:00+00", heures, sous_cat),
        )


def _statut(client, admin, **params):
    r = client.get(
        URL, params={"start_date": DEBUT, "end_date": FIN, **params}, headers=admin.headers
    )
    assert r.status_code == 200, r.text
    return r.json()


def test_serie_mensuelle_somme_des_heures_egale_le_total(client, admin, actions_2036):
    d = _statut(client, admin)
    mois = {m["month"]: m for m in d["monthly"]}
    assert list(mois) == ["2036-01", "2036-02", "2036-03"]  # mois sans heure compris
    assert (
        round(sum(m["total_hours"] for m in d["monthly"]), 2)
        == d["capacity"]["total_hours"]
        == 18.0
    )
    assert d["breakdown"]["total_hours"] == 18.0

    jan = mois["2036-01"]
    assert (jan["total_hours"], jan["frag_percent"], jan["pilot_percent"]) == (10.0, 20.0, 20.0)
    assert jan["capacity_hours"] == round(400 * 31 / 30, 2)
    assert jan["charge_percent"] == round(10 / (400 * 31 / 30) * 100, 1)

    fev = mois["2036-02"]
    assert fev["total_hours"] == 0
    assert (fev["charge_percent"], fev["frag_percent"], fev["pilot_percent"]) == (None,) * 3

    mar = mois["2036-03"]
    assert (mar["frag_percent"], mar["pilot_percent"]) == (0.0, 0.0)  # des heures : 0, pas null
    assert d["trends"] == {"charge_percent": None, "frag_percent": None, "pilot_percent": None}


def test_capacite_mensuelle_proratisee_et_totale(client, admin, actions_2036):
    d = _statut(client, admin, start_date="2036-01-20", end_date="2036-03-10")
    jan, _, mar = d["monthly"]
    assert jan["capacity_hours"] == round(400 * 12 / 30, 2)  # 20 au 31 janvier
    assert mar["capacity_hours"] == round(400 * 10 / 30, 2)  # 1er au 10 mars
    assert round(sum(m["capacity_hours"] for m in d["monthly"]), 1) == round(
        d["capacity"]["capacity_hours"], 1
    )


def test_periode_sans_heure_donne_des_mois_nuls(client, admin):
    d = _statut(client, admin, start_date="2041-01-01", end_date="2041-02-28")
    assert [m["month"] for m in d["monthly"]] == ["2041-01", "2041-02"]
    assert all(m["charge_percent"] is None and m["total_hours"] == 0 for m in d["monthly"])
