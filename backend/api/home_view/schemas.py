from uuid import UUID

from pydantic import BaseModel, Field


class HomeViewRefOut(BaseModel):
    """Une vue d'accueil du référentiel (code technique + libellé affiché)."""

    code: str
    label: str

    class Config:
        from_attributes = True


class MyHomeViewOut(BaseModel):
    """Vue d'accueil résolue pour l'utilisateur courant (via son rôle)."""

    code: str
    label: str

    class Config:
        from_attributes = True


class HomeViewAssignmentOut(BaseModel):
    """Assignation explicite d'une vue d'accueil à un rôle."""

    role_id: UUID
    home_view: str

    class Config:
        from_attributes = True


class HomeViewAssignmentIn(BaseModel):
    """Corps de requête pour assigner une vue d'accueil à un rôle."""

    home_view: str = Field(..., description="Code de la vue (voir GET /home-view)")
