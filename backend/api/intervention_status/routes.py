from typing import Any, Dict, List

from fastapi import APIRouter, Depends

from api.auth.permissions import require_authenticated
from api.intervention_status.repo import InterventionStatusRepository

router = APIRouter(
    prefix="/intervention-status",
    tags=["intervention-status"],
    dependencies=[Depends(require_authenticated)],
)

repo = InterventionStatusRepository()


@router.get("", response_model=List[Dict[str, Any]])
def list_intervention_status():
    """Liste tous les statuts d'intervention disponibles"""
    return repo.get_all()
