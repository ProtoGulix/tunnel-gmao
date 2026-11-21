import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request

from api.audits.declaration import audit, declare_created_id
from api.audits.middleware import REASON_CODE_ATTR
from api.auth.permissions import permission_cache, require_authenticated
from api.endpoints_catalog import endpoint_code
from api.intervention_requests.repo import InterventionRequestRepository
from api.intervention_requests.schemas import (
    InterventionRequestDetail,
    InterventionRequestIn,
    InterventionRequestListItem,
    RequestStatusRef,
    StatusTransitionIn,
)
from api.intervention_requests.validators import compute_allowed_transitions

# Résolution des références circulaires : InterventionRequestListItem.intervention
# référence InterventionRef (interventions.schemas → intervention_actions.schemas → ici)
from api.interventions.schemas import InterventionRef
from api.notifications.mailer import send_di_a_traiter_mails
from api.utils.response import paginated, referentiel, single

_ns = {"Optional": Optional, "InterventionRef": InterventionRef}
InterventionRequestListItem.model_rebuild(_types_namespace=_ns)
InterventionRequestDetail.model_rebuild(_types_namespace=_ns)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/intervention-requests",
    tags=["intervention-requests"],
    dependencies=[Depends(require_authenticated)],
)

repo = InterventionRequestRepository()


def _can_transition(request: Request) -> bool:
    """Vrai si l'utilisateur courant a le droit d'appeler la route de transition."""
    if not (getattr(request.state, "user_id", None) or getattr(request.state, "api_key_id", None)):
        return True  # requête non authentifiée : non contrôlée, comme la matrice
    role = getattr(request.state, "role", None)
    if role == "ADMIN":
        return True
    route = next(
        (r for r in request.app.routes if getattr(r, "name", None) == "transition_request_status"),
        None,
    )
    if route is None or not role:
        return False
    return permission_cache.check(role, endpoint_code(route, "POST"))


def _with_allowed_transitions(item: Dict[str, Any], can_transition: bool) -> Dict[str, Any]:
    """Ajoute `allowed_transitions` à une demande (liste, détail ou réponse de transition)."""
    intervention = item.get("intervention") or {}
    item["allowed_transitions"] = compute_allowed_transitions(
        item["statut"],
        item.get("intervention_id") is not None,
        intervention.get("status_actual"),
        can_transition,
    )
    return item


@router.get("/statuses", response_model=List[RequestStatusRef])
def list_statuses():
    """Référentiel des statuts de demande d'intervention"""
    return referentiel(repo.get_statuses())


@router.get("")
def list_requests(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    statut: Optional[str] = Query(
        None, description="Statuts à inclure, séparés par virgule. Ex: cloturee,rejetee"
    ),
    exclude_statuses: Optional[str] = Query(
        None, description="Statuts à exclure, séparés par virgule. Ex: rejetee,cloturee"
    ),
    machine_id: Optional[UUID] = Query(None),
    include_descendants: bool = Query(
        False,
        description="Avec machine_id : inclut les demandes des équipements descendants. Ignoré sans machine_id",
    ),
    search: Optional[str] = Query(
        None,
        description="Recherche libre : code DI, demandeur, description, code équipement, service",
    ),
    is_system: Optional[bool] = Query(
        None, description="Filtrer les DI système (true) ou humaines (false)"
    ),
) -> Dict[str, Any]:
    """
    Liste les demandes d'intervention avec filtres.
    Retourne une réponse paginée.
    """
    machine_id_str = str(machine_id) if machine_id else None
    statut_list = [s.strip() for s in statut.split(",") if s.strip()] if statut else None
    exclude_list = (
        [s.strip() for s in exclude_statuses.split(",") if s.strip()] if exclude_statuses else None
    )
    items = repo.get_list(
        limit=limit,
        offset=skip,
        statut=statut_list,
        exclude_statuses=exclude_list,
        machine_id=machine_id_str,
        search=search,
        is_system=is_system,
        include_descendants=include_descendants,
    )
    total = repo.count_list(
        statut=statut_list,
        exclude_statuses=exclude_list,
        machine_id=machine_id_str,
        search=search,
        is_system=is_system,
        include_descendants=include_descendants,
    )
    facets = repo.get_facets(
        machine_id=machine_id_str, search=search, include_descendants=include_descendants
    )
    can_transition = _can_transition(request)
    items = [_with_allowed_transitions(i, can_transition) for i in items]
    return paginated(
        items,
        total=total,
        offset=skip,
        limit=limit,
        facets={"statut": facets},
        audit_entity="request",
    )


@router.get("/{request_id}")
def get_request(request_id: UUID, request: Request) -> Dict[str, Any]:
    """Détail d'une demande d'intervention avec son historique de statuts"""
    data = _with_allowed_transitions(repo.get_by_id(str(request_id)), _can_transition(request))
    return single(data, audit_entity="request")


