from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from api.equipements.schemas import EquipementDetail
from api.intervention_actions.schemas import InterventionActionOut
from api.intervention_status_log.schemas import InterventionStatusLogOut
from api.intervention_tasks.schemas import InterventionTaskOut, TaskProgressOut

if TYPE_CHECKING:
    # Import lazy pour éviter la circularité avec intervention_requests.schemas
    from api.intervention_requests.schemas import InterventionRequestListItem


class InterventionCreate(BaseModel):
    """Schéma d'entrée pour créer une intervention (champs requis par le trigger)"""

    machine_id: UUID
    type_inter: str
    tech_id: UUID
    title: Optional[str] = None
    priority: Optional[str] = None
    reported_by: Optional[str] = None
    status_actual: Optional[str] = None
    printed_fiche: Optional[bool] = None
    reported_date: Optional[date] = None
    request_id: Optional[UUID] = None
    reason_code: str = Field(
        ...,
        description="Code raison obligatoire pour l'audit (ex: CLIENT_REQUEST, OTHER). Voir GET /audit/reasons.",
    )
    reason_text: Optional[str] = Field(
        default=None,
        description="Texte libre obligatoire si reason_code=OTHER.",
    )

    class Config:
        from_attributes = True


class InterventionIn(BaseModel):
    """Schéma d'entrée pour modifier une intervention (tous les champs optionnels)"""

    title: Optional[str] = None
    machine_id: Optional[UUID] = None
    type_inter: Optional[str] = None
    priority: Optional[str] = None
    reported_by: Optional[str] = None
    tech_initials: Optional[str] = None
    tech_id: Optional[UUID] = None
    status_actual: Optional[str] = None
    printed_fiche: Optional[bool] = None
    reported_date: Optional[date] = None
    reason_code: str = Field(
        ...,
        description="Code raison obligatoire pour l'audit (ex: CLIENT_REQUEST, OTHER). Voir GET /audit/reasons.",
    )
    reason_text: Optional[str] = Field(
        default=None,
        description="Texte libre obligatoire si reason_code=OTHER.",
    )

    class Config:
        from_attributes = True


class RequestPointageIn(BaseModel):
    """Corps de POST /interventions/{id}/request-pointage."""

    tech_ids: List[UUID] = Field(
        ..., description="UUID des techniciens à qui demander un pointage."
    )

    @field_validator("tech_ids")
    @classmethod
    def tech_ids_not_empty(cls, v: List[UUID]) -> List[UUID]:
        if not v:
            raise ValueError("tech_ids ne peut pas être vide")
        return v


class RequestPointageOut(BaseModel):
    """Réponse de POST /interventions/{id}/request-pointage."""

    created: int


class InterventionStats(BaseModel):
    """Stats calculées pour une intervention"""

    action_count: int = 0
    total_time: float = 0
    avg_complexity: Optional[float] = None
    purchase_count: int = 0

    class Config:
        from_attributes = True


class InterventionRef(BaseModel):
    """Référence embarquée d'une intervention — sans actions/logs mais avec ses tâches."""

    id: UUID
    code: Optional[str] = None
    title: Optional[str] = None
    type_inter: Optional[str] = None
    priority: Optional[str] = None
    status_actual: Optional[str] = None
    status_label: Optional[str] = None
    status_color: Optional[str] = None
    tech_initials: Optional[str] = None
    tech_id: Optional[UUID] = None
    reported_by: Optional[str] = None
    reported_date: Optional[date] = None
    next_due_date: Optional[date] = None
    overdue: bool = False
    plan_id: Optional[UUID] = None
    printed_fiche: Optional[bool] = None
    stats: Optional[InterventionStats] = None

    class Config:
        from_attributes = True


class InterventionOut(BaseModel):
    """Schéma pour une intervention avec ses actions et équipement"""

    id: UUID
    code: Optional[str] = None
    title: Optional[str] = None
    equipements: Optional[EquipementDetail] = None
    type_inter: Optional[str] = None
    priority: Optional[str] = None
    reported_by: Optional[str] = None
    tech_initials: Optional[str] = None
    tech_id: Optional[UUID] = None
    status_actual: Optional[str] = None
    updated_by: Optional[UUID] = None
    printed_fiche: Optional[bool] = None
    reported_date: Optional[date] = None
    request: Optional[InterventionRequestListItem] = None  # type: ignore[name-defined]
    next_due_date: Optional[date] = None
    overdue: bool = False
    plan_id: Optional[UUID] = None
    task_progress: Optional[TaskProgressOut] = None
    tasks: List[InterventionTaskOut] = []

    stats: InterventionStats
    actions: List[InterventionActionOut] = []
    status_logs: List[InterventionStatusLogOut] = []

    class Config:
        from_attributes = True
