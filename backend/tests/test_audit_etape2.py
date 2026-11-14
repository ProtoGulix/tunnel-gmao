"""Étape 2 de l'audit centralisé (AUDC-22, AUDC-23) : couverture et fin des écritures par les repos.

Tests xfail(strict) : ils échouent tant que la tâche n'est pas livrée, puis la marque est
retirée par la tâche elle-même (une fois la route déclarée ou l'appel supprimé).
"""

from pathlib import Path

import pytest
from fastapi.routing import APIRoute

from api.app import app
from api.audits.declaration import find_declaration

API = Path(__file__).resolve().parents[1] / "api"

ROUTES_AUDC_22 = [
    ("PUT", "/interventions/{intervention_id}"),
    ("POST", "/interventions/{intervention_id}/force-close-request"),
    ("POST", "/interventions/{intervention_id}/request-pointage"),
    ("POST", "/intervention-requests"),
    ("POST", "/intervention-requests/repair"),
    ("DELETE", "/intervention-requests/{request_id}"),
]

ROUTES_AUDC_23 = [
    ("POST", "/intervention-tasks"),
    ("PATCH", "/intervention-tasks/{task_id}"),
    ("DELETE", "/intervention-tasks/{task_id}"),
    ("POST", "/intervention-actions"),
    ("PATCH", "/intervention-actions/{action_id}"),
    ("DELETE", "/intervention-actions/{action_id}"),
    ("POST", "/intervention-status-log"),
]


def _route(method, path):
    return next(
        r for r in app.routes if isinstance(r, APIRoute) and r.path == path and method in r.methods
    )


def _source(relative: str) -> str:
    return (API / relative).read_text(encoding="utf-8")


@pytest.mark.parametrize(("method", "path"), ROUTES_AUDC_22)
def test_routes_interventions_et_demandes_de_l_etape_2_sont_declarees(method, path):
    assert find_declaration(_route(method, path)) is not None, f"{method} {path}"


@pytest.mark.parametrize(("method", "path"), ROUTES_AUDC_23)
def test_routes_taches_actions_et_journal_de_l_etape_2_sont_declarees(method, path):
    assert find_declaration(_route(method, path)) is not None, f"{method} {path}"


def test_le_repo_des_demandes_n_appelle_plus_fn_audit_log_decision():
    assert "fn_audit_log_decision" not in _source("intervention_requests/repo.py")


def test_le_repo_des_demandes_ne_code_plus_de_motif_en_dur():
    assert "ROUTINE" not in _source("intervention_requests/repo.py")


@pytest.mark.parametrize(
    "fichier",
    [
        "intervention_tasks/repo.py",
        "intervention_actions/repo.py",
        "intervention_status_log/routes.py",
    ],
)
def test_taches_actions_et_journal_n_ecrivent_plus_l_audit_eux_memes(fichier):
    source = _source(fichier)
    assert "fn_audit_log_decision" not in source
    assert "_write_audit_log" not in source


def test_le_repo_des_actions_ne_code_plus_de_motif_task_status_en_dur():
    assert "TASK_STATUS" not in _source("intervention_actions/repo.py")


def test_le_middleware_ne_garde_plus_de_liste_d_entites_auditees_par_le_repo():
    assert "_AUDITED_BY_REPO" not in _source("audits/middleware.py")
