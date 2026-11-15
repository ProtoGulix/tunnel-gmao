from typing import Optional

from fastapi import APIRouter, Depends, Query, Request

from api.audits.declaration import audit, declare_created_id
from api.auth.permissions import require_authenticated
from api.parts.repo import PartRepository
from api.parts.schemas import (
    PartCreate,
    PartDetail,
    PartListItem,
    PartManufacturerRefCreate,
    PartManufacturerRefUpdate,
    PartSupplierRefCreate,
    PartSupplierRefListItem,
    PartSupplierRefUpdate,
    PartUpdate,
)
from api.utils.pagination import PaginatedResponse, SingleResponse
from api.utils.response import paginated, single

router = APIRouter(
    prefix="/parts",
    tags=["parts"],
    dependencies=[Depends(require_authenticated)],
)


@router.get("", response_model=PaginatedResponse[PartListItem])
def list_parts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    family_code: Optional[str] = Query(None),
    sub_family_code: Optional[str] = Query(None),
    search: Optional[str] = Query(
        None, description="Recherche par ref interne, ref fabricant ou désignation"
    ),
):
    """Liste les pièces du catalogue V4"""
    repo = PartRepository()
    items = repo.get_all(
        limit=limit,
        offset=skip,
        family_code=family_code,
        sub_family_code=sub_family_code,
        search=search,
    )
    total = repo.count_all(
        family_code=family_code,
        sub_family_code=sub_family_code,
        search=search,
    )
    return paginated(items, total=total, offset=skip, limit=limit)


