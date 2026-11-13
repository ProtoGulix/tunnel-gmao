"""Règles métier des tâches d'intervention."""

from typing import Any, Dict, List, Optional

from api.audits.schemas import AuditRules
from api.errors.exceptions import AuditReasonRequiredError, ForbiddenError, ValidationError
from api.utils.audit import build_picker_reasons

# Ignorer une étape obligatoire de gamme est une décision de responsable : le front
# masque le bouton aux autres rôles, mais seul ce contrôle fait foi.
SKIP_OBLIGATORY_ROLES = ("RESP", "ADMIN")

# Clôturer une tâche sans action est une décision de responsable (ADR 0016).
CLOSE_WITHOUT_ACTION_ROLES = ("RESP", "ADMIN")


def ensure_can_close(role: Optional[str]) -> None:
    """Lève ForbiddenError si le rôle ne peut pas clôturer une tâche sans action."""
    if role not in CLOSE_WITHOUT_ACTION_ROLES:
        raise ForbiddenError("Seul un responsable peut clôturer une tâche sans action")


def ensure_can_skip(task: Dict[str, Any], role: Optional[str]) -> None:
    """Lève ForbiddenError si le rôle ne peut pas ignorer cette tâche."""
    is_obligatory_step = task.get("origin") == "plan" and not task.get("optional")
    if is_obligatory_step and role not in SKIP_OBLIGATORY_ROLES:
        raise ForbiddenError("Seul un responsable peut ignorer une étape obligatoire de la gamme")


# Décideur d'audit (decision_types) selon le statut visé par le passage direct
_CLOSE_DECISIONS = {"done": "task_done", "skipped": "task_skipped"}


def ensure_explicit_close_reason(
    reason_code: Optional[str],
    reason_text: Optional[str],
    reasons: List[Dict[str, Any]],
    target_status: str,
) -> str:
    """Vérifie le motif d'un passage direct vers done ou skipped ; retourne son libellé.

    Ce changement de statut n'est jamais routinier (ADR 0016) : sans motif choisi par
    l'utilisateur (le middleware a injecté ROUTINE, ou motif auto ou system), on répond
    la demande de motif standard. `reasons` = motifs actifs de l'entité task ; seuls ceux
    dont decision_types contient le décideur du bouton (task_done ou task_skipped) sont
    proposés et acceptés, un decision_types NULL est exclu (ADR 0016).
    Le middleware ne contrôle ni l'entité du motif ni le texte de OTHER, et
    fn_audit_log_decision avale ses erreurs : ces deux règles se vérifient ici.
    """
    decision = _CLOSE_DECISIONS[target_status]
    proposed = [r for r in reasons if decision in (r.get("decision_types") or [])]
    reason = {r["code"]: r for r in reasons}.get(reason_code or "")
    if reason is None:
        raise ValidationError(f"Motif '{reason_code}' non applicable à une tâche")
    if reason.get("category") not in ("manual", "user"):
        # ROUTINE injecté par le middleware, motif auto ou system : on redemande un motif
        raise AuditReasonRequiredError(
            AuditRules(
                required=True,
                silent=False,
                default_reason_code=None,
                reasons=build_picker_reasons(proposed),
            ).model_dump()
        )
    if reason not in proposed:
        raise ValidationError(f"Motif '{reason_code}' non applicable à cette clôture de tâche")
    if reason_code == "OTHER" and not (reason_text or "").strip():
        raise ValidationError("reason_text obligatoire quand reason_code = OTHER")
    return reason["label"]
