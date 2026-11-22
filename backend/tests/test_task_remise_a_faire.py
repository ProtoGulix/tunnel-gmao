"""Motif exigé pour remettre une tâche à faire (ADR 0042) : validator et route."""

import pytest

from api.errors.exceptions import AuditReasonRequiredError, ValidationError
from api.intervention_tasks import routes as task_routes
from api.intervention_tasks.validators import ensure_task_reopen_reason, is_task_reopening
from tests.helpers import make_client

TASK_ID = "99999999-9999-9999-9999-999999999999"

MOTIFS = [
    {"code": "ROUTINE", "label": "Routine", "category": "auto", "decision_types": None},
    {"code": "SYSTEM_CASCADE", "label": "Cascade", "category": "system", "decision_types": None},
    {
        "code": "TASK_REWORK",
        "label": "Travail à reprendre",
        "category": "user",
        "decision_types": ["task_reopened"],
    },
    {
        "code": "TASK_CLOSED_BY_MISTAKE",
        "label": "Clôturée par erreur",
        "category": "user",
        "decision_types": ["task_reopened"],
    },
    {
        "code": "OTHER",
        "label": "Autre",
        "category": "user",
        "decision_types": ["task_done", "task_reopened"],
    },
    {
        "code": "TASK_DUPLICATE",
        "label": "Doublon",
        "category": "user",
        "decision_types": ["task_skipped"],
    },
]


@pytest.mark.parametrize(
    ("actuel", "nouveau", "attendu"),
    [
        ("done", "todo", True),
        ("skipped", "todo", True),
        ("todo", "todo", False),
        ("in_progress", "todo", False),
        ("done", "skipped", False),
        ("done", None, False),
    ],
)
def test_seule_la_sortie_de_done_ou_skipped_vers_todo_est_une_remise_a_faire(
    actuel, nouveau, attendu
):
    assert is_task_reopening(actuel, nouveau) is attendu


@pytest.mark.parametrize("code", ["ROUTINE", "SYSTEM_CASCADE"])
def test_motif_auto_ou_systeme_redemande_les_seuls_motifs_de_remise_a_faire(code):
    with pytest.raises(AuditReasonRequiredError) as erreur:
        ensure_task_reopen_reason(code, None, MOTIFS)
    proposes = {r["code"] for r in erreur.value.audit["reasons"]}
    assert proposes == {"TASK_REWORK", "TASK_CLOSED_BY_MISTAKE", "OTHER"}


def test_motif_inconnu_refuse():
    with pytest.raises(ValidationError):
        ensure_task_reopen_reason("INCONNU", None, MOTIFS)


def test_motif_d_une_autre_decision_refuse():
    with pytest.raises(ValidationError):
        ensure_task_reopen_reason("TASK_DUPLICATE", None, MOTIFS)


def test_autre_exige_un_texte():
    with pytest.raises(ValidationError):
        ensure_task_reopen_reason("OTHER", "  ", MOTIFS)
    ensure_task_reopen_reason("OTHER", "Client a rappelé", MOTIFS)
    ensure_task_reopen_reason("TASK_REWORK", None, MOTIFS)


@pytest.fixture
def patches(monkeypatch):
    """Faux repository et motifs : aucune base n'est touchée. Statut courant paramétrable."""

    class _Recus(list):
        def __init__(self):
            super().__init__()
            self.etat = {"status": "done"}

    recus = _Recus()
    etat = recus.etat

    class _FauxRepo:
        def get_by_id(self, task_id):
            return {"id": TASK_ID, "origin": "tech", "optional": True, "status": etat["status"]}

        def patch(self, task_id, data, closed_by=None, reopen_checked=False):
            recus.append(data)
            return {"id": TASK_ID, "status": data.status}

    monkeypatch.setattr(task_routes, "InterventionTaskRepository", _FauxRepo)
    monkeypatch.setattr(task_routes, "list_entity_reasons", lambda entity: MOTIFS)
    return recus


def _patch(role, corps):
    return make_client(task_routes.router, role=role).patch(
        f"/intervention-tasks/{TASK_ID}", json=corps
    )


@pytest.mark.parametrize("role", ["TECH", "RESP", "ADMIN"])
def test_remise_a_faire_avec_motif_acceptee_pour_tous_les_roles(patches, role):
    assert _patch(role, {"status": "todo", "reason_code": "TASK_REWORK"}).status_code == 200
    assert len(patches) == 1


@pytest.mark.parametrize("statut", ["done", "skipped"])
def test_remise_a_faire_avec_motif_routine_redemande_le_motif(patches, statut):
    """ROUTINE est ce que le middleware injecte quand le front n'envoie rien."""
    patches.etat["status"] = statut
    reponse = _patch("TECH", {"status": "todo", "reason_code": "ROUTINE"})
    assert reponse.status_code == 400
    audit = reponse.json()["audit"]
    assert {r["code"] for r in audit["reasons"]} == {
        "TASK_REWORK",
        "TASK_CLOSED_BY_MISTAKE",
        "OTHER",
    }
    assert patches == []


@pytest.mark.parametrize("statut", ["todo", "in_progress"])
def test_todo_depuis_todo_ou_en_cours_reste_sans_motif(patches, statut):
    patches.etat["status"] = statut
    assert _patch("TECH", {"status": "todo", "reason_code": "ROUTINE"}).status_code == 200


def test_remise_a_faire_non_verifiee_par_la_route_est_refusee(monkeypatch):
    """Tâche close entre la lecture de la route et l'écriture : 409, aucun UPDATE (ligne verrouillée)."""
    from unittest.mock import MagicMock

    from api.errors.exceptions import ConflictError
    from api.intervention_tasks.repo import InterventionTaskRepository
    from api.intervention_tasks.schemas import InterventionTaskPatch

    cur = MagicMock()
    cur.fetchone.return_value = ("done", "iv-1", "Tâche", None, None, 0, None, "u-1")
    conn = MagicMock()
    conn.cursor.return_value = cur
    repo = InterventionTaskRepository()
    monkeypatch.setattr(repo, "_get_connection", lambda: conn)
    monkeypatch.setattr(repo, "_ensure_intervention_editable", lambda *a: None)
    with pytest.raises(ConflictError):
        repo.patch("t-1", InterventionTaskPatch(status="todo"), reopen_checked=False)
    requetes = [str(c.args[0]) for c in cur.execute.call_args_list]
    assert "FOR UPDATE" in requetes[0]
    assert not any("UPDATE intervention_task" in q for q in requetes)
    conn.rollback.assert_called()
