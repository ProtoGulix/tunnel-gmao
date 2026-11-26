from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Request

from api.audits.declaration import audit, declare_created_id
from api.audits.middleware import REASON_CODE_ATTR, REASON_TEXT_ATTR
from api.auth.permissions import require_authenticated, require_role
from api.constats.repo import ConstatRepository
from api.constats.schemas import ConstatCorrectionIn, ConstatIn, ConstatLinkIn
from api.constats.validators import ensure_correction_reason
from api.notifications.mailer import send_di_a_traiter_mails
from api.utils.audit import list_entity_reasons
from api.utils.response import referentiel, single

router = APIRouter(tags=["constats"], dependencies=[Depends(require_authenticated)])

repo = ConstatRepository()

# Saisie et correction : terrain et pilotage. ACHETEUR et MCP (lecture seule) sont refusés.
_writers = Depends(require_role("TECH", "RESP", "ADMIN"))
# Rattachement : décision du référent (ADR 0043 point 6)
_referent = Depends(require_role("RESP", "ADMIN"))


def _identity(request: Request) -> tuple[str | None, str | None]:
    """Auteur (jeton) et rôle de la requête : jamais lus dans le corps."""
    user_id = str(getattr(request.state, "user_id", None) or "") or None
    return user_id, getattr(request.state, "role", None)


@router.get("/constats/questions")
def list_questions():
    """Questions et choix actifs du constat, dans l'ordre de l'écran."""
    return referentiel(repo.list_questions())


@router.get("/interventions/{intervention_id}/constats")
def list_intervention_constats(intervention_id: UUID, request: Request):
    """Constats d'une intervention (versions courantes), `can_correct` pour l'utilisateur."""
    user_id, role = _identity(request)
    return referentiel(repo.list_for_intervention(str(intervention_id), user_id, role))


@router.post(
    "/interventions/{intervention_id}/constats",
    status_code=201,
    dependencies=[_writers, audit("constat", id_from_created=True, table="constat")],
)
def create_constat(
    intervention_id: UUID,
    data: ConstatIn,
    background_tasks: BackgroundTasks,
    request: Request,
):
    """
    Crée un constat, et sa demande d'intervention (même transaction) si un choix coché la
    génère (`creates_request`) ; sinon `request_id` est `null`.

    Accepté après la clôture, refusé si l'intervention est archivée, ou si un choix exclusif
    est combiné à un autre de sa question. La demande est notifiée comme toute demande
    signalée ; son type préconisé vient du premier choix coché qui en porte un.
    **Audit** : routinier.
    """
    user_id, role = _identity(request)
    constat_id = repo.create(
        str(intervention_id),
        str(data.machine_id) if data.machine_id else None,
        data.choices,
        user_id,
    )
    declare_created_id(request, constat_id)
    created = repo.get_by_id(constat_id, user_id, role)
    if created["request_id"]:
        background_tasks.add_task(send_di_a_traiter_mails, str(created["request_id"]))
    return single(created)


@router.get("/constats/by-request/{request_id}")
def get_constat_by_request(request_id: UUID, request: Request):
    """Version courante du constat dont la demande est issue (404 sinon)."""
    user_id, role = _identity(request)
    return single(repo.get_by_request(str(request_id), user_id, role))


@router.get("/constats/{constat_id}/improvement-ideas")
def list_improvement_ideas(constat_id: UUID):
    """Idées d'amélioration ouvertes (type préconisé PRO) de la machine du constat."""
    return referentiel(repo.list_improvement_ideas(str(constat_id)))


@router.post(
    "/constats/{constat_id}/corrections",
    status_code=201,
    dependencies=[_writers, audit("constat", id_from_path="constat_id", table="constat")],
)
def correct_constat(
    constat_id: UUID,
    data: ConstatCorrectionIn,
    background_tasks: BackgroundTasks,
    request: Request,
) -> Dict[str, Any]:
    """
    Corrige un constat : une nouvelle version remplace la précédente.

    Réservé à l'auteur, ou à RESP et ADMIN. Avec demande, tant qu'elle est « nouvelle » (sinon
    400) : elle est mise à jour, sans jamais être retirée. Sans demande, tant que l'intervention
    n'est pas archivée : si la nouvelle version génère une demande, elle est créée.
    **Audit** : motif explicite de décision `constat_corrected` (sans motif, 400 avec la
    liste dans `audit`).
    """
    user_id, role = _identity(request)
    ensure_correction_reason(
        getattr(request.state, REASON_CODE_ATTR, None),
        getattr(request.state, REASON_TEXT_ATTR, None),
        list_entity_reasons("constat"),
    )
    had_request = repo.get_by_id(str(constat_id), user_id, role)["request_id"] is not None
    new_id = repo.correct(
        str(constat_id),
        str(data.machine_id) if data.machine_id else None,
        data.choices,
        user_id,
        role,
    )
    corrected = repo.get_by_id(new_id, user_id, role)
    if corrected["request_id"] and not had_request:
        background_tasks.add_task(send_di_a_traiter_mails, str(corrected["request_id"]))
    return single(corrected)


@router.post(
    "/constats/{constat_id}/link",
    dependencies=[_referent, audit("constat", id_from_path="constat_id", table="constat")],
)
def link_constat(constat_id: UUID, data: ConstatLinkIn, request: Request):
    """
    Rattache le constat à une idée d'amélioration ouverte de sa machine (RESP, ADMIN).

    La demande du constat est rejetée en doublon (REJECT_DUPLICATE, ADR 0038). Refusé si
    le constat n'a pas de demande, si elle n'est plus « nouvelle » ou « en_attente », ou si
    le constat est déjà rattaché.
    """
    user_id, role = _identity(request)
    repo.link_to_idea(str(constat_id), str(data.request_id), user_id)
    return single(repo.get_by_id(str(constat_id), user_id, role))
