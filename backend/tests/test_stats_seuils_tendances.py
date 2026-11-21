"""Statuts du Bilan aux bornes et tendances des indicateurs (BIL-03, ADR 0034)."""

import pytest

from api.stats import organisation_repo as repo_module
from api.stats.organisation_repo import _finish
from api.stats.repo import StatsRepository
from api.stats.schemas import StatusThresholds
from api.stats.status_rules import STATUS_RULES, evaluate_status, thresholds_payload
from api.stats.trends import compute_trend, compute_trends

# --- Statuts aux bornes (above : >= ; below : <=) ---


@pytest.mark.parametrize(
    "name, value, expected",
    [
        ("charge", 74.9, ("green", "Normale")),
        ("charge", 75, ("orange", "Élevée")),
        ("charge", 99.9, ("orange", "Élevée")),
        ("charge", 100, ("red", "Au plafond")),
        ("fragmentation", 4.9, ("green", "Maîtrisée")),
        ("fragmentation", 5, ("orange", "Notable")),
        ("fragmentation", 14.9, ("orange", "Notable")),
        ("fragmentation", 15, ("red", "Élevée")),
        ("pilotage", 20.1, ("green", "Présent")),
        ("pilotage", 20, ("orange", "Limité")),
        ("pilotage", 10.1, ("orange", "Limité")),
        ("pilotage", 10, ("red", "Absent")),
        ("pilotage", 0, ("red", "Absent")),
    ],
)
def test_statut_aux_bornes(name, value, expected):
    assert evaluate_status(name, value) == expected


def test_les_methodes_du_repo_utilisent_les_memes_regles():
    repo = StatsRepository()
    assert repo._get_charge_status(100).text == "Au plafond"
    assert repo._get_frag_status(5).color == "orange"
    assert repo._get_pilot_status(10).text == "Absent"


def test_thresholds_conformes_a_l_adr_et_au_schema():
    payload = StatusThresholds(**thresholds_payload()).model_dump()
    assert payload == {
        "charge": {"direction": "above", "orange": 75.0, "red": 100.0},
        "fragmentation": {"direction": "above", "orange": 5.0, "red": 15.0},
        "pilotage": {"direction": "below", "orange": 20.0, "red": 10.0},
    }
    assert set(STATUS_RULES) == set(payload)


# --- Tendances ---


def test_moins_de_trois_valeurs_donne_null():
    assert compute_trend([1.0, 5.0], 2.0) is None
    assert compute_trend([1.0, None, 5.0, None], 2.0) is None  # valeurs nulles ignorées


def test_hausse_baisse_et_stable():
    assert compute_trend([10.0, 15.0, 20.0], 2.0) == "up"
    assert compute_trend([20.0, 15.0, 10.0], 2.0) == "down"
    assert compute_trend([10.0, 10.5, 11.0], 2.0) == "stable"  # variation estimée 1 point


def test_borne_de_stabilite_exclue():
    # pente 1 x 2 intervalles = 2 points : plus « stable »
    assert compute_trend([10.0, 11.0, 12.0], 2.0) == "up"
    assert compute_trend([10.0, 10.9, 11.8], 2.0) == "stable"


def test_serie_constante_est_stable():
    assert compute_trend([30.0, 30.0, 30.0, 30.0], 2.0) == "stable"


def test_valeurs_nulles_ignorees_sans_decaler_les_mois():
    assert compute_trend([10.0, None, 20.0, None, 30.0], 2.0) == "up"


def test_seuil_des_interventions_par_journee():
    assert compute_trend([1.0, 1.02, 1.04], 0.1) == "stable"
    assert compute_trend([1.0, 1.2, 1.4], 0.1) == "up"


def test_compute_trends_couvre_les_cinq_indicateurs():
    mois = [{"urgent_share": v, "preventive_hours_share": 50.0} for v in (5.0, 10.0, 15.0)]
    t = compute_trends(mois)
    assert set(t) == {
        "urgent_share",
        "interrupted_share",
        "avg_interventions_per_tech_day",
        "scattered_days_share",
        "preventive_hours_share",
    }
    assert t["urgent_share"] == "up" and t["preventive_hours_share"] == "stable"
    assert t["interrupted_share"] is None