@router.get("/supplier-refs", response_model=PaginatedResponse[PartSupplierRefListItem])
def list_supplier_refs(
    supplier_id: Optional[str] = Query(
        None, description="ID du fournisseur (optionnel — liste toutes les références si absent)"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    search: Optional[str] = Query(
        None, description="Recherche par ref interne, ref fabricant ou ref fournisseur"
    ),
):
    """Liste les références fournisseur, avec pièce et référence fabricant liées, filtrables par fournisseur"""
    repo = PartRepository()
    items = repo.get_supplier_refs_by_supplier(
        supplier_id,
        limit=limit,
        offset=skip,
        search=search,
    )
    total = repo.count_supplier_refs_by_supplier(supplier_id, search=search)
    return paginated(items, total=total, offset=skip, limit=limit)


@router.get(
    "/ref/{internal_ref}",
    response_model=SingleResponse[PartDetail],
    response_model_exclude_none=True,
)
def get_part_by_ref(internal_ref: str):
    """Récupère une pièce par sa référence interne (ex: P000042)"""
    repo = PartRepository()
    return single(repo.get_by_internal_ref(internal_ref))


@router.get(
    "/{part_id}", response_model=SingleResponse[PartDetail], response_model_exclude_none=True
)
def get_part(part_id: str):
    """Récupère une pièce par ID avec toutes ses références"""
    repo = PartRepository()
    return single(repo.get_by_id(part_id))


@router.post(
    "",
    response_model=SingleResponse[PartDetail],
    status_code=201,
    response_model_exclude_none=True,
    dependencies=[audit("part", id_from_created=True)],
)
def create_part(data: PartCreate, request: Request):
    """Crée une nouvelle pièce (internal_ref P000001 générée automatiquement)"""
    repo = PartRepository()
    created = repo.create(data.model_dump())
    declare_created_id(request, created["id"])
    return single(created)


@router.patch(
    "/{part_id}",
    response_model=SingleResponse[PartDetail],
    response_model_exclude_none=True,
    dependencies=[audit("part", id_from_path="part_id")],
)
def update_part(part_id: str, data: PartUpdate):
    """Met à jour une pièce (modification partielle)"""
    repo = PartRepository()
    return single(repo.update(part_id, data.model_dump(exclude_unset=True)))


@router.post(
    "/{part_id}/manufacturer-refs",
    response_model=SingleResponse[PartDetail],
    status_code=201,
    response_model_exclude_none=True,
    dependencies=[audit("part_manufacturer_ref", id_from_created=True)],
)
def add_manufacturer_ref(part_id: str, data: PartManufacturerRefCreate, request: Request):
    """Ajoute une référence fabricant à une pièce"""
    repo = PartRepository()
    new_id, part = repo.add_manufacturer_ref(part_id, data.model_dump())
    declare_created_id(request, new_id)
    return single(part)


@router.patch(
    "/manufacturer-refs/{mfr_ref_id}",
    response_model=SingleResponse[PartDetail],
    response_model_exclude_none=True,
    dependencies=[audit("part_manufacturer_ref", id_from_path="mfr_ref_id")],
)
def update_manufacturer_ref(mfr_ref_id: str, data: PartManufacturerRefUpdate):
    """Met à jour une référence fabricant (modification partielle)"""
    repo = PartRepository()
    return single(repo.update_manufacturer_ref(mfr_ref_id, data.model_dump(exclude_unset=True)))


@router.delete(
    "/manufacturer-refs/{mfr_ref_id}",
    response_model=SingleResponse[PartDetail],
    response_model_exclude_none=True,
    dependencies=[audit("part_manufacturer_ref", id_from_path="mfr_ref_id")],
)
def delete_manufacturer_ref(mfr_ref_id: str):
    """Supprime une référence fabricant"""
    repo = PartRepository()
    return single(repo.delete_manufacturer_ref(mfr_ref_id))


@router.post(
    "/manufacturer-refs/{mfr_ref_id}/set-preferred",
    response_model=SingleResponse[PartDetail],
    response_model_exclude_none=True,
    dependencies=[audit("part_manufacturer_ref", id_from_path="mfr_ref_id")],
)
def set_preferred_manufacturer_ref(mfr_ref_id: str):
    """Définit une référence fabricant comme préférée"""
    repo = PartRepository()
    return single(repo.set_preferred_manufacturer_ref(mfr_ref_id))


@router.post(
    "/manufacturer-refs/{mfr_ref_id}/supplier-refs",
    response_model=SingleResponse[PartDetail],
    status_code=201,
    response_model_exclude_none=True,
    dependencies=[audit("part_supplier_ref", id_from_created=True)],
)
def add_supplier_ref(mfr_ref_id: str, data: PartSupplierRefCreate, request: Request):
    """Ajoute une référence fournisseur à une référence fabricant"""
    repo = PartRepository()
    new_id, part = repo.add_supplier_ref(mfr_ref_id, data.model_dump())
    declare_created_id(request, new_id)
    return single(part)


@router.patch(
    "/supplier-refs/{supplier_ref_id}",
    response_model=SingleResponse[PartDetail],
    response_model_exclude_none=True,
    dependencies=[audit("part_supplier_ref", id_from_path="supplier_ref_id")],
)
def update_supplier_ref(supplier_ref_id: str, data: PartSupplierRefUpdate):
    """Met à jour une référence fournisseur (modification partielle)"""
    repo = PartRepository()
    return single(repo.update_supplier_ref(supplier_ref_id, data.model_dump(exclude_unset=True)))


@router.post(
    "/supplier-refs/{supplier_ref_id}/set-preferred",
    response_model=SingleResponse[PartDetail],
    response_model_exclude_none=True,
    dependencies=[audit("part_supplier_ref", id_from_path="supplier_ref_id")],
)
def set_preferred_supplier_ref(supplier_ref_id: str):
    """Définit une référence fournisseur comme préférée"""
    repo = PartRepository()
    return single(repo.set_preferred_supplier_ref(supplier_ref_id))


@router.delete(
    "/supplier-refs/{supplier_ref_id}",
    response_model=SingleResponse[PartDetail],
    response_model_exclude_none=True,
    dependencies=[audit("part_supplier_ref", id_from_path="supplier_ref_id")],
)
def delete_supplier_ref(supplier_ref_id: str):
    """Supprime une référence fournisseur"""
    repo = PartRepository()
    return single(repo.delete_supplier_ref(supplier_ref_id))
