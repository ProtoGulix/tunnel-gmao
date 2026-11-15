from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query, Request, Response

from api.audits.declaration import audit, declare_created_id
from api.audits.middleware import REASON_CODE_ATTR
from api.auth.permissions import require_authenticated
from api.errors.exceptions import ValidationError
from api.intervention_tasks.repo import InterventionTaskRepository
from api.intervention_tasks.schemas import (
    InterventionTaskIn,
    InterventionTaskPatch,
)
from api.intervention_tasks.validators import (
    ensure_can_close,
    ensure_can_skip,
    ensure_explicit_close_reason,
)
from api.utils.audit import list_entity_reasons
from api.utils.response import single

router = APIRouter(
    prefix="/intervention-tasks",
    tags=["Intervention Tasks"],
    dependencies=[Depends(require_authenticated)],
)


@router.get("")
def list_tasks(
    intervention_id: Optional[str] = Query(None, description="Filtrer par intervention"),
    machine_id: Optional[str] = Query(None, description="Filtrer par équipement (machine_id)"),
    assigned_to: Optional[str] = Query(None, description="UUID technicien assigné ou 'unassigned'"),
    status: Optional[str] = Query(None, description="Valeurs CSV : todo,in_progress,done,skipped"),
    origin: Optional[str] = Query(None, description="Valeurs CSV : plan,resp,tech"),
    include_done: bool = Query(False, description="Inclure les tâches done et skipped"),
    q: Optional[str] = Query(
        None, description="Recherche full-text sur label, titre et code intervention"
    ),
    skip: int = Query(0, ge=0, description="Offset (nombre d'interventions à sauter)"),
    limit: int = Query(20, ge=1, le=200, description="Nombre d'interventions par page"),
    include_actions: bool = Query(False, description="Inclure les actions liées aux tâches"),
    include_options: bool = Query(
        False, description="Inclure listes de filtres (users, interventions)"
    ),
    include_counters: bool = Query(False, description="Inclure compteurs globaux"),
) -> Dict[str, Any]:
    """Liste les tâches groupées par intervention.

    Retourne `{ items, pagination, audit }` — chaque item est une intervention
    contenant ses tâches. Compatible avec GET /tasks/workspace (même mécanique).
    """
    repo = InterventionTaskRepository()
    status_list = [s.strip() for s in status.split(",")] if status else None
    origin_list = [o.strip() for o in origin.split(",")] if origin else None

    # Filtre intervention_id injecté dans assignee_id n'est pas la bonne approche —
    # on passe intervention_id comme filtre SQL direct dans get_workspace via q
    # Pour compatibilité : si intervention_id fourni, on l'ajoute au filtre assignee
    result = repo.get_workspace(
        q=q,
        status=status_list,
        origin=origin_list,
        assignee_id=assigned_to,
        intervention_id=intervention_id,
        machine_id=machine_id,
        skip=skip,
        limit=limit,
        include_closed=include_done,
        include_actions=include_actions,
        include_options=include_options,
        include_counters=include_counters,
    )
    # Import lazy pour éviter la circularité avec audits.repo
    from api.utils.audit import get_audit_rules

    result["audit"] = get_audit_rules("task")
    return result


@router.get("/progress")
def get_progress(
    intervention_id: Optional[str] = Query(None),
    occurrence_id: Optional[str] = Query(None),
):
    """Calcule la progression des tâches pour une intervention ou une occurrence."""
    repo = InterventionTaskRepository()
    if intervention_id:
        return single(repo.get_progress(intervention_id))
    if occurrence_id:
        return single(repo.get_progress_by_occurrence(occurrence_id))
    raise ValidationError("intervention_id ou occurrence_id requis")


@router.get("/{task_id}")
def get_task(task_id: str) -> Dict[str, Any]:
    """Récupère une tâche par ID."""
    repo = InterventionTaskRepository()
    data = repo.get_by_id(task_id)
    return single(data, audit_entity="task")


@router.post(
    "",
    status_code=201,
    dependencies=[audit("task", id_from_created=True, table="intervention_task")],
)
def create_task(request: Request, data: InterventionTaskIn):
    """
    Crée une tâche manuelle (origin `resp` ou `tech` uniquement).

    **Audit** : le motif est validé par AuditMiddleware (`reason_code` du corps, voir
    `GET /audit/reasons`) ; une règle routine s'applique si le corps n'en porte pas.
    """
    user_id = str(getattr(request.state, "user_id", None) or "")
    repo = InterventionTaskRepository()
    created = repo.create(data, created_by=user_id or None)
    declare_created_id(request, created["id"])
    return single(created)


@router.patch(
    "/{task_id}",
    dependencies=[audit("task", id_from_path="task_id", table="intervention_task")],
)
def patch_task(request: Request, task_id: str, data: InterventionTaskPatch):
    """
    Met à jour partiellement une tâche.

    Champs modifiables : `label`, `status` (`todo`, `skipped` ou `done` via PATCH direct),
    `skip_reason`, `assigned_to`, `due_date`, `sort_order`.

    La transition vers `in_progress` passe par une action (`POST /intervention-actions`).
    `done` peut aussi être posé par PATCH sans action (ADR 0016) : réservé aux rôles
    RESP et ADMIN (403). Tout passage direct vers `done` ou `skipped` exige un motif
    explicite (catégorie manual ou user, entité task) : sinon 400 « reason_code
    obligatoire » avec la liste des motifs dans `audit`. Pour `skipped`, `skip_reason`
    est alors facultatif (libellé du motif, plus `reason_text`).

    Ignorer une étape obligatoire de gamme est réservé aux rôles RESP et ADMIN (403).

    **Audit** : le motif est validé par AuditMiddleware (`reason_code` du corps) ; une règle
    routine s'applique si les champs modifiés en ont une. `reason_text` est obligatoire si
    `reason_code=OTHER`.
    """
    user_id = str(getattr(request.state, "user_id", None) or "")
    repo = InterventionTaskRepository()
    if data.status == "done":
        ensure_can_close(getattr(request.state, "role", None))
    if data.status == "skipped":
        ensure_can_skip(repo.get_by_id(task_id), getattr(request.state, "role", None))
    if data.status in ("done", "skipped"):
        label = ensure_explicit_close_reason(
            data.reason_code or getattr(request.state, REASON_CODE_ATTR, None),
            data.reason_text,
            list_entity_reasons("task"),
            data.status,
        )
        if data.status == "skipped" and not (data.skip_reason or "").strip():
            # Le motif choisi tient lieu de raison d'abandon (ADR 0016)
            data.skip_reason = (
                f"{label} : {data.reason_text.strip()}"
                if (data.reason_text or "").strip()
                else label
            )
    return single(repo.patch(task_id, data, closed_by=user_id or None))


@router.delete(
    "/{task_id}",
    status_code=204,
    dependencies=[audit("task", id_from_path="task_id", table="intervention_task")],
)
def delete_task(task_id: str):
    """
    Supprime une tâche.

    Conditions : statut `todo` ET aucune action liée.
    La suppression est tracée dans l'audit log avec le `reason_code` fourni.
    """
    # Le middleware exige le motif et écrit la ligne `deleted`.
    repo = InterventionTaskRepository()
    repo.delete(task_id)
    return Response(status_code=204)
