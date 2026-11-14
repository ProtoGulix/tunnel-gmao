from typing import List

from fastapi import APIRouter, Depends, Query, Request

from api.audits.declaration import audit
from api.audits.events import record_audit_event
from api.auth.permissions import require_authenticated
from api.errors.exceptions import ValidationError
from api.intervention_status_log.repo import InterventionStatusLogRepository
from api.intervention_status_log.schemas import InterventionStatusLogIn, InterventionStatusLogOut

router = APIRouter(
    prefix="/intervention-status-log",
    tags=["intervention-status-log"],
    dependencies=[Depends(require_authenticated)],
)


@router.get("", response_model=List[InterventionStatusLogOut])
def list_status_logs(
    intervention_id: str | None = Query(None, description="Filtrer par intervention_id"),
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(100, ge=1, le=1000, description="Nombre maximum d'éléments à retourner"),
):
    """Liste tous les logs de changement de statut avec filtres optionnels"""
    repo = InterventionStatusLogRepository()
    return repo.get_all(intervention_id=intervention_id, limit=limit, offset=skip)


@router.get("/{log_id}", response_model=InterventionStatusLogOut)
def get_status_log(log_id: str):
    """Récupère un log de changement de statut par ID"""
    repo = InterventionStatusLogRepository()
    return repo.get_by_id(log_id)


@router.post(
    "",
    response_model=InterventionStatusLogOut,
    status_code=201,
    dependencies=[audit("intervention", events_only=True)],
)
def create_status_log(log: InterventionStatusLogIn, request: Request):
    """
    Crée un nouveau log de changement de statut

    Le trigger DB synchronisera automatiquement le statut de l'intervention.

    Règles de validation:
    - intervention_id, status_to, technician_id, date sont obligatoires
    - status_from doit correspondre au statut actuel de l'intervention (sauf si null)
    - Toutes les transitions de statut sont autorisées
    """
    repo = InterventionStatusLogRepository()
    try:
        created = repo.add(log.model_dump())
    except ValueError as e:
        raise ValidationError(str(e)) from e

    # Le motif est celui de la requête (règle routinière injectée par le middleware, ou motif
    # explicite) ; l'auteur est celui du jeton (ADR 0005), technician_id reste déclaratif.
    record_audit_event(
        "intervention",
        log.intervention_id,
        "status_changed",
        old_value={"status": log.status_from} if log.status_from else None,
        new_value={"status": log.status_to},
    )
    return created
