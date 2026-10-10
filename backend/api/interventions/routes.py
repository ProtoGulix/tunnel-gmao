from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, Request

from api.auth.permissions import require_authenticated
from api.constants import INTERVENTION_TYPES
from api.equipements.schemas import EquipementDetail
from api.errors.exceptions import ForbiddenError, UnauthorizedError
from api.intervention_actions.repo import InterventionActionRepository
from api.intervention_actions.schemas import InterventionActionOut

# Résolution des références circulaires : InterventionOut.request référence
# InterventionRequestListItem (intervention_requests.schemas → interventions.schemas)
from api.intervention_requests.schemas import InterventionRequestListItem
from api.intervention_status_log.schemas import InterventionStatusLogOut
from api.intervention_tasks.schemas import InterventionTaskOut, TaskProgressOut
from api.interventions.repo import InterventionRepository
from api.interventions.schemas import (
    InterventionCreate,
    InterventionIn,
    InterventionOut,
    InterventionStats,
    RequestPointageIn,
    RequestPointageOut,
)
from api.interventions.validators import InterventionValidator
from api.utils.response import paginated, referentiel, single

InterventionOut.model_rebuild(
    _types_namespace={
        "Optional": Optional,
        "List": List,
        "InterventionRequestListItem": InterventionRequestListItem,
        "InterventionActionOut": InterventionActionOut,
        "InterventionStatusLogOut": InterventionStatusLogOut,
        "TaskProgressOut": TaskProgressOut,
        "InterventionTaskOut": InterventionTaskOut,
        "EquipementDetail": EquipementDetail,
        "InterventionStats": InterventionStats,
    }
)

router = APIRouter(
    prefix="/interventions", tags=["interventions"], dependencies=[Depends(require_authenticated)]
)


def add_stats_to_intervention(intervention: Dict[str, Any], actions: List[Dict[str, Any]]) -> None:
    """Ajoute les stats calculées à une intervention"""
    intervention["actions"] = actions
    intervention["total_time"] = sum(a.get("time_spent") or 0 for a in actions)
    intervention["action_count"] = len(actions)
    complexities = [a.get("complexity_score") for a in actions if a.get("complexity_score")]
    intervention["avg_complexity"] = (
        round(sum(complexities) / len(complexities), 2) if complexities else None
    )


@router.get("/types")
def list_intervention_types():
    """Liste tous les types d'intervention disponibles (id, title, color)"""
    return referentiel(INTERVENTION_TYPES)


@router.get("")
def list_interventions(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: str | None = Query(
        None,
        description="Recherche insensible à la casse sur code, titre, code équipement ou nom équipement",
    ),
    equipement_id: str | None = Query(None, description="Filtre intervention.machine_id"),
    status: str | None = Query(
        None, description="CSV de codes statut (ex: open,in_progress,ferme)"
    ),
    priority: str | None = Query(
        None, description="CSV de priorités (faible,normale,important,urgent)"
    ),
    sort: str | None = Query(None, description="Ex: -priority,-reported_date ou -reported_date"),
    include: str | None = Query(None, description="Ex: stats"),
    printed: bool | None = Query(
        False,
        description="Filtre par statut d'impression/archivage. false=actives (défaut), true=archivées, null=toutes",
    ),
    tech_id: str | None = Query(None, description="Filtrer par UUID technicien pilote"),
    include_descendants: bool = Query(
        False,
        description="Avec equipement_id : inclut les interventions des équipements descendants. Ignoré sans equipement_id",
    ),
) -> Dict[str, Any]:
    """Liste interventions avec filtres/sort et stats optionnelles (sans actions)"""
    intervention_repo = InterventionRepository()

    statuses = [s.strip() for s in status.split(',')] if status else None
    priorities = [p.strip() for p in priority.split(',')] if priority else None
    include_list = [i.strip() for i in include.split(',')] if include else []
    include_stats = (include is None) or ("stats" in include_list)
    include_tasks = "tasks" in include_list

    items = intervention_repo.get_all(
        limit=limit,
        offset=skip,
        search=search,
        equipement_id=equipement_id,
        statuses=statuses,
        priorities=priorities,
        sort=sort,
        include_stats=include_stats,
        include_tasks=include_tasks,
        printed=printed,
        tech_id=tech_id,
        include_descendants=include_descendants,
    )
    total = intervention_repo.count_all(
        search=search,
        equipement_id=equipement_id,
        statuses=statuses,
        priorities=priorities,
        printed=printed,
        tech_id=tech_id,
        include_descendants=include_descendants,
    )
    return paginated(items, total=total, offset=skip, limit=limit, audit_entity="intervention")


