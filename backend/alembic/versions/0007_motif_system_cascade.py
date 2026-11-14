"""Motif SYSTEM_CASCADE pour les mutations du système (ADR 0018, point 6)

Ajoute le motif SYSTEM_CASCADE (catégorie system, toutes entités et toutes décisions) pour
tracer les mutations produites par le système lui-même : cascades, génération, acceptation
automatique. Idempotent : sans effet si le motif existe déjà.

Effet sur les données : une ligne ajoutée dans audit_reason_code, aucune ligne existante
modifiée. Retour arrière : le downgrade retire la ligne seulement si aucun audit_log ne la
référence ; sinon il la laisse en place (audit_log.reason_code_id n'a pas de clé étrangère,
la supprimer laisserait des traces sans motif lisible).

Revision ID: 0007_motif_system_cascade
Revises: 0006_audit_erreurs_visibles
Create Date: 2026-11-14
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0007_motif_system_cascade"
down_revision: Union[str, None] = "0006_audit_erreurs_visibles"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    op.execute(
        "INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, "
        "decision_types, color, description, is_active) SELECT COALESCE(MAX(id), 0) + 1, "
        "'SYSTEM_CASCADE', 'Mutation automatique du système', 'system', NULL, NULL, "
        "'#64748b', 'Mutation produite par le système lui-même (cascade, génération, "
        "acceptation automatique), sans décision d''un utilisateur.', true "
        "FROM public.audit_reason_code ON CONFLICT (code) DO NOTHING"
    )
    # Séquence recalée (nommée explicitement : pas de OWNED BY, voir 0004) sans jamais reculer.
    seq = "public.audit_reason_code_id_seq"
    op.execute(
        f"SELECT setval('{seq}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM "
        f"public.audit_reason_code), (SELECT last_value FROM {seq})))"
    )


def downgrade() -> None:
    op.execute(
        "DELETE FROM public.audit_reason_code r WHERE r.code = 'SYSTEM_CASCADE' "
        "AND NOT EXISTS (SELECT 1 FROM public.audit_log l WHERE l.reason_code_id = r.id)"
    )
