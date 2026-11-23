from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ConstatIn(BaseModel):
    """Saisie d'un constat : codes des choix cochés, machine visée (celle de l'intervention par défaut)."""

    choices: List[str] = Field(..., description="Codes des choix cochés")
    machine_id: Optional[UUID] = Field(default=None, description="Machine visée")


class ConstatCorrectionIn(ConstatIn):
    """Correction : nouvelle version ; le motif (`reason_code`) est lu par l'audit."""

    reason_code: Optional[str] = Field(
        default=None, description="Motif de décision constat_corrected"
    )
    reason_text: Optional[str] = None


class ConstatLinkIn(BaseModel):
    request_id: UUID = Field(..., description="Idée d'amélioration à laquelle rattacher le constat")
