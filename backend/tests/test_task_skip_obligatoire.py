"""PATCH /intervention-tasks : ignorer une étape obligatoire de gamme est réservé à RESP et ADMIN."""

import pytest

from api.intervention_tasks import routes as task_routes
from tests.helpers import make_client

TASK_ID = "88888888-8888-8888-8888-888888888888"
CORPS_IGNORER = {
    "status": "skipped",
    "skip_reason": "Pièce absente",
    "reason_code": "OTHER",
    "reason_text": "test",
}


def _tache(origin, optional):
    return {"id": TASK_ID, "origin": origin, "optional": optional, "status": "todo"}


@pytest.fixture
def patches(monkeypatch):
    """Remplace le repository : aucune base n'est touchée. Retourne les PATCH reçus."""
    recus = []
    etat = {"tache": _tache("plan", False)}

    class _FauxRepo:
        def get_by_id(self, task_id):
            return etat["tache"]

        def patch(self, task_id, data, closed_by=None):
            recus.append(data)
            return {**etat["tache"], "status": data.status}

    monkeypatch.setattr(task_routes, "InterventionTaskRepository", _FauxRepo)
    return recus, etat


@pytest.mark.parametrize("role", ["TECH", "ACHETEUR"])
def test_etape_obligatoire_refusee_hors_responsable(patches, role):
    recus, _ = patches
    reponse = make_client(task_routes.router, role=role).patch(
        f"/intervention-tasks/{TASK_ID}", json=CORPS_IGNORER
    )
    assert reponse.status_code == 403
    assert recus == []


@pytest.mark.parametrize("role", ["RESP", "ADMIN"])
def test_etape_obligatoire_acceptee_pour_responsable(patches, role):
    recus, _ = patches
    reponse = make_client(task_routes.router, role=role).patch(
        f"/intervention-tasks/{TASK_ID}", json=CORPS_IGNORER
    )
    assert reponse.status_code == 200
    assert len(recus) == 1


@pytest.mark.parametrize(
    "tache", [_tache("plan", True), _tache("resp", False), _tache("tech", False)]
)
def test_etape_optionnelle_ou_hors_gamme_acceptee_pour_tech(patches, tache):
    recus, etat = patches
    etat["tache"] = tache
    reponse = make_client(task_routes.router, role="TECH").patch(
        f"/intervention-tasks/{TASK_ID}", json=CORPS_IGNORER
    )
    assert reponse.status_code == 200
    assert len(recus) == 1


def test_reouverture_non_controlee(patches):
    recus, _ = patches
    corps = {"status": "todo", "reason_code": "OTHER", "reason_text": "test"}
    reponse = make_client(task_routes.router, role="TECH").patch(
        f"/intervention-tasks/{TASK_ID}", json=corps
    )
    assert reponse.status_code == 200
    assert len(recus) == 1
