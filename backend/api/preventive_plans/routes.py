from typing import List

from fastapi import APIRouter, Depends, Request, Response

from api.audits.declaration import audit, declare_created_id
from api.auth.permissions import require_authenticated
from api.preventive_plans.repo import PreventivePlanRepository
from api.preventive_plans.schemas import (
    GammeStepIn,
    PreventivePlanIn,
    PreventivePlanOut,
    PreventivePlanUpdate,
)
from api.utils.response import single

router = APIRouter(
    prefix="/preventive-plans",
    tags=["Preventive Plans"],
    dependencies=[Depends(require_authenticated)],
)


@router.get("", response_model=List[PreventivePlanOut])
def list_preventive_plans(active_only: bool = True):
    """Liste tous les plans de maintenance préventive"""
    repo = PreventivePlanRepository()
    return repo.get_list(active_only=active_only)


@router.get("/{plan_id}")
def get_preventive_plan(plan_id: str):
    """Récupère un plan de maintenance préventive par ID"""
    repo = PreventivePlanRepository()
    return single(repo.get_by_id(plan_id))


@router.post("", status_code=201, dependencies=[audit("preventive_plan", id_from_created=True)])
def create_preventive_plan(data: PreventivePlanIn, request: Request):
    """Crée un nouveau plan de maintenance préventive"""
    repo = PreventivePlanRepository()
    created = repo.create(data)
    declare_created_id(request, created["id"])
    return single(created)


@router.put("/{plan_id}", dependencies=[audit("preventive_plan", id_from_path="plan_id")])
def update_preventive_plan(plan_id: str, data: PreventivePlanUpdate):
    """Met à jour un plan de maintenance préventive (PATCH sémantique, code immuable)"""
    repo = PreventivePlanRepository()
    return single(repo.update(plan_id, data))


@router.patch("/{plan_id}/steps", dependencies=[audit("preventive_plan", id_from_path="plan_id")])
def replace_plan_steps(plan_id: str, steps: List[GammeStepIn]):
    """Remplace entièrement les étapes de gamme d'un plan"""
    repo = PreventivePlanRepository()
    return single(repo.replace_steps(plan_id, steps))


@router.post(
    "/{plan_id}/reactivate",
    dependencies=[audit("preventive_plan", id_from_path="plan_id")],
)
def reactivate_preventive_plan(plan_id: str):
    """Réactive un plan désactivé (changement routinier, tracé `active_changed`)"""
    repo = PreventivePlanRepository()
    return single(repo.reactivate(plan_id))


@router.delete(
    "/{plan_id}",
    status_code=204,
    dependencies=[audit("preventive_plan", id_from_path="plan_id")],
)
def delete_preventive_plan(plan_id: str):
    """Désactive un plan de maintenance préventive (soft delete)"""
    repo = PreventivePlanRepository()
    repo.soft_delete(plan_id)
    return Response(status_code=204)
