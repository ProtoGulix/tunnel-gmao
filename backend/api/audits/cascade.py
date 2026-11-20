"""Événements d'audit des cascades du système (ADR 0029, point 5).

Une cascade est une écriture que le code fait en conséquence d'une décision, sur une entité
que la route ne déclare pas : occurrence préventive passée « completed », tâche rattachée,
ligne de commande cumulée, sous-équipement rattaché, correction d'une route /repair.
Chaque cascade dépose un événement du système sur l'entité modifiée : l'auteur est celui du
jeton (ajouté par le middleware), le motif est celui du contexte (SYSTEM_CASCADE dans une
requête, SYSTEM_SCHEDULE dans une tâche planifiée), jamais celui de la décision d'origine.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from api.audits.events import record_audit_event, system_reason_code


def record_cascade(
    entity_type: str,
    entity_id: Any,
    decision_type: str,
    old_value: Optional[Dict[str, Any]] = None,
    new_value: Optional[Dict[str, Any]] = None,
) -> None:
    """Dépose l'événement d'une cascade (is_system, motif du contexte)."""
    record_audit_event(
        entity_type,
        entity_id,
        decision_type,
        old_value=old_value,
        new_value=new_value,
        is_system=True,
        reason_code=system_reason_code(),
    )


def record_cascade_changes(
    entity_type: str,
    entity_id: Any,
    before: Dict[str, Any],
    after: Dict[str, Any],
    decision_type: str = "updated",
) -> None:
    """Dépose un seul événement `decision_type` avec les seuls champs de `after` qui changent.

    Aucun événement si rien n'a changé (une cascade qui n'écrit rien ne laisse pas de trace).
    """
    changed = {k: v for k, v in after.items() if before.get(k) != v}
    if not changed:
        return
    record_cascade(
        entity_type,
        entity_id,
        decision_type,
        old_value={k: before.get(k) for k in changed},
        new_value=changed,
    )
