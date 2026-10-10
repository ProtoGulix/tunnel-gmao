from datetime import date
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query

from api.auth.permissions import require_authenticated
from api.notifications.mailer import send_di_a_traiter_mails
from api.preventive_occurrences.repo import PreventiveOccurrenceRepository
from api.preventive_occurrences.schemas import (
    OccurrenceSkipIn,
    PreventiveOccurrenceOut,
)
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


@router.get("/{occurrence_id}")
def get_occurrence(occurrence_id: str):
    """Récupère une occurrence de maintenance préventive par ID"""
    repo = PreventiveOccurrenceRepository()
    return single(repo.get_by_id(occurrence_id))


@router.post("/generate")
def generate_occurrences(background_tasks: BackgroundTasks):
    """
    Déclenche la génération des occurrences préventives pour tous les plans actifs.
    Chaque machine est traitée indépendamment — un échec n'annule pas les autres.

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


@router.patch("/{occurrence_id}/skip")
def skip_occurrence(occurrence_id: str, data: OccurrenceSkipIn):
    """Ignore une occurrence en statut 'pending'"""
    repo = PreventiveOccurrenceRepository()
    return single(repo.skip_occurrence(occurrence_id, data.skip_reason))


@router.post("/repair")
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