@router.post(
    "",
    status_code=201,
    dependencies=[audit("request", id_from_created=True, table="intervention_request")],
)
def create_request(
    data: InterventionRequestIn, background_tasks: BackgroundTasks, request: Request
):
    """
    Crée une nouvelle demande d'intervention.
    Le code DI-YYYY-NNNN et le statut initial (nouvelle) sont générés automatiquement.

    **Audit** : routinier (règle d'audit `request`), aucun motif demandé : le middleware
    injecte `ROUTINE`. Un `reason_code` envoyé reste validé (`OTHER` exige `reason_text`).

    Toute DI créée par cette route est d'origine 'signalee' (ce schéma d'entrée n'expose pas
    de champ `origine` ; une demande 'directe', sans notification, n'est créée que par
    `POST /interventions` avec `request`, ADR 0025). Le trigger DB
    `fn_notify_di_a_traiter` a donc déjà fan-outé les notifications en base au
    moment où `repo.create()` retourne ; on déclenche ici, en tâche de fond,
    l'envoi des mails correspondants (ne doit jamais bloquer ni faire échouer
    la réponse de création).

    `created_by` (utilisateur authentifié, `request.state.user_id`) est
    transmis au repo pour que le trigger DB puisse exclure le créateur du
    fan-out de notification (voir migration 024 — un technicien ne doit pas
    être notifié de sa propre DI).
    """
    user_id = str(getattr(request.state, "user_id", None) or "") or None
    created = repo.create(data.model_dump(), created_by=user_id)
    declare_created_id(request, created["id"])
    background_tasks.add_task(send_di_a_traiter_mails, str(created["id"]))
    return single(created)


@router.post(
    "/{request_id}/transition",
    dependencies=[audit("request", id_from_path="request_id", table="intervention_request")],
)
def transition_request_status(request_id: UUID, body: StatusTransitionIn, request: Request):
    """
    Effectue une transition de statut sur une demande.

    Transitions autorisées :
    - nouvelle → en_attente, acceptee, rejetee
    - en_attente → acceptee, rejetee
    - acceptee → cloturee (refusée tant que l'intervention liée est ouverte : clore
      l'intervention, qui clôturera la demande ; la demande ne ferme jamais l'intervention)
    - rejetee → (aucune)
    - cloturee → (aucune)

    Pour le statut `acceptee`, `type_inter` et le technicien (`tech_id` ou `tech_initials`)
    sont obligatoires : ils servent à créer automatiquement l'intervention liée, avec le
    `title` reçu (à défaut, la description de la demande) et le `tech_id` reçu.

    **Audit** : le motif est validé par AuditMiddleware (`reason_code` du corps, voir
    `GET /audit/reasons`) ; une règle routine s'applique si le corps n'en porte pas.
    Pour le statut `rejetee`, le motif est porté par `reason_text` (pas de champ `notes`
    séparé) : le motif de rejet EST la raison d'audit, saisie une seule fois via le picker
    de raisons. `reason_text` est copié dans l'historique (request_status_log.notes).
    `reason_text` n'est obligatoire que si `reason_code=OTHER` (cohérent avec
    `AuditRuleReason.requires_text` exposé par `GET /audit/rules`) — les autres raisons
    du picker n'exigent pas de texte libre.
    """
    intervention_data = None
    if body.status_to == "acceptee":
        intervention_data = {
            "type_inter": body.type_inter,
            "title": body.title,
            "tech_id": str(body.tech_id) if body.tech_id else None,
            "tech_initials": body.tech_initials,
            "priority": body.priority,
            "reported_date": body.reported_date,
        }

    # Le rejet n'a pas de champ notes dédié : reason_text (raison d'audit) en tient lieu,
    # pour ne pas dupliquer la même justification via deux mécanismes distincts.
    notes = body.notes
    if body.status_to == "rejetee" and not notes:
        notes = body.reason_text

    updated = repo.transition_status(
        request_id=str(request_id),
        status_to=body.status_to,
        notes=notes,
        changed_by=str(body.changed_by) if body.changed_by else None,
        intervention_data=intervention_data,
        reason_code=getattr(request.state, REASON_CODE_ATTR, None),
    )
    return single(_with_allowed_transitions(updated, _can_transition(request)))


@router.delete(
    "/{request_id}",
    status_code=204,
    dependencies=[audit("request", id_from_path="request_id", table="intervention_request")],
)
def delete_request(request_id: UUID):
    """
    Supprime définitivement une demande d'intervention.

    Réservé aux erreurs de saisie ou doublons : refuse la suppression si une
    intervention est déjà liée à la demande (voir `repo.delete`).
    """
    repo.delete(str(request_id))


# Traitement de masse sans entité propre : seuls les événements du système déposés par le repo
# pour chaque demande réparée sont écrits.
@router.post("/repair", dependencies=[audit("request", events_only=True)])
def repair_orphaned_requests(request: Request):
    """
    Passe à `cloturee` toutes les DIs en statut `acceptee` dont l'intervention
    liée est déjà fermée.

    Utile pour corriger des données historiques où la cascade de clôture
    automatique n'a pas été déclenchée.
    Idémpotent.
    """
    return single(repo.repair_orphaned_requests())
