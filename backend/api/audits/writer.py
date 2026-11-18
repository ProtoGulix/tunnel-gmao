"""Écriture d'une ligne d'audit, partagée par le middleware et l'exécuteur des tâches planifiées.

Un seul point d'écriture dans audit_log (ADR 0018) : c'est ici que les colonnes sensibles
sont masquées, que l'événement vienne d'une requête (api/audits/middleware.py) ou d'une
tâche planifiée (api/jobs/executor.py, ADR 0023). L'auteur est fourni par l'appelant :
l'identité du jeton pour une requête, vide pour le système.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from uuid import UUID

from api.audits.repo import AuditRepository

# Colonnes dont la valeur ne doit jamais être écrite dans audit_log (lisible par RESP et MCP).
SENSITIVE_COLUMNS = frozenset({"password_hash", "key_hash"})
MASKED_VALUE = "***"


def mask_sensitive(state: Dict[str, Any]) -> Dict[str, Any]:
    """Copie de l'état où la valeur de chaque colonne sensible est remplacée.

    La clé reste présente : le diff `password_hash_changed` reste visible sans l'empreinte.
    """
    return {k: (MASKED_VALUE if k in SENSITIVE_COLUMNS else v) for k, v in state.items()}


def write_audit_entry(
    entity_type: str,
    entity_id: UUID,
    decision_type: str,
    old_value: Optional[Dict[str, Any]],
    new_value: Optional[Dict[str, Any]],
    reason_code: str,
    reason_text: Optional[str],
    changed_by: Optional[UUID],
    is_system: bool = False,
    repository: Optional[AuditRepository] = None,
) -> None:
    """Appelle fn_audit_log_decision() dans la transaction courante (bloquant).

    Une erreur n'est jamais avalée : elle remonte et la transaction est annulée avec la
    mutation. Les diffs ont été calculés par l'appelant sur les vraies valeurs ; le masquage
    n'a lieu qu'ici, à l'écriture. `repository` permet à l'appelant de fournir le sien.
    """
    (repository or AuditRepository()).call_fn_audit_log_decision(
        entity_type=entity_type,
        entity_id=entity_id,
        decision_type=decision_type,
        old_value=mask_sensitive(old_value) if old_value else old_value,
        new_value=mask_sensitive(new_value) if new_value else new_value,
        reason_code=reason_code,
        reason_text=reason_text,
        changed_by=changed_by,
        is_system=is_system,
    )
