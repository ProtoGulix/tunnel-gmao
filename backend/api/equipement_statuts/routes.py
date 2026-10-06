"""Routes API pour les statuts d'équipement"""

from fastapi import APIRouter, Depends

from api.auth.permissions import require_authenticated

from .repo import EquipementStatutRepository
from .schemas import EquipementStatut

router = APIRouter(
    prefix="/equipement-statuts",
    tags=["equipement-statuts"],
    dependencies=[Depends(require_authenticated)],
)
repo = EquipementStatutRepository()


@router.get("", response_model=list[EquipementStatut])
def list_equipement_statuts():
    """Liste tous les statuts d'équipement actifs, triés par ordre d'affichage"""
    return repo.get_all()
