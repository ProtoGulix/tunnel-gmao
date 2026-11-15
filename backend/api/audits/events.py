"""Événements d'audit déposés par les repos (ADR 0018, points 4 et 6).

Le middleware d'audit est le seul à écrire dans audit_log. Quand une requête touche
d'autres entités que celle que la route déclare (acceptation d'une demande, action qui
ferme des tâches, génération préventive), le repo dépose un événement avec
`record_audit_event` ; le middleware le valide et l'écrit dans la transaction de la requête,
avec le motif de la requête et l'auteur du jeton.

Mécanisme : le middleware crée une `AuditUnit` avant d'appeler la route et la rend visible
par un ContextVar. Un ContextVar posé PAR la route ne remonte pas au middleware (docs/spikes/
0002) ; ici c'est le middleware qui le pose avant, et la route (y compris dans le threadpool,
qui copie le contexte) dépose dans la liste partagée par référence.
"""

from __future__ import annotations

import contextvars
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from uuid import UUID


@dataclass(frozen=True)
class AuditEvent:
    """Une décision à tracer : entité, type de décision, avant, après."""

    entity_type: str
    entity_id: UUID
    decision_type: str
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    is_system: bool = False
    # Obligatoire pour une mutation du système (motif de catégorie system : le motif de la
    # requête est réservé aux décisions d'un utilisateur). Sinon, motif propre à l'événement
    # quand la route l'a déjà résolu ; à défaut, celui de la requête.
    reason_code: Optional[str] = None


@dataclass
class AuditUnit:
    """Événements d'une requête. `closed` passe à vrai quand le middleware a fini de les écrire."""

    events: List[AuditEvent] = field(default_factory=list)
    closed: bool = False


_current_unit: contextvars.ContextVar[Optional[AuditUnit]] = contextvars.ContextVar(
    "audit_unit", default=None
)


def bind_audit_unit(unit: AuditUnit) -> contextvars.Token:
    """Rend l'unité visible des repos dans le contexte courant (appelé par le middleware)."""
    return _current_unit.set(unit)


def unbind_audit_unit(token: contextvars.Token) -> None:
    _current_unit.reset(token)


def record_audit_event(
    entity_type: str,
    entity_id: Any,
    decision_type: str,
    old_value: Optional[Dict[str, Any]] = None,
    new_value: Optional[Dict[str, Any]] = None,
    is_system: bool = False,
    reason_code: Optional[str] = None,
) -> None:
    """Dépose un événement d'audit dans la requête en cours (à appeler depuis un repo).

    Le middleware l'écrit dans la même transaction que la mutation, avec l'auteur du jeton
    et le motif de la requête. Pour une mutation du système (`is_system=True`), `reason_code`
    est obligatoire et doit être un motif de catégorie system : la base le vérifie.

    Lève RuntimeError hors requête qui modifie, ou une fois les événements écrits (tâche de
    fond) : une trace perdue en silence vaudrait moins qu'une erreur visible.
    """
    unit = _current_unit.get()
    if unit is None or unit.closed:
        raise RuntimeError(
            "Événement d'audit déposé hors d'une requête qui modifie : "
            f"{entity_type} {entity_id} {decision_type}"
        )
    if is_system and not reason_code:
        raise ValueError("Un événement du système exige un reason_code de catégorie system")
    unit.events.append(
        AuditEvent(
            entity_type=entity_type,
            entity_id=entity_id if isinstance(entity_id, UUID) else UUID(str(entity_id)),
            decision_type=decision_type,
            old_value=old_value,
            new_value=new_value,
            is_system=is_system,
            reason_code=reason_code,
        )
    )


def record_field_changes(
    entity_type: str,
    entity_id: Any,
    before: Dict[str, Any],
    after: Dict[str, Any],
) -> None:
    """Dépose une ligne `{champ}_changed` par champ de `after` dont la valeur a changé.

    Pour les entités à clé entière ou texte : `entity_id` est l'uuid5 de la clé, et les états
    complets avant et après (clé d'origine comprise) vont dans old_value et new_value, comme
    pour les familles de stock. Aucun événement si rien n'a changé.
    """
    for column, new in after.items():
        if before.get(column) != new:
            record_audit_event(
                entity_type,
                entity_id,
                f"{column}_changed",
                old_value=before,
                new_value=after,
            )


def record_column_changes(
    entity_type: str,
    entity_id: Any,
    before: Dict[str, Any],
    after: Dict[str, Any],
) -> None:
    """Dépose une ligne `{champ}_changed` par champ modifié, au format du middleware.

    Pour une route à entité à clé uuid qui ne peut pas laisser le middleware lire l'état
    (`events_only`, ex. /users/me ou un upsert) : old_value et new_value ne portent que le
    champ concerné, comme les diffs calculés par le middleware. Aucun événement sans changement.
    """
    for column, new in after.items():
        old = before.get(column)
        if old != new:
            record_audit_event(
                entity_type,
                entity_id,
                f"{column}_changed",
                old_value={column: old},
                new_value={column: new},
            )
