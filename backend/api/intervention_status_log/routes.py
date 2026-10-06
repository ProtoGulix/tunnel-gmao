from typing import List

from fastapi import APIRouter, Depends, Query, Request

from api.audits.middleware import _DIFF_IGNORE, _write_audit_log
from api.auth.permissions import require_authenticated
from api.errors.exceptions import ValidationError
from api.intervention_status_log.repo import InterventionStatusLogRepository
from api.intervention_status_log.schemas import InterventionStatusLogIn, InterventionStatusLogOut
from api.utils.audit import resolve_reason_code

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


@router.post("", response_model=InterventionStatusLogOut, status_code=201)
def create_status_log(log: InterventionStatusLogIn, request: Request):
    """
    Crée un nouveau log de changement de statut

    Le trigger DB synchronisera automatiquement le statut de l'intervention.

    Règles de validation:
    - intervention_id, status_to, technician_id, date sont obligatoires
    - status_from doit correspondre au statut actuel de l'intervention (sauf si null)
    - Toutes les transitions de statut sont autorisées
    """
    # Comme l'AuditMiddleware : sans reason_code (le mobile n'en envoie pas), on prend
    # la raison de la règle « routine » de l'entité, sinon on refuse avant d'écrire.
    payload_fields = [f for f in log.model_fields_set if f not in _DIFF_IGNORE]
    routine_rule = resolve_reason_code("intervention", payload_fields)
    if routine_rule is None:
        raise ValidationError("reason_code obligatoire pour cette mutation")

    repo = InterventionStatusLogRepository()
    try:
        created = repo.add(log.model_dump())
    except ValueError as e:
        raise ValidationError(str(e)) from e

    # ADR 0005 : l'auteur réel (jeton) est tracé dans audit_log.changed_by, alors que
    # technician_id reste déclaratif. Une panne d'audit n'interrompt pas la réponse.
    _write_audit_log(
        entity_type="intervention",
        entity_id_str=str(log.intervention_id),
        decision_type="status_changed",
        old_value={"status": log.status_from} if log.status_from else None,
        new_value={"status": log.status_to},
        reason_code=routine_rule["default_reason_code"],
        reason_text=None,
        request=request,
    )
    return created
