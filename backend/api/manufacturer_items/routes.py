from typing import Optional

from fastapi import APIRouter, Depends, Query, Request

from api.audits.declaration import audit, declare_created_id
from api.auth.permissions import require_authenticated
from api.manufacturer_items.repo import ManufacturerItemRepository
from api.manufacturer_items.schemas import ManufacturerItemIn
from api.utils.response import paginated, single

router = APIRouter(
    prefix="/manufacturer-items",
    tags=["manufacturer-items"],
    dependencies=[Depends(require_authenticated)],
)


@router.get("")
def list_manufacturer_items(
    skip: int = Query(0, ge=0, description="Offset de pagination"),
    limit: int = Query(100, ge=1, le=1000, description="Nombre max d'éléments par page"),
    search: Optional[str] = Query(None, description="Recherche par nom fabricant ou référence"),
):
    """Liste les références fabricants avec pagination et recherche"""
    repo = ManufacturerItemRepository()
    items = repo.get_all(limit=limit, offset=skip, search=search)
    total = repo.count_all(search=search)
    return paginated(items, total=total, offset=skip, limit=limit)


@router.get("/{item_id}")
def get_manufacturer_item(item_id: str):
    """Récupère une référence fabricant avec ses références fournisseurs liées"""
    repo = ManufacturerItemRepository()
    return single(repo.get_by_id_with_suppliers(item_id))


@router.post("", status_code=201, dependencies=[audit("manufacturer_item", id_from_created=True)])
def create_manufacturer_item(data: ManufacturerItemIn, request: Request):
    """Crée une nouvelle référence fabricant"""
    repo = ManufacturerItemRepository()
    created = repo.add(data.model_dump())
    declare_created_id(request, created["id"])
    return single(created)


@router.patch("/{item_id}", dependencies=[audit("manufacturer_item", id_from_path="item_id")])
def patch_manufacturer_item(item_id: str, data: ManufacturerItemIn):
    """Met à jour une référence fabricant"""
    repo = ManufacturerItemRepository()
    return single(repo.update(item_id, data.model_dump(exclude_none=True)))


@router.delete(
    "/{item_id}",
    status_code=204,
    dependencies=[audit("manufacturer_item", id_from_path="item_id")],
)
def delete_manufacturer_item(item_id: str):
    """Supprime une référence fabricant"""
    repo = ManufacturerItemRepository()
    repo.delete(item_id)
