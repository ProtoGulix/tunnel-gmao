from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from api.equipements.schemas import EquipementDetail
from api.intervention_actions.schemas import InterventionActionOut
from api.intervention_status_log.schemas import InterventionStatusLogOut
from api.intervention_tasks.schemas import InterventionTaskOut, TaskProgressOut

if TYPE_CHECKING:
    # Import lazy pour éviter la circularité avec intervention_requests.schemas
    from api.intervention_requests.schemas import InterventionRequestListItem


class NewRequestIn(BaseModel):
    """Demande créée dans le même geste que son intervention (ADR 0025).

    L'équipement est celui de l'intervention. La demande est d'origine « directe » : aucune
    notification ni mail « à traiter ».
    """

    demandeur_nom: str = Field(description="Nom du demandeur (donnée déclarative libre).")
    description: str = Field(description="Description de l'intervention demandée.")
    service_id: Optional[UUID] = Field(default=None, description="Service du demandeur.")


class NewTaskIn(BaseModel):
    """Tâche créée avec l'intervention : champs de POST /intervention-tasks sans intervention_id."""

    label: str
    origin: str = Field(default="tech", pattern="^(plan|resp|tech)$")
    optional: bool = False
    assigned_to: Optional[UUID] = None
    due_date: Optional[date] = None
    sort_order: int = 0


class InterventionCreate(BaseModel):
    """Schéma d'entrée pour créer une intervention (champs requis par le trigger).

    La demande dont elle est issue est désignée par `request_id` (demande existante) OU
    décrite par `request` (nouvelle demande), jamais les deux (ADR 0019, 0025).
    """

    machine_id: UUID
    type_inter: str
    tech_id: UUID
    title: Optional[str] = None
    priority: Optional[str] = None
    reported_by: Optional[str] = None
    status_actual: Optional[str] = None
    printed_fiche: Optional[bool] = None
    reported_date: Optional[date] = None
    request_id: Optional[UUID] = Field(
        default=None,
        description="Demande existante dont l'intervention est issue (exclusif avec `request`).",
    )
    request: Optional[NewRequestIn] = Field(
        default=None,
        description="Nouvelle demande créée dans la même transaction (exclusif avec `request_id`).",
    )
    tasks: List[NewTaskIn] = Field(
        default_factory=list, description="Tâches créées dans la même transaction (facultatif)."
    )

    @model_validator(mode="after")
    def request_xor_request_id(self):
        if (self.request_id is None) == (self.request is None):
            raise ValueError("Fournir exactement un des champs `request_id` ou `request`")
        return self

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
    is_locked: bool = False
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
    is_locked: bool = False
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
