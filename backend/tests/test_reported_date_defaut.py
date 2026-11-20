"""IMPR-05 : une intervention a toujours une date de signalement (défaut : date du jour)."""

from datetime import date

import pytest

from api.intervention_requests.repo import InterventionRequestRepository
from api.interventions import repo as interventions_repo
from api.interventions import routes as interventions_routes
from api.interventions.repo import InterventionRepository
from api.interventions.validators import InterventionValidator
from tests.helpers import make_client

INTERVENTION_ID = "22222222-2222-2222-2222-222222222222"
MACHINE_ID = "33333333-3333-3333-3333-333333333333"
FIXE = date(2026, 3, 4)


class _FauxCurseur:
    """Enregistre les INSERT ; toute lecture renvoie une ligne générique."""

    def __init__(self):
        self.inserts = []

    def execute(self, sql, params=None):
        if "INSERT INTO intervention" in sql:
            self.inserts.append(params)

    def fetchone(self):
        return (1,)


class _FausseConnexion:
    def __init__(self, cur):
        self._cur = cur

    def cursor(self):
        return self._cur

    def commit(self):
        pass

    def rollback(self):
        pass


def _creer_direct(monkeypatch, data):
    """Appelle InterventionRepository.add avec une base factice ; renvoie les paramètres INSERT."""
    cur = _FauxCurseur()
    repo = InterventionRepository()
    monkeypatch.setattr(repo, "_get_connection", lambda: _FausseConnexion(cur))
    monkeypatch.setattr(interventions_repo, "release_connection", lambda c: None)
    monkeypatch.setattr(repo, "_resolve_tech_initials", lambda c, d: None)
    monkeypatch.setattr(repo, "get_by_id", lambda *a, **k: {"id": INTERVENTION_ID})
    monkeypatch.setattr(
        InterventionValidator, "validate_create", staticmethod(lambda d, **kwargs: None)
    )
    repo.add({"title": "t", "machine_id": MACHINE_ID, "type_inter": "CUR", **data})
    return cur.inserts[0]


def _creer_depuis_demande(monkeypatch, intervention_data):
    """Appelle _create_intervention_for_request avec un curseur factice."""
    cur = _FauxCurseur()
    monkeypatch.setattr(
        InterventionValidator, "validate_create", staticmethod(lambda d, **kwargs: None)
    )
    InterventionRequestRepository()._create_intervention_for_request(
        cur,
        {"id": "r1", "equipement": {"id": MACHINE_ID}, "description": "d", "demandeur_nom": "n"},
        {"type_inter": "CUR", "tech_initials": "AB", **intervention_data},
    )
    return cur.inserts[0]


# Position de reported_date dans le tuple des deux INSERT (avant plan_id)
def _date(params):
    return params[-2]


@pytest.mark.parametrize("creer", [_creer_direct, _creer_depuis_demande])
class TestCreation:
    def test_sans_date_prend_le_jour(self, monkeypatch, creer):
        assert _date(creer(monkeypatch, {})) == date.today()

    def test_date_nulle_prend_le_jour(self, monkeypatch, creer):
        assert _date(creer(monkeypatch, {"reported_date": None})) == date.today()

    def test_date_fournie_conservee(self, monkeypatch, creer):
        assert _date(creer(monkeypatch, {"reported_date": "2026-01-13"})) == "2026-01-13"


class TestMiseAJour:
    @pytest.fixture
    def recus(self, monkeypatch):
        recus = []

        class _FauxRepo:
            def update(self, intervention_id, data):
                recus.append(data)
                return {"id": intervention_id}

        monkeypatch.setattr(interventions_routes, "InterventionRepository", _FauxRepo)
        return recus

    def _put(self, corps):
        client = make_client(interventions_routes.router, role="ADMIN")
        return client.put(f"/interventions/{INTERVENTION_ID}", json=corps)

    def test_date_nulle_refusee(self, recus):
        reponse = self._put({"reported_date": None})
        assert reponse.status_code == 400
        assert "date de signalement" in reponse.text
        assert recus == []

    def test_date_absente_inchangee(self, recus):
        assert self._put({"title": "x"}).status_code == 200
        assert "reported_date" not in recus[0]

    def test_date_fournie_transmise(self, recus):
        assert self._put({"reported_date": "2026-01-13"}).status_code == 200
        assert str(recus[0]["reported_date"]) == "2026-01-13"
