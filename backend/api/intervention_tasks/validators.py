"""Règles métier des tâches d'intervention."""

from typing import Any, Dict, Optional

from api.errors.exceptions import ForbiddenError

# Ignorer une étape obligatoire de gamme est une décision de responsable : le front
# masque le bouton aux autres rôles, mais seul ce contrôle fait foi.
SKIP_OBLIGATORY_ROLES = ("RESP", "ADMIN")


def ensure_can_skip(task: Dict[str, Any], role: Optional[str]) -> None:
    """Lève ForbiddenError si le rôle ne peut pas ignorer cette tâche."""
    is_obligatory_step = task.get("origin") == "plan" and not task.get("optional")
    if is_obligatory_step and role not in SKIP_OBLIGATORY_ROLES:
        raise ForbiddenError("Seul un responsable peut ignorer une étape obligatoire de la gamme")
