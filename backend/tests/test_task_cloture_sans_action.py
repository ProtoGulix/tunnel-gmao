"""PATCH /intervention-tasks : done et skipped directs exigent un motif d'audit explicite.

ADR 0016 : `done` sans action est réservé à RESP et ADMIN ; tout passage direct vers
done ou skipped demande un motif manual ou user de l'entité task. Sans motif (le
middleware injecte alors ROUTINE) ou avec un motif auto ou system, la route répond la
demande de motif standard que le front (auditGuard.js) sait traiter."""

import pytest

from api.intervention_tasks import routes as task_routes
from tests.helpers import make_client

TASK_ID = "99999999-9999-9999-9999-999999999999"

# Motifs actifs de l'entité task, comme les renvoie list_entity_reasons("task")
MOTIFS_TASK = [
    {"code": "ROUTINE", "label": "Opération courante", "category": "auto", "color": None},
    {"code": "TASK_STATUS", "label": "Changement de statut", "category": "system", "color": None},
    {
        "code": "OTHER",
        "label": "Autre raison",
        "category": "user",
        "color": "#9ca3af",
        "decision_types": ["task_done", "task_skipped"],
    },
    {
        "code": "TASK_DUPLICATE",
        "label": "Doublon",
        "category": "user",
        "color": "#6b7280",
        "decision_types": ["task_skipped"],
    },
    {
        "code": "TASK_DONE_UNRECORDED",
        "label": "Réalisée sans action saisie",
        "category": "user",
        "color": "#16a34a",
        "decision_types": ["task_done"],
    },
    {
        "code": "MANUEL",
        "label": "Motif manuel",
        "category": "manual",
        "color": None,
        "decision_types": ["task_done", "task_skipped"],
    },
    # Valide pour task mais sans decision_types : jamais proposé pour done ni skipped
    {"code": "PLANNING_CHANGE", "label": "Planning", "category": "user", "decision_types": None},
]


@pytest.fixture
def patches(monkeypatch):
    """Remplace le repository et la lecture des motifs : aucune base n'est touchée."""
    recus = []

    class _FauxRepo:
        def get_by_id(self, task_id):
            return {"id": TASK_ID, "origin": "plan", "optional": False, "status": "todo"}

        def patch(self, task_id, data, closed_by=None, reopen_checked=False):
            recus.append((data, closed_by))
            return {"id": TASK_ID, "status": data.status}

    monkeypatch.setattr(task_routes, "InterventionTaskRepository", _FauxRepo)
    monkeypatch.setattr(task_routes, "list_entity_reasons", lambda entity: MOTIFS_TASK)
    return recus


def _patch(role, corps):
    return make_client(task_routes.router, role=role).patch(
        f"/intervention-tasks/{TASK_ID}", json=corps
    )


def _corps(status, code, **extra):
    return {"status": status, "reason_code": code, **extra}


@pytest.mark.parametrize("role", ["RESP", "ADMIN"])
def test_done_accepte_pour_responsable_avec_motif_user(patches, role):
    assert _patch(role, _corps("done", "TASK_DONE_UNRECORDED")).status_code == 200
    data, closed_by = patches[0]
    assert data.status == "done"
    assert closed_by == "11111111-1111-1111-1111-111111111111"


@pytest.mark.parametrize("role", ["TECH", "ACHETEUR"])
@pytest.mark.parametrize("code", ["TASK_DONE_UNRECORDED", "ROUTINE"])
def test_done_refuse_hors_responsable_avant_toute_demande_de_motif(patches, role, code):
    assert _patch(role, _corps("done", code)).status_code == 403
    assert patches == []


@pytest.mark.parametrize("statut", ["done", "skipped"])
@pytest.mark.parametrize("code", ["ROUTINE", "TASK_STATUS"])
def test_motif_auto_ou_system_declenche_la_demande_de_motif(patches, statut, code):
    """ROUTINE est ce que le middleware injecte quand le front n'envoie rien."""
    reponse = _patch("RESP", _corps(statut, code, skip_reason="Pièce absente"))
    assert reponse.status_code == 400
    corps = reponse.json()
    assert corps["detail"] == "reason_code obligatoire pour cette mutation"
    assert corps["error_type"] == "ValidationError"
    audit = corps["audit"]
    assert audit["required"] is True
    assert audit["silent"] is False
    assert audit["default_reason_code"] is None
    attendus = {
        "done": ["OTHER", "TASK_DONE_UNRECORDED", "MANUEL"],
        "skipped": ["OTHER", "TASK_DUPLICATE", "MANUEL"],
    }
    assert [r["code"] for r in audit["reasons"]] == attendus[statut]
    assert next(r for r in audit["reasons"] if r["code"] == "OTHER")["requires_text"] is True
    assert patches == []


def test_other_sans_texte_est_refuse(patches):
    for extra in ({}, {"reason_text": ""}, {"reason_text": "   "}):
        reponse = _patch("RESP", _corps("done", "OTHER", **extra))
        assert reponse.status_code == 400
        assert "audit" not in reponse.json()
    assert patches == []


def test_other_avec_texte_est_accepte(patches):
    assert _patch("RESP", _corps("done", "OTHER", reason_text="Vu en réunion")).status_code == 200


def test_motif_non_applicable_a_une_tache_est_refuse(patches):
    reponse = _patch("RESP", _corps("done", "MOTIF_DUNE_AUTRE_ENTITE"))
    assert reponse.status_code == 400
    assert "audit" not in reponse.json()
    assert patches == []


def test_skipped_sans_skip_reason_prend_le_libelle_du_motif(patches):
    assert _patch("RESP", _corps("skipped", "TASK_DUPLICATE")).status_code == 200
    assert patches[0][0].skip_reason == "Doublon"


def test_skipped_sans_skip_reason_ajoute_le_texte_du_motif(patches):
    corps = _corps("skipped", "TASK_DUPLICATE", reason_text="Déjà dans l'intervention 12")
    assert _patch("RESP", corps).status_code == 200
    assert patches[0][0].skip_reason == "Doublon : Déjà dans l'intervention 12"


def test_skipped_garde_le_skip_reason_fourni(patches):
    corps = _corps("skipped", "TASK_DUPLICATE", skip_reason="Pièce absente")
    assert _patch("RESP", corps).status_code == 200
    assert patches[0][0].skip_reason == "Pièce absente"


def test_skipped_sans_skip_reason_ni_motif_ne_fait_plus_de_500(patches):
    reponse = _patch("RESP", {"status": "skipped", "reason_code": "ROUTINE"})
    assert reponse.status_code == 400
    assert reponse.json()["audit"]["reasons"]


def test_autres_champs_gardent_leur_comportement(patches):
    corps = {"label": "Nouveau libellé", "reason_code": "ROUTINE"}
    assert _patch("TECH", corps).status_code == 200
    assert patches[0][0].label == "Nouveau libellé"


@pytest.mark.parametrize(
    ("statut", "code"),
    [
        ("done", "TASK_DUPLICATE"),  # réservé à skipped
        ("skipped", "TASK_DONE_UNRECORDED"),  # réservé à done
        ("done", "PLANNING_CHANGE"),  # decision_types NULL
        ("skipped", "PLANNING_CHANGE"),
    ],
)
def test_motif_hors_liste_du_bouton_est_refuse_sans_detail(patches, statut, code):
    """Motif valide pour task mais hors des decision_types du bouton : 400, sans demande."""
    reponse = _patch("RESP", _corps(statut, code))
    assert reponse.status_code == 400
    assert "audit" not in reponse.json()
    assert patches == []
