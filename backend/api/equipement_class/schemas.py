"""Schémas Pydantic pour les classes d'équipement"""

from uuid import UUID

from pydantic import BaseModel


class EquipementClassBase(BaseModel):
    """Schéma de base pour classe d'équipement"""

    code: str
    label: str
    description: str | None = None


class EquipementClassCreate(EquipementClassBase):
    """Schéma pour créer une classe d'équipement"""

    pass


class EquipementClassUpdate(BaseModel):
    """Schéma pour mettre à jour une classe d'équipement"""

    code: str | None = None
    label: str | None = None
    description: str | None = None


class AllowedInterventionTypesUpdate(BaseModel):
    """Remplacement de la liste des types permis d'une classe (vide = tous permis)."""

    intervention_types: list[str]


class EquipementClass(EquipementClassBase):
    """Schéma complet d'une classe d'équipement.

    `allowed_intervention_types` : codes des types permis (ADR 0031) ; liste vide = tous."""

    id: UUID
    allowed_intervention_types: list[str] = []

    class Config:
        from_attributes = True


class EquipementClassRef(BaseModel):
    """Référence légère à une classe d'équipement"""

    id: UUID
    code: str
    label: str

    class Config:
        from_attributes = True