# --- Part du préventif ---


def test_part_preventive_des_heures():
    m = repo_module._empty_month("2034-01")
    assert _finish(m)["preventive_hours_share"] is None  # mois sans heures
    m["hours"].update(PRE=1.0, CUR=2.0, PRO=1.0)
    assert _finish(m)["preventive_hours_share"] == 25.0


def test_periode_sans_heures_sans_statut():
    """Période vide : aucun statut, pour ne pas afficher « Absent » en rouge sans donnée."""
    from datetime import date

    from api.stats.repo import StatsRepository

    response = StatsRepository.__new__(StatsRepository)._empty_metrics(
        date(2026, 1, 1), date(2026, 1, 31)
    )
    assert response.capacity.status is None
    assert response.fragmentation.status is None
    assert response.pilotage.status is None


# --- Série mensuelle du Bilan (BIL-05, ADR 0034 point 12) ---


def test_capacite_mensuelle_proratisee_sur_les_jours_de_la_periode():
    from datetime import date

    from api.stats.service_monthly import month_capacity_hours

    # Mois entier : 31 jours sur 30 ; période partielle : 10 jours du 20 au 29 janvier
    assert month_capacity_hours("2026-01", date(2026, 1, 1), date(2026, 3, 31)) == pytest.approx(
        400 * 31 / 30
    )
    assert month_capacity_hours("2026-01", date(2026, 1, 20), date(2026, 1, 29)) == pytest.approx(
        400 * 10 / 30
    )


def test_somme_des_capacites_mensuelles_egale_la_capacite_de_la_periode():
    from datetime import date

    from api.stats.service_monthly import build_monthly

    start, end = date(2026, 1, 20), date(2026, 4, 10)
    monthly = build_monthly([], start, end)
    assert [m["month"] for m in monthly] == ["2026-01", "2026-02", "2026-03", "2026-04"]
    days = (end - start).days + 1
    assert sum(m["capacity_hours"] for m in monthly) == pytest.approx(400 * days / 30, abs=0.05)


def test_mois_sans_heure_donne_des_pourcentages_null():
    from datetime import date

    from api.stats.service_monthly import build_monthly

    rows = [("2026-01", 20.0, 10.0, 100.0)]  # mois, heures pilotage, heures frag, total
    jan, fev = build_monthly(rows, date(2026, 1, 1), date(2026, 2, 28))
    assert (jan["frag_percent"], jan["pilot_percent"]) == (10.0, 20.0)
    assert jan["charge_percent"] == round(100 / (400 * 31 / 30) * 100, 1)
    assert fev["total_hours"] == 0
    assert (fev["charge_percent"], fev["frag_percent"], fev["pilot_percent"]) == (None,) * 3


def test_tendances_du_service():
    from datetime import date

    from api.stats.service_monthly import build_monthly, compute_service_trends

    # Charge en hausse, fragmentation stable, pilotage en baisse
    rows = [
        ("2026-01", 40.0, 10.0, 100.0),
        ("2026-02", 30.0, 10.0, 100.0),
        ("2026-03", 20.0, 10.0, 100.0),
    ]
    trends = compute_service_trends(build_monthly(rows, date(2026, 1, 1), date(2026, 3, 31)))
    assert trends == {"charge_percent": "stable", "frag_percent": "stable", "pilot_percent": "down"}
    court = compute_service_trends(build_monthly(rows[:2], date(2026, 1, 1), date(2026, 2, 28)))
    assert set(court.values()) == {None}


def test_tendance_pieces_en_attente_stable_sous_une_intervention():
    from api.stats.trends import compute_waiting_trend

    def serie(*v):
        return [{"waiting_parts_count": x} for x in v]

    assert compute_waiting_trend(serie(3, 4, 5)) == "up"  # variation estimée 2
    assert compute_waiting_trend(serie(3, 3.4, 3.8)) == "stable"
    assert compute_waiting_trend(serie(None, 4, 5)) is None  # moins de 3 valeurs
