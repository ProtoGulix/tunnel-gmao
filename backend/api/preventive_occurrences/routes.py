from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request

from api.audits.declaration import audit
from api.audits.middleware import REASON_CODE_ATTR, REASON_TEXT_ATTR
from api.auth.permissions import require_authenticated
from api.errors.exceptions import ValidationError
from api.notifications.mailer import send_di_a_traiter_mails
from api.preventive_occurrences.repo import PreventiveOccurrenceRepository
from api.preventive_occurrences.schedule import SCHEDULE_STATES
from api.preventive_occurrences.schemas import (
    AnticipateIn,
    HistoryOut,
    PreventiveOccurrenceOut,
    ScheduleEntryOut,
)
from api.preventive_occurrences.validators import skip_reason_from_choice
from api.settings import settings
from api.utils.audit import list_entity_reasons
from api.utils.response import single

router = APIRouter(
    prefix="/preventive-occurrences",
    tags=["Preventive Occurrences"],
    dependencies=[Depends(require_authenticated)],
)


@router.get("", response_model=list[PreventiveOccurrenceOut])
def list_occurrences(
    plan_id: Optional[str] = Query(None),
    machine_id: Optional[str] = Query(None),
    include_descendants: bool = Query(
        False,
        description="Avec machine_id : inclut les occurrences des équipements descendants. Ignoré sans machine_id",
    ),
    status: Optional[str] = Query(None),
    scheduled_date_from: Optional[date] = Query(None),
    scheduled_date_to: Optional[date] = Query(None),
):
    """Liste les occurrences de maintenance préventive avec filtres optionnels"""
    repo = PreventiveOccurrenceRepository()
    return repo.get_list(
        plan_id=plan_id,
        machine_id=machine_id,
        status=status,
        scheduled_date_from=scheduled_date_from,
        scheduled_date_to=scheduled_date_to,
        include_descendants=include_descendants,
    )


@router.get("/schedule", response_model=list[ScheduleEntryOut])
def get_schedule(
    machine_id: Optional[str] = Query(None),
    include_descendants: bool = Query(
        False,
        description="Avec machine_id : inclut les équipements descendants. Ignoré sans machine_id",
    ),
    state: Optional[str] = Query(None, description="Filtre : " + ", ".join(SCHEDULE_STATES)),
):
    """Échéancier du préventif (périodicité glissante) : une ligne par plan actif et machine,
    triée par échéance. Lecture seule. Déclarée avant /{occurrence_id}."""
    if state is not None and state not in SCHEDULE_STATES:
        raise ValidationError(f"state invalide : {', '.join(SCHEDULE_STATES)}")
    return PreventiveOccurrenceRepository().get_schedule(
        today=date.today(),
        lead_days=settings.PREVENTIVE_LEAD_DAYS,
        machine_id=machine_id,
        include_descendants=include_descendants,
        state=state,
    )


@router.get("/history", response_model=HistoryOut)
def get_history(machine_id: UUID = Query(...)):
    """Historique préventif d'une machine, échéance la plus récente d'abord. Lecture seule.
    Déclarée avant /{occurrence_id}."""
    return {"items": PreventiveOccurrenceRepository().get_history(str(machine_id))}


@router.get("/{occurrence_id}")
def get_occurrence(occurrence_id: str):
    """Récupère une occurrence de maintenance préventive par ID"""
    repo = PreventiveOccurrenceRepository()
    return single(repo.get_by_id(occurrence_id))


# generate et repair n'ont pas d'entité propre : événements seuls, motif de la règle routinière
# de « request » (la plus proche : la demande est l'entité que ces routes créent ou réparent).
@router.post("/generate", dependencies=[audit("request", events_only=True)])
def generate_occurrences(background_tasks: BackgroundTasks):
    """
    Déclenche la génération des occurrences préventives pour tous les plans actifs.
    Tout ou rien : les cas prévisibles (occurrence déjà générée, conflit de date, machine sans
    compteur) sont rapportés sans erreur ; une erreur SQL annule toute la génération (500).
    Chaque occurrence, demande et intervention créée écrit son événement `created` (système).

    Chaque DI système générée ici est d'origine 'signalee' (valeur par défaut,
    voir migration 023) : le trigger DB `fn_notify_di_a_traiter` a donc déjà
    fan-outé les notifications en base pour chacune. On déclenche ici, en
    tâche de fond, l'envoi des mails correspondants.
    """
    repo = PreventiveOccurrenceRepository()
    result = repo.generate_occurrences()
    for di_id in result.pop("created_di_ids", []):
        background_tasks.add_task(send_di_a_traiter_mails, di_id)
    return single(result)


# Comme generate : les entités créées écrivent leur événement `created` (système, auteur du jeton).
@router.post("/anticipate", status_code=201, dependencies=[audit("request", events_only=True)])
def anticipate_occurrence(data: AnticipateIn, background_tasks: BackgroundTasks):
    """Lance en avance un préventif : crée tout de suite l'occurrence et sa demande système,
    comme la génération, sans attendre la prévenance. Plans à périodicité seulement.
    Refus : 409 (occurrence active), 422 (plan ou équipement inadapté), 404 (inconnu)."""
    occurrence, di_id = PreventiveOccurrenceRepository().anticipate(
        str(data.plan_id), str(data.machine_id)
    )
    background_tasks.add_task(send_di_a_traiter_mails, di_id)
    return single(occurrence)


@router.patch(
    "/{occurrence_id}/skip",
    dependencies=[
        audit("preventive_occurrence", id_from_path="occurrence_id", table="preventive_occurrence")
    ],
)
def skip_occurrence(occurrence_id: str, request: Request):
    """Ignore une occurrence en statut 'pending'.

    Décision hors travail normal : un motif choisi est obligatoire (`reason_code` du corps,
    validé par AuditMiddleware ; 400 avec la liste des motifs sinon), `reason_text` est
    obligatoire avec OTHER. `skip_reason` n'est plus saisi : il est déduit du motif
    (libellé, ou texte libre pour OTHER). Le corps n'a pas d'autre champ.
    """
    skip_reason = skip_reason_from_choice(
        getattr(request.state, REASON_CODE_ATTR, None),
        getattr(request.state, REASON_TEXT_ATTR, None),
        list_entity_reasons("preventive_occurrence"),
    )
    repo = PreventiveOccurrenceRepository()
    return single(repo.skip_occurrence(occurrence_id, skip_reason))


@router.post("/repair", dependencies=[audit("request", events_only=True)])
def repair_occurrences():
    """
    Répare les données corrompues par deux bugs désormais corrigés (fix 2026-04-15).

    **Bug 1 — steps de gamme non liés à l'intervention** :
    Lors de l'acceptation manuelle d'une DI préventive, un problème de curseur partagé
    empêchait le rattachement des `intervention_task` à l'intervention créée.
    Les tâches restaient avec `intervention_id = NULL` et n'apparaissaient pas dans l'intervention.

    **Bug 2 — occurrence préventive bloquée à 'generated' après fermeture** :
    La fermeture d'une intervention (via PATCH) ne propageait pas l'état `completed`
    sur l'occurrence préventive liée, ni ne clôturait la demande associée.

    Cette procédure est **idempotente** : elle peut être appelée plusieurs fois sans effet secondaire.
    """
    repo = PreventiveOccurrenceRepository()
    return single(repo.repair_orphaned_data())