@router.get("/{intervention_id}")
def get_intervention(intervention_id: str, request: Request) -> Dict[str, Any]:
    """Récupère une intervention par ID avec ses actions et stats (calculées en SQL)"""
    intervention_repo = InterventionRepository()
    data = intervention_repo.get_by_id(intervention_id)
    return single(data, audit_entity="intervention")


@router.get("/{intervention_id}/actions")
def get_intervention_actions(intervention_id: str, request: Request):
    """Récupère les actions d'une intervention"""
    repo = InterventionActionRepository()
    return single(repo.get_by_intervention(intervention_id))


@router.post("", status_code=201)
def create_intervention(data: InterventionCreate, request: Request):
    """
    Crée une nouvelle intervention.

    **Audit obligatoire** : le champ `reason_code` est requis (voir `GET /audit/reasons`).
    `reason_text` est obligatoire si `reason_code=OTHER`.
    """
    payload = data.model_dump(exclude_none=True)
    InterventionValidator.validate_request_required(payload)
    repo = InterventionRepository()
    return single(repo.add(payload))


@router.put("/{intervention_id}")
def update_intervention(intervention_id: str, data: InterventionIn, request: Request):
    """
    Met à jour une intervention existante.

    **Audit obligatoire** : le champ `reason_code` est requis (voir `GET /audit/reasons`).
    `reason_text` est obligatoire si `reason_code=OTHER`.
    """
    repo = InterventionRepository()
    return single(repo.update(intervention_id, data.model_dump(exclude_none=True)))


@router.post("/{intervention_id}/force-close-request")
def force_close_linked_request(intervention_id: str, request: Request):
    """
    Force la clôture de la demande d'intervention liée quand la cascade automatique a échoué.

    Conditions requises :
    - L'intervention doit être au statut `ferme`
    - Une demande liée doit être encore en statut `acceptee`

    Retourne l'intervention mise à jour avec la demande désormais `cloturee`.
    """
    repo = InterventionRepository()
    return single(repo.force_close_request(intervention_id))


@router.post("/{intervention_id}/request-pointage", response_model=RequestPointageOut)
def request_pointage(intervention_id: str, data: RequestPointageIn, request: Request):
    """
    Demande un pointage à une liste de techniciens sur cette intervention.

    Réservé au pilote de l'intervention (`intervention.tech_id`) : c'est le
    seul rôle métier actuellement porteur de ce geste (relancer son équipe
    pour pointer le temps passé), et il n'existe pas de permission dédiée
    dans `tunnel_permission`/`require_permission` pour ce cas précis — suit
    donc le même schéma d'autorisation "métier" que le reste du domaine
    `interventions` (`require_authenticated` au niveau routeur, vérification
    fine ici plutôt que via une dépendance de rôle générique).

    Aucune exclusion du pilote dans `tech_ids` (décision produit assumée).
    """
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise UnauthorizedError("Authentification utilisateur requise")

    repo = InterventionRepository()
    intervention = repo.get_by_id(intervention_id, include_actions=False)
    pilot_id = intervention.get("tech_id")
    if not pilot_id or str(pilot_id) != str(user_id):
        raise ForbiddenError("Seul le pilote de l'intervention peut demander un pointage")

    tech_ids = [str(t) for t in data.tech_ids]
    created = repo.request_pointage(intervention_id, tech_ids, requested_by=str(user_id))
    return RequestPointageOut(created=created)


@router.delete("/{intervention_id}")
def delete_intervention(intervention_id: str, request: Request):
    """Supprime une intervention"""
    repo = InterventionRepository()
    repo.delete(intervention_id)
    return {"detail": "Intervention supprimée"}
