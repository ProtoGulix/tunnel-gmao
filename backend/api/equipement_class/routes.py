"""Routes API pour les classes d'équipement"""

from fastapi import APIRouter, Depends, Request, status

from api.audits.declaration import audit, declare_created_id
from api.auth.permissions import require_authenticated
from api.utils.response import single

from .repo import EquipementClassRepository
from .schemas import (
    AllowedInterventionTypesUpdate,
    EquipementClass,
    EquipementClassCreate,
    EquipementClassUpdate,
)

router = APIRouter(
    prefix="/equipement-class",
    tags=["equipement-class"],
    dependencies=[Depends(require_authenticated)],
)
repo = EquipementClassRepository()


@router.get("", response_model=list[EquipementClass])
def list_equipement_classes():
    """Liste toutes les classes d'équipement"""
    return repo.get_all()


@router.get("/{class_id}")
def get_equipement_class(class_id: str):
    """Récupère une classe d'équipement par ID"""
    return single(repo.get_by_id(class_id))


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    dependencies=[audit("equipement_class", id_from_created=True)],
)
def create_equipement_class(data: EquipementClassCreate, request: Request):
    """Crée une nouvelle classe d'équipement"""
    created = repo.create(code=data.code, label=data.label, description=data.description)
    declare_created_id(request, created["id"])
    return single(created)


@router.patch("/{class_id}", dependencies=[audit("equipement_class", id_from_path="class_id")])
def update_equipement_class(class_id: str, data: EquipementClassUpdate):
    """Met à jour une classe d'équipement"""
    return single(
        repo.update(
            class_id=class_id, code=data.code, label=data.label, description=data.description
        )
    )


@router.get("/{class_id}/intervention-types")
def get_allowed_intervention_types(class_id: str):
    """Codes des types d'intervention permis pour la classe (liste vide = tous permis)"""
    return single({"intervention_types": repo.get_by_id(class_id)["allowed_intervention_types"]})


@router.put(
    "/{class_id}/intervention-types",
    dependencies=[audit("equipement_class", id_from_path="class_id")],
)
def replace_allowed_intervention_types(class_id: str, data: AllowedInterventionTypesUpdate):
    """Remplace la liste des types permis de la classe (ADR 0031) ; renvoie la classe"""
    return single(repo.replace_allowed_types(class_id, data.intervention_types))


@router.delete(
    "/{class_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[audit("equipement_class", id_from_path="class_id")],
)
def delete_equipement_class(class_id: str):
    """Supprime une classe d'équipement"""
    repo.delete(class_id)
    return None
