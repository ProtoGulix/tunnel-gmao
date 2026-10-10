"""Routes pour les équipements"""

from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from api.auth.permissions import require_authenticated
from api.equipements.repo import EquipementRepository
from api.equipements.schemas import (
    EquipementCreate,
    EquipementListPaginated,
    EquipementPatch,
    EquipementUpdate,
)
from api.utils.response import paginated, single

router = APIRouter(
    prefix="/equipements", tags=["equipements"], dependencies=[Depends(require_authenticated)]
)


@router.get("", response_model=EquipementListPaginated)
def list_equipements(
    search: str | None = Query(
        None, description="Recherche insensible à la casse sur code, nom ou affectation"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    exclude_class: str | None = Query(
        None, description="Codes de classes à exclure, séparés par virgule. Ex: POM,SCI"
    ),
    select_class: str | None = Query(
        None,
        description="Codes de classes à inclure (filtre exclusif), séparés par virgule. Ex: POM,SCI",
    ),
    select_mere: str | None = Query(
        None, description="UUID de l'équipement parent : retourne uniquement ses enfants directs"
    ),
    subtree_of: UUID | None = Query(
        None,
        description="UUID d'un équipement : retourne tous ses descendants (tout niveau), sans lui-même",
    ),
    roots_only: bool = Query(
        False, description="Retourne uniquement les équipements sans mère (racines de l'arbre)"
    ),
    sort: Literal["health", "code"] = Query(
        "health",
        description=(
            "Tri : health (défaut) = santé agrégée (la pire de l'item et de ses descendants) "
            "décroissante critical > warning > maintenance > ok, puis code ; code = par code"
        ),
    ),
):
    """Liste les équipements avec pagination et facettes par classe"""
    repo = EquipementRepository()
    exclude_list = (
        [c.strip() for c in exclude_class.split(",") if c.strip()] if exclude_class else None
    )
    select_list = (
        [c.strip() for c in select_class.split(",") if c.strip()] if select_class else None
    )
    subtree_of_str = str(subtree_of) if subtree_of else None
    items = repo.get_all(
        search=search,
        skip=skip,
        limit=limit,
        exclude_class=exclude_list,
        select_class=select_list,
        select_mere=select_mere,
        subtree_of=subtree_of_str,
        roots_only=roots_only,
        sort=sort,
    )
    total = repo.count_all(
        search=search,
        exclude_class=exclude_list,
        select_class=select_list,
        select_mere=select_mere,
        subtree_of=subtree_of_str,
        roots_only=roots_only,
    )
    facets = repo.get_facets(search=search)
    return paginated(
        items, total=total, offset=skip, limit=limit, facets={"equipement_class": facets}
    )


@router.get("/{equipement_id}")
def get_equipement(
    equipement_id: str,
    interventions_page: int = Query(1, ge=1, description="Page des interventions"),
    interventions_limit: int = Query(
        20, ge=1, le=100, description="Nombre d'interventions par page"
    ),
    include_descendants: bool | None = Query(
        None,
        description=(
            "Inclut les équipements descendants dans interventions, demandes ouvertes, "
            "occurrences préventives et santé. Défaut : vrai si l'équipement a des filles"
        ),
    ),
):
    """Récupère un équipement par ID avec ancêtres, descendants_count, children_count et interventions paginées"""
    repo = EquipementRepository()
    return single(
        repo.get_by_id(
            equipement_id,
            interventions_page=interventions_page,
            interventions_limit=interventions_limit,
            include_descendants=include_descendants,
        )
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def create_equipement(data: EquipementCreate):
    """Crée un nouvel équipement"""
    repo = EquipementRepository()
    return single(repo.add(data.model_dump(exclude_unset=True)))


@router.put("/{equipement_id}")
def update_equipement(equipement_id: str, data: EquipementUpdate):
    """Remplace complètement un équipement (tous les champs non envoyés passent à null)"""
    repo = EquipementRepository()
    return single(repo.update(equipement_id, data.model_dump()))


@router.patch("/{equipement_id}")
def patch_equipement(equipement_id: str, data: EquipementPatch):
    """Met à jour partiellement un équipement (seuls les champs envoyés sont modifiés)"""
    repo = EquipementRepository()
    return single(repo.update(equipement_id, data.model_dump(exclude_unset=True)))


@router.delete("/{equipement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipement(equipement_id: str):
    """Supprime un équipement"""
    repo = EquipementRepository()
    repo.delete(equipement_id)
    return None


@router.get("/{equipement_id}/stats")
def get_equipement_stats(
    equipement_id: str,
    start_date: str | None = Query(None, description="Date de début (YYYY-MM-DD), optionnel"),
    end_date: str | None = Query(None, description="Date de fin (YYYY-MM-DD), défaut = maintenant"),
):
    """Récupère les statistiques détaillées d'un équipement"""
    repo = EquipementRepository()
    return single(repo.get_stats_by_id(equipement_id, start_date=start_date, end_date=end_date))


@router.get("/{equipement_id}/health")
def get_equipement_health(
    equipement_id: str,
    include_descendants: bool | None = Query(
        None,
        description="Santé du plus dégradé entre l'équipement et ses descendants. Défaut : vrai si l'équipement a des filles",
    ),
):
    """Récupère uniquement le health d'un équipement (ultra-léger)"""
    repo = EquipementRepository()
    return single(repo.get_health_by_id(equipement_id, include_descendants=include_descendants))
