"""Exécuteur système : une étape planifiée dans sa propre transaction (ADR 0023, point 2).

Hors requête, rien ne pose la connexion ni l'unité d'audit que le middleware pose pour une
requête qui modifie. Cet exécuteur fait la même chose pour une étape : il emprunte une
connexion, la rend visible de get_connection() (les repos s'exécutent donc à l'identique),
pose une unité d'audit dont le motif système est SYSTEM_SCHEDULE, exécute l'étape, écrit les
événements déposés (is_system, changed_by vide) puis valide tout ou annule tout.

Le choix du motif se fait par le contexte : AuditUnit.system_reason, lu par les repos via
api.audits.events.system_reason_code(). Les repos n'ont ni paramètre à propager ni motif en
dur : le même code produit SYSTEM_CASCADE dans la requête du bouton « Générer » et
SYSTEM_SCHEDULE ici.
"""

from __future__ import annotations

import logging
from typing import Callable, TypeVar

from api.audits.events import AuditUnit, bind_audit_unit, unbind_audit_unit
from api.audits.writer import write_audit_entry
from api.db import (
    bind_request_connection,
    close_request_connection,
    open_request_connection,
    unbind_request_connection,
)

logger = logging.getLogger(__name__)

SYSTEM_SCHEDULE_REASON = "SYSTEM_SCHEDULE"

T = TypeVar("T")


def run_system_step(step: Callable[[], T]) -> T:
    """Exécute `step` dans une transaction système (bloquant : à lancer dans un thread).

    Tout ou rien : une exception de l'étape, un événement d'audit refusé ou une transaction
    en échec annulent tout et l'erreur remonte à l'appelant, qui la journalise.
    """
    conn = open_request_connection()
    unit = AuditUnit(system_reason=SYSTEM_SCHEDULE_REASON)
    conn_token = bind_request_connection(conn)
    unit_token = bind_audit_unit(unit)
    committed = False
    try:
        result = step()
        _write_events(unit)
        unit.closed = True
        if not conn.is_healthy():
            raise RuntimeError("Transaction système en échec : annulée")
        close_request_connection(conn, True)
        committed = True
        return result
    finally:
        unit.closed = True
        unbind_audit_unit(unit_token)
        unbind_request_connection(conn_token)
        if not committed and not conn.closed:
            # conn.closed : une validation qui a échoué a déjà rendu la connexion au pool.
            close_request_connection(conn, False)


def _write_events(unit: AuditUnit) -> None:
    """Écrit les événements déposés par les repos : système, sans auteur (écriture partagée)."""
    for event in unit.events:
        if not event.is_system or not event.reason_code:
            # Une tâche planifiée n'a aucun utilisateur : pas de décision d'utilisateur à tracer.
            raise RuntimeError(
                "Événement d'audit non système dans une tâche planifiée : "
                f"{event.entity_type} {event.decision_type}"
            )
        write_audit_entry(
            entity_type=event.entity_type,
            entity_id=event.entity_id,
            decision_type=event.decision_type,
            old_value=event.old_value,
            new_value=event.new_value,
            reason_code=event.reason_code,
            reason_text=None,
            changed_by=None,
            is_system=True,
        )
