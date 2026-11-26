from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from api.users.schemas import check_password_strength

# --- Utilisateurs ---

# Rôle des clés d'API machine à machine (api_keys) : jamais attribué à un compte humain.
MACHINE_ROLE_CODES = frozenset({"MCP"})


def check_human_role(code: str) -> str:
    """Refuse un rôle machine pour un compte de personne (décision de l'utilisateur, ADM-01)."""
    if code.upper() in MACHINE_ROLE_CODES:
        raise ValueError("Le rôle MCP est réservé aux clés d'API, pas aux comptes de personnes")
    return code


class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=256)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    initial: str
    role_code: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Même règle que le changement de mot de passe par l'utilisateur (ADM-01)."""
        return check_password_strength(v)

    @field_validator("role_code")
    @classmethod
    def human_role(cls, v: str) -> str:
        return check_human_role(v)


class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    initial: Optional[str] = None


class AdminUserRolePatch(BaseModel):
    role_code: str

    @field_validator("role_code")
    @classmethod
    def human_role(cls, v: str) -> str:
        return check_human_role(v)


class AdminUserActivePatch(BaseModel):
    is_active: bool


class AdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    initial: str
    role_id: UUID
    role_code: Optional[str] = None
    auth_provider: str
    is_active: bool
    provisioning: str
    created_at: datetime
    updated_at: datetime


class AdminUserListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    initial: str
    role_code: Optional[str] = None
    is_active: bool
    auth_provider: str


class PasswordResetOut(BaseModel):
    temporary_password: str
    message: str


# --- Rôles et permissions ---


class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    code: str
    label: str
    created_at: datetime


class EndpointOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    code: str
    method: str
    path: str
    description: Optional[str] = None
    module: Optional[str] = None
    is_sensitive: bool


class PermissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    role_id: UUID
    endpoint_id: UUID
    endpoint_code: Optional[str] = None
    endpoint_method: Optional[str] = None
    endpoint_path: Optional[str] = None
    allowed: bool


class PermissionPatch(BaseModel):
    allowed: bool


class EndpointPatch(BaseModel):
    description: Optional[str] = None
    module: Optional[str] = None
    is_sensitive: Optional[bool] = None


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    changed_by: UUID
    changed_by_email: Optional[str] = None
    role_id: UUID
    role_code: Optional[str] = None
    endpoint_id: UUID
    endpoint_code: Optional[str] = None
    old_allowed: Optional[bool] = None
    new_allowed: bool
    created_at: datetime


# --- Référentiel actions ---


class ActionCategoryPatch(BaseModel):
    label: Optional[str] = None
    color: Optional[str] = None


class ActionSubcategoryCreate(BaseModel):
    code: str
    label: str
    category_id: int


class ActionSubcategoryPatch(BaseModel):
    label: Optional[str] = None


# --- Référentiel interventions ---


class InterventionTypeCreate(BaseModel):
    code: str
    label: str
    description: Optional[str] = None
    color: Optional[str] = None


class InterventionTypePatch(BaseModel):
    """Le code n'est pas modifiable (ADR 0026) : un champ `code` envoyé est ignoré."""

    label: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    constat_required: Optional[bool] = None


class InterventionTypeActivePatch(BaseModel):
    is_active: bool


class InterventionStatusPatch(BaseModel):
    label: Optional[str] = None
    color: Optional[str] = None


# --- Référentiel des constats (ADR 0045) ---


class ConstatQuestionPatch(BaseModel):
    """Libellé seul : code, parent et ordre des questions sont figés."""

    label: str


class ConstatChoiceCreate(BaseModel):
    question_id: int
    code: str
    label: str
    suggested_type_inter: Optional[str] = None
    creates_request: bool = False
    is_exclusive: bool = False


class ConstatChoicePatch(BaseModel):
    """Champ absent : inchangé. `suggested_type_inter` à null : efface le type préconisé."""

    label: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    suggested_type_inter: Optional[str] = None
    creates_request: Optional[bool] = None
    is_exclusive: Optional[bool] = None


# --- Sécurité ---


class SecurityLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    event_type: str
    user_id: Optional[UUID] = None
    ip_address: Optional[str] = None
    detail: Optional[Any] = None
    created_at: datetime


class IpBlocklistCreate(BaseModel):
    ip_address: str
    reason: Optional[str] = None
    blocked_until: Optional[datetime] = None


class IpBlocklistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    ip_address: str
    reason: Optional[str] = None
    blocked_until: Optional[datetime] = None
    created_by: Optional[UUID] = None
    created_by_name: Optional[str] = None
    created_at: datetime


class EmailDomainRuleCreate(BaseModel):
    domain: str
    allowed: bool = True


class EmailDomainRuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    domain: str
    allowed: bool
    created_at: datetime


# --- Mail ---


class MailSettingsOut(BaseModel):
    mail_enabled: bool
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_from: str
    smtp_from_name: str
    smtp_starttls: bool
