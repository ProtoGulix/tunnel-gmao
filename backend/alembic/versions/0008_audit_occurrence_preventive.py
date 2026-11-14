"""Règle d'audit de l'occurrence préventive (ADR 0018, AUDC-29)

Depuis AUDC-24, le saut d'une occurrence préventive (PATCH /preventive-occurrences/{id}/skip)
déclare l'entité preventive_occurrence. Sans règle audit_rule ni place dans les entity_types
du motif ROUTINE, la route répond 400. Cette migration ajoute la règle routinière
(preventive_occurrence, field NULL, ROUTINE) et l'entité dans les entity_types de ROUTINE.
Idempotent : sans effet si la règle et l'entité existent déjà.

Effet sur les données : une ligne ajoutée dans audit_rule, entity_types de ROUTINE complété
d'une valeur ; aucune autre ligne modifiée. Retour arrière : le downgrade retire la règle et
l'entité de ROUTINE ; les séquences ne sont pas reculées.

Revision ID: 0008_audit_occurrence_preventive
Revises: 0007_motif_system_cascade
Create Date: 2026-11-14
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0008_audit_occurrence_preventive"
down_revision: Union[str, None] = "0007_motif_system_cascade"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    op.execute(
        "UPDATE public.audit_reason_code SET entity_types = "
        "array_append(COALESCE(entity_types, '{}'), 'preventive_occurrence') "
        "WHERE code = 'ROUTINE' AND entity_types IS NOT NULL "
        "AND NOT ('preventive_occurrence' = ANY(entity_types))"
    )
    op.execute(
        # Identifiant par sous-requête : un agrégat sans GROUP BY renvoie toujours une ligne,
        # le WHERE NOT EXISTS ne suffirait pas à rendre l'insertion idempotente.
        "INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) "
        "SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), "
        "'preventive_occurrence', NULL, true, 'ROUTINE' "
        "WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule "
        "WHERE entity_type = 'preventive_occurrence' AND field IS NULL)"
    )
    # Séquence recalée sans jamais reculer (voir 0004).
    seq = "public.audit_rule_id_seq"
    op.execute(
        f"SELECT setval('{seq}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM "
        f"public.audit_rule), (SELECT last_value FROM {seq})))"
    )


def downgrade() -> None:
    op.execute(
        "DELETE FROM public.audit_rule WHERE entity_type = 'preventive_occurrence' "
        "AND field IS NULL"
    )
    op.execute(
        "UPDATE public.audit_reason_code SET entity_types = "
        "array_remove(entity_types, 'preventive_occurrence') WHERE code = 'ROUTINE'"
    )
