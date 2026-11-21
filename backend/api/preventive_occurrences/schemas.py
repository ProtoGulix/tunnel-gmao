from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from api.intervention_tasks.schemas import InterventionTaskOut


class PreventiveOccurrenceOut(BaseModel):
    id: UUID
    plan_id: UUID
    plan_label: str
    machine_id: UUID
    machine_code: str
    machine_name: str
    scheduled_date: Optional[date] = None
    triggered_at: Optional[datetime] = None
    hours_at_trigger: Optional[float] = None
    di_id: Optional[UUID] = None
    di_code: Optional[str] = None
    di_statut: Optional[str] = None
    intervention_id: Optional[UUID] = None
    status: str
    skip_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    tasks: list[InterventionTaskOut] = []

    model_config = ConfigDict(from_attributes=True)


class GenerateOccurrencesResult(BaseModel):
    generated: int
    skipped_conflicts: int
    skipped_active: int = 0
    errors: list[str] = []


class RepairOccurrencesResult(BaseModel):
    """Résultat de la procédure de réparation des occurrences corrompues."""

    tasks_relinked: int
    occurrences_relinked: int
    occurrences_set_in_progress: int
    occurrences_completed: int
    requests_closed: int
    interventions_plan_fixed: int = 0
    tasks_optional_resynced: int = 0
    tasks_generated_missing: int = 0
    details: list[str] = []


class ScheduleEntryOut(BaseModel):
    """Une ligne de l'échéancier : un plan actif sur une machine de sa classe."""

    plan_id: UUID
    plan_code: str
    plan_label: str
    machine_id: UUID
    machine_code: str
    machine_name: str
    reference_date: Optional[date] = None
    due_date: Optional[date] = None
    state: str
    days_overdue: int
    occurrence_id: Optional[UUID] = None
    di_id: Optional[UUID] = None
    intervention_id: Optional[UUID] = None


class AnticipateIn(BaseModel):
    plan_id: UUID
    machine_id: UUID


class HistoryItemOut(BaseModel):
    """Une occurrence de l'historique d'une machine (delta_days négatif : en avance)."""

    occurrence_id: UUID
    plan_id: UUID
    plan_code: str
    plan_label: str
    status: str
    scheduled_date: date
    done_on: Optional[date] = None
    delta_days: Optional[int] = None
    skip_reason: Optional[str] = None
    di_id: Optional[UUID] = None
    intervention_id: Optional[UUID] = None
    intervention_code: Optional[str] = None


class HistoryOut(BaseModel):
    items: list[HistoryItemOut]
