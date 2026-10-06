from typing import Any, Dict

from fastapi import APIRouter, Depends, Query

from api.auth.permissions import require_authenticated
from api.errors.exceptions import UnauthorizedError
from api.notifications.repo import NotificationRepository
from api.notifications.schemas import UnreadCountOut
from api.utils.response import paginated, single

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
    dependencies=[Depends(require_authenticated)],
)

repo = NotificationRepository()


def _require_user_id(user_id: str | None) -> str:
    """Les notifications sont attachées à un utilisateur JWT — refuse les clés API
    (qui n'ont pas de user_id, voir require_authenticated)."""
    if not user_id:
        raise UnauthorizedError("Authentification utilisateur requise (clé API non supportée)")
    return user_id


@router.get("")
def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user_id: str | None = Depends(require_authenticated),
) -> Dict[str, Any]:
    """Liste paginée des notifications de l'utilisateur courant, triées par date décroissante."""
    uid = _require_user_id(user_id)
    items = repo.list_for_user(uid, limit=limit, offset=skip)
    total = repo.count_for_user(uid)
    return paginated(items, total=total, offset=skip, limit=limit)


@router.get("/unread-count", response_model=UnreadCountOut)
def get_unread_count(user_id: str | None = Depends(require_authenticated)) -> UnreadCountOut:
    """Nombre de notifications non lues de l'utilisateur courant."""
    uid = _require_user_id(user_id)
    return UnreadCountOut(count=repo.count_unread(uid))


@router.patch("/read-all")
def mark_all_read(user_id: str | None = Depends(require_authenticated)) -> Dict[str, Any]:
    """Marque toutes les notifications de l'utilisateur courant comme lues."""
    uid = _require_user_id(user_id)
    updated = repo.mark_all_read(uid)
    return {"updated": updated}


@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: str, user_id: str | None = Depends(require_authenticated)
) -> Dict[str, Any]:
    """Marque une notification comme lue. 404 si absente, 403 si elle n'appartient pas à l'utilisateur."""
    uid = _require_user_id(user_id)
    return single(repo.mark_read(notification_id, uid))
