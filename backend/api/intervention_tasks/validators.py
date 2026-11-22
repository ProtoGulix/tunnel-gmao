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


def task_delete_blocker(status: Optional[str], action_count: int, locked: bool) -> Optional[str]:
    """Retourne le motif de refus de suppression d'une tâche, ou None si elle est supprimable.

    Règle unique (ADR 0030) : sert au refus (repo.delete) et à l'indicateur `can_delete`.
    Une tâche n'est supprimable que « à faire », sans action, sur une intervention non fermée.
    """
    if locked:
        return "Intervention fermée : aucune modification des tâches n'est autorisée"
    if status != "todo":
        return "Seule une tâche à faire peut être supprimée"
    if action_count > 0:
        return (
            f"Cette tâche est liée à {action_count} action{'s' if action_count > 1 else ''}"
            " — suppression impossible"
        )
    return None


def task_capabilities(role: Optional[str]) -> Dict[str, bool]:
    """Droits du rôle sur les tâches, dérivés des mêmes listes que les refus (ADR 0030)."""
    return {
        "skip_obligatory_step": role in SKIP_OBLIGATORY_ROLES,
        "close_task_without_action": role in CLOSE_WITHOUT_ACTION_ROLES,
    }


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
    Le middleware valide déjà le motif (ADR 0017) ; le filtre par bouton, propre à ce
    passage direct, ne peut se vérifier qu'ici.
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


# Décision d'audit (decision_types) d'une remise à faire (ADR 0042)
REOPEN_DECISION = "task_reopened"


def is_task_reopening(current_status: Optional[str], new_status: Optional[str]) -> bool:
    """Vrai si la mise à jour remet à faire une tâche terminée ou annulée."""
    return new_status == "todo" and current_status in ("done", "skipped")


def ensure_task_reopen_reason(
    reason_code: Optional[str],
    reason_text: Optional[str],
    reasons: List[Dict[str, Any]],
) -> None:
    """Vérifie le motif explicite d'une remise à faire (ADR 0042, même mécanisme que ADR 0016).

    Remettre à faire n'est jamais routinier : sans motif choisi par l'utilisateur (ROUTINE
    injecté par le middleware, motif auto ou system), on répond la demande de motif standard.
    `reasons` = motifs actifs de l'entité task ; seuls ceux dont decision_types contient
    `task_reopened` sont proposés et acceptés.
    """
    proposed = [r for r in reasons if REOPEN_DECISION in (r.get("decision_types") or [])]
    reason = {r["code"]: r for r in reasons}.get(reason_code or "")
    if reason is None:
        raise ValidationError(f"Motif '{reason_code}' non applicable à une tâche")
    if reason.get("category") not in ("manual", "user"):
        raise AuditReasonRequiredError(
            AuditRules(
                required=True,
                silent=False,
                default_reason_code=None,
                reasons=build_picker_reasons(proposed),
            ).model_dump()
        )
    if reason not in proposed:
        raise ValidationError(f"Motif '{reason_code}' non applicable à une remise à faire")
    if reason_code == "OTHER" and not (reason_text or "").strip():
        raise ValidationError("reason_text obligatoire quand reason_code = OTHER")
