from datetime import date
from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from api.auth.permissions import require_authenticated
from api.intervention_actions.repo import InterventionActionRepository
from api.intervention_actions.schemas import InterventionActionIn, InterventionActionPatch
from api.utils.response import single

router = APIRouter(
    prefix="/intervention-actions",
    tags=["intervention-actions"],
    dependencies=[Depends(require_authenticated)],
)


@router.get("")
def list_actions(
    start_date: Optional[date] = Query(
        None, description="Date de début incluse (YYYY-MM-DD). Défaut : aujourd'hui"
    ),
    end_date: Optional[date] = Query(
        None, description="Date de fin incluse (YYYY-MM-DD). Défaut : aujourd'hui"
    ),
    tech_id: Optional[UUID] = Query(None, description="Filtre sur l'UUID du technicien"),
    task_id: Optional[UUID] = Query(None, description="Filtre sur l'UUID de la tâche"),
) -> Dict[str, Any]:
    """Liste les actions groupées par date, du plus récent au plus ancien"""
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date
    repo = InterventionActionRepository()
    data = repo.get_all(
        date_from=start_date,
        date_to=end_date,
        tech_id=str(tech_id) if tech_id else None,
        task_id=str(task_id) if task_id else None,
    )
    return single(data, audit_entity="action")


@router.get("/{action_id}")
def get_action(action_id: str) -> Dict[str, Any]:
    """Récupère une action par ID avec le contexte complet de l'intervention parente"""
    repo = InterventionActionRepository()
    data = repo.get_by_id(action_id)
    return single(data, audit_entity="action")


@router.post("")
def add_action(action: InterventionActionIn, request: Request):
    """
    Ajoute une action à une intervention.

    **Audit obligatoire** : le champ `reason_code` est requis (voir `GET /audit/reasons`).
    `reason_text` est obligatoire si `reason_code=OTHER`.

    Les tâches listées dans `tasks` sont liées à l'action via la table M2M
    et leur statut est mis à jour (todo→in_progress, ou done/skipped selon les flags).
    Ignorer une étape obligatoire de gamme est réservé aux rôles RESP et ADMIN (403).
    """
    repo = InterventionActionRepository()
    return single(repo.add(action.model_dump(), role=getattr(request.state, "role", None)))


@router.patch("/{action_id}")
def patch_action(action_id: str, patch: InterventionActionPatch, request: Request):
    """
    Met à jour partiellement une action d'intervention.

    **Audit obligatoire** : le champ `reason_code` est requis (voir `GET /audit/reasons`).
    `reason_text` est obligatoire si `reason_code=OTHER`.
    """
    repo = InterventionActionRepository()
    role = getattr(request.state, "role", None)
    return single(repo.update(action_id, patch.model_dump(exclude_none=True), role=role))


@router.delete("/{action_id}", status_code=204)
def delete_action(action_id: str):
    """
    Supprime une action d'intervention.

    Bloqué si l'intervention parente est fermée, ou si une demande d'achat
    liée à l'action a déjà été dispatchée (statut dérivé hors "à dispatcher").
    """
    repo = InterventionActionRepository()
    repo.delete(action_id)
