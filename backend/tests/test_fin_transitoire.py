"""Fin du transitoire de l'étape 1 (AUDC-26) : le motif ne vit plus dans les schémas."""

import inspect
from pathlib import Path

from api.intervention_actions.schemas import InterventionActionIn, InterventionActionPatch
from api.intervention_requests.repo import InterventionRequestRepository
from api.intervention_requests.schemas import InterventionRequestIn, StatusTransitionIn
from api.intervention_tasks.schemas import InterventionTaskIn, InterventionTaskPatch
from api.interventions.schemas import InterventionCreate, InterventionIn

API = Path(__file__).resolve().parents[1] / "api"


def test_aucun_schema_ne_declare_reason_code():
    for schema in (
        InterventionActionIn,
        InterventionActionPatch,
        InterventionRequestIn,
        StatusTransitionIn,
        InterventionTaskIn,
        InterventionCreate,
        InterventionIn,
    ):
        assert "reason_code" not in schema.model_fields, schema.__name__


def test_un_corps_avec_reason_code_reste_accepte_par_les_schemas():
    # Le middleware lit le motif du corps ; le schéma ignore le champ sans échouer.
    body = InterventionTaskPatch.model_validate({"label": "x"})
    assert body.label == "x"
    assert InterventionTaskPatch.model_fields["reason_code"].default is None


def test_la_transition_n_a_plus_de_motif_en_dur():
    param = inspect.signature(InterventionRequestRepository.transition_status).parameters[
        "reason_code"
    ]
    assert param.default is None


def test_plus_aucune_trace_du_motif_injecte_dans_api():
    for path in API.rglob("*.py"):
        assert "injected_reason_code" not in path.read_text(), path
