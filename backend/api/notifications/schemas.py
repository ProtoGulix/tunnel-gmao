from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from api.utils.pagination import PaginationMeta


class NotificationOut(BaseModel):
    """Notification adressée à un utilisateur."""

    id: UUID
    type: str
    entity_type: str
    entity_id: UUID
    message: str
    data: Optional[Dict[str, Any]] = None
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListOut(BaseModel):
    """Liste paginée de notifications."""

    items: List[NotificationOut] = Field(default_factory=list)
    pagination: PaginationMeta

    class Config:
        from_attributes = True


class UnreadCountOut(BaseModel):
    """Nombre de notifications non lues de l'utilisateur courant."""

    count: int
