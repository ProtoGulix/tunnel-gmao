from datetime import date
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from api.audits.declaration import audit, declare_created_id
from api.audits.middleware import REASON_CODE_ATTR, REASON_TEXT_ATTR
from api.auth.permissions import check_matrix, require_authenticated
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
from api.interventions.types import list_types, list_types_for_machine
from api.interventions.validators import (
    InterventionValidator,
    ensure_reopen_reason,
    is_reopening,
)
from api.utils.audit import list_entity_reasons
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
def list_intervention_types(
    include_inactive: bool = Query(
        False, description="Inclut les types désactivés (affichage de l'historique)"
    ),
    machine_id: UUID | None = Query(
        None,
        description="Équipement : ne renvoie que les types permis par sa classe (ADR 0031)",
    ),
):
    """Types d'intervention lus en base, triés par libellé (id = code, title, color,
    description, is_active). Actifs seulement par défaut ; avec machine_id, seulement ceux
    que la classe de l'équipement permet (tous si elle n'a pas de liste)."""
    if machine_id is not None:
        return referentiel(list_types_for_machine(machine_id, include_inactive))
    return referentiel(list_types(include_inactive))


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
        description="Filtre d'archivage (fiche imprimée). false=actives (défaut), true=archivées. "
        "Ignoré si include_printed=true",
    ),
    include_printed: bool = Query(
        False,
        description="true : toutes les interventions, archivées (fiche imprimée) comprises, "
        "pour un historique",
    ),
    tech_id: str | None = Query(None, description="Filtrer par UUID technicien pilote"),
    include_descendants: bool = Query(
        False,
        description="Avec equipement_id : inclut les interventions des équipements descendants. Ignoré sans equipement_id",
    ),
    type_inter: str | None = Query(
        None, description="CSV de types d'intervention (ex: CUR,PRE), voir GET /interventions/types"
    ),
    reported_from: date | None = Query(
        None, description="Déclarées à partir de cette date (AAAA-MM-JJ, incluse)"
    ),
    reported_to: date | None = Query(
        None, description="Déclarées jusqu'à cette date (AAAA-MM-JJ, incluse)"
    ),
) -> Dict[str, Any]:
    """Liste interventions avec filtres/sort et stats optionnelles (sans actions)"""
    intervention_repo = InterventionRepository()

    # printed ne peut pas valoir « null » dans une query string : include_printed lève le filtre
    printed_filter = None if include_printed else printed
    statuses = [s.strip() for s in status.split(',')] if status else None
    priorities = [p.strip() for p in priority.split(',')] if priority else None
    types = [t.strip() for t in type_inter.split(',') if t.strip()] if type_inter else None
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
        printed=printed_filter,
        tech_id=tech_id,
        include_descendants=include_descendants,
        types=types,
        reported_from=reported_from,
        reported_to=reported_to,
    )
    total = intervention_repo.count_all(
        search=search,
        equipement_id=equipement_id,
        statuses=statuses,
        priorities=priorities,
        printed=printed_filter,
        tech_id=tech_id,
        include_descendants=include_descendants,
        types=types,
        reported_from=reported_from,
        reported_to=reported_to,
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


def _require_route_permission(request: Request, path: str) -> None:
    """Exige le droit de la route `POST {path}` (matrice, ADR 0007) pour le rôle de l'appelant.

    Création d'une demande ou de tâches dans le même geste que l'intervention : le droit
    d'écrire sur `POST /interventions` ne suffit pas, il faut aussi celui de la route
    propre à chaque entité. Route introuvable : refus (pas de code deviné).
    """
    for route in request.app.routes:
        if getattr(route, "path", None) == path and "POST" in (
            getattr(route, "methods", None) or ()
        ):
            check_matrix(request, route)
            return
    raise ForbiddenError("Accès refusé")


def _require_secondary_permissions(request: Request, data: InterventionCreate) -> None:
    if data.request is not None:
        _require_route_permission(request, "/intervention-requests")
    if data.tasks:
        _require_route_permission(request, "/intervention-tasks")


@router.post(
    "",
    status_code=201,
    dependencies=[audit("intervention", id_from_created=True, table="intervention")],
)
def create_intervention(data: InterventionCreate, request: Request):
    """
    Crée une nouvelle intervention, en une seule transaction (ADR 0025).

    Corps : les champs de l'intervention, plus **exactement un** de `request_id` (demande
    existante) ou `request` (`demandeur_nom`, `description`, `service_id` : nouvelle demande
    d'origine « directe », sans notification ni mail), et `tasks` facultatif (champs de
    `POST /intervention-tasks` sans `intervention_id`). Un échec n'écrit rien. `request`
    exige aussi le droit de `POST /intervention-requests`, `tasks` celui de
    `POST /intervention-tasks`.

    **Audit** : routinier (règle d'audit `intervention`), aucun motif demandé : le middleware
    injecte `ROUTINE`. Un `reason_code` envoyé reste validé (`OTHER` exige `reason_text`).
    """
    _require_secondary_permissions(request, data)
    payload = data.model_dump(exclude_none=True, exclude={"request", "tasks"})
    InterventionValidator.validate_request_required(payload, has_new_request=bool(data.request))
    repo = InterventionRepository()
    user_id = getattr(request.state, "user_id", None)
    created = repo.add(
        payload,
        user_id=str(user_id) if user_id else None,
        new_request=data.request.model_dump(exclude_none=True) if data.request else None,
        tasks=data.tasks,
    )
    declare_created_id(request, created["id"])
    return single(created)


@router.put(
    "/{intervention_id}",
    dependencies=[audit("intervention", id_from_path="intervention_id", table="intervention")],
)
def update_intervention(intervention_id: str, data: InterventionIn, request: Request):
    """
    Met à jour une intervention existante.

    **Audit** : routinier (règle d'audit `intervention`), aucun motif demandé : le middleware
    injecte `ROUTINE`. Un `reason_code` envoyé reste validé (`OTHER` exige `reason_text`).

    **Réouverture** (ADR 0028) : un `status_actual` qui fait sortir l'intervention de `ferme`
    exige un motif explicite (catégorie manual ou user, décision `intervention_reopened`) :
    sinon 400 « reason_code obligatoire » avec les motifs dans `audit`. La demande liée
    clôturée repasse `acceptee` dans la même transaction, avec un événement du système.
    """
    InterventionValidator.validate_reported_date_not_null(data.model_fields_set, data.model_dump())
    repo = InterventionRepository()
    if data.status_actual is not None:
        current = repo.get_by_id(intervention_id, include_actions=False).get("status_actual")
        if is_reopening(current, data.status_actual):
            ensure_reopen_reason(
                getattr(request.state, REASON_CODE_ATTR, None),
                getattr(request.state, REASON_TEXT_ATTR, None),
                list_entity_reasons("intervention"),
            )
    return single(repo.update(intervention_id, data.model_dump(exclude_none=True)))


@router.post(
    "/{intervention_id}/force-close-request",
    dependencies=[audit("intervention", id_from_path="intervention_id", table="intervention")],
)
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


@router.post(
    "/{intervention_id}/request-pointage",
    response_model=RequestPointageOut,
    dependencies=[audit("intervention", id_from_path="intervention_id", table="intervention")],
)
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


@router.delete(
    "/{intervention_id}",
    dependencies=[audit("intervention", id_from_path="intervention_id", table="intervention")],
)
def delete_intervention(
    intervention_id: str,
    request: Request,
    request_outcome: Optional[Literal["reopen", "delete"]] = Query(
        None,
        description=(
            "Issue de la demande liée, obligatoire si l'intervention en a une : "
            "`reopen` rouvre la demande (retour à « nouvelle »), `delete` la supprime aussi."
        ),
    ),
):
    """Supprime une intervention. **Motif obligatoire** (`reason_code`, voir `GET /audit/reasons`)."""
    repo = InterventionRepository()
    user_id = getattr(request.state, "user_id", None)
    repo.delete(intervention_id, request_outcome, str(user_id) if user_id else None)
    return {"detail": "Intervention supprimée"}
