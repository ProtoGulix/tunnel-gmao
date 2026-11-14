"""Routes API pour les services"""

from fastapi import APIRouter, Depends, Request, status

from api.audits.declaration import audit, declare_created_id
from api.auth.permissions import require_authenticated
from api.utils.response import single

from .repo import ServiceRepository
from .schemas import ServiceCreate, ServiceOut, ServiceUpdate

router = APIRouter(
    prefix="/services", tags=["services"], dependencies=[Depends(require_authenticated)]
)
repo = ServiceRepository()


@router.get("", response_model=list[ServiceOut])
def list_services():
    """Liste tous les services actifs"""
    return repo.get_all()


@router.get("/{service_id}")
def get_service(service_id: str):
    """Récupère un service par ID"""
    return single(repo.get_by_id(service_id))


@router.post(
    "", status_code=status.HTTP_201_CREATED, dependencies=[audit("service", id_from_created=True)]
)
def create_service(data: ServiceCreate, request: Request):
    """Crée un nouveau service"""
    created = repo.create(code=data.code, label=data.label, is_active=data.is_active)
    declare_created_id(request, created["id"])
    return single(created)


@router.patch("/{service_id}", dependencies=[audit("service", id_from_path="service_id")])
def update_service(service_id: str, data: ServiceUpdate):
    """
    Met à jour un service

    Seuls `label` et `is_active` peuvent être modifiés.
    Le `code` est immuable et ne peut pas être changé.
    """
    return single(repo.update(service_id=service_id, label=data.label, is_active=data.is_active))
