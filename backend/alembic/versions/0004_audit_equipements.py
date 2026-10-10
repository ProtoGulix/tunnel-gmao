"""Audit des modifications d'équipement (ADR 0011, décision 3.4)

Ajoute le motif EQUIPMENT_UPDATE (catégorie auto : jamais proposé à l'utilisateur) et une
règle d'audit routine par défaut pour l'entité equipement, pour que le AuditMiddleware
trace chaque modification sans motif saisi. Idempotent : sans effet si les lignes existent.

Revision ID: 0004_audit_equipements
Revises: 0003_equipements_fk
Create Date: 2026-10-10
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0004_audit_equipements"
down_revision: Union[str, None] = "0003_equipements_fk"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    op.execute(
        "INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, color, "
        "description, is_active) SELECT COALESCE(MAX(id), 0) + 1, 'EQUIPMENT_UPDATE', "
        "'Mise à jour équipement', 'auto', '{equipement}', '#94a3b8', 'Motif posé "
        "automatiquement sur toute modification d''équipement. Jamais affiché à "
        "l''utilisateur.', true FROM public.audit_reason_code ON CONFLICT (code) DO NOTHING"
    )
    op.execute(
        "INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) "
        "SELECT COALESCE(MAX(id), 0) + 1, 'equipement', NULL, true, 'EQUIPMENT_UPDATE' "
        "FROM public.audit_rule "
        "WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule "
        "WHERE entity_type = 'equipement' AND field IS NULL)"
    )
    # Les graines (migration 0002) posent des id explicites : on recale les séquences pour que
    # les insertions suivantes (écran d'administration) ne heurtent pas ces lignes. Séquences
    # nommées explicitement : celle de audit_reason_code n'a pas de OWNED BY, donc
    # pg_get_serial_sequence renverrait NULL. GREATEST : ne jamais faire reculer une séquence.
    for table in ("audit_reason_code", "audit_rule"):
        seq = f"public.{table}_id_seq"
        op.execute(
            f"SELECT setval('{seq}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.{table}), "
            f"(SELECT last_value FROM {seq})))"
        )


def downgrade() -> None:
    # audit_log.reason_code_id n'a pas de clé étrangère : les traces déjà écrites avec ce
    # motif garderont un id orphelin. Les séquences ne sont pas reculées.
    op.execute("DELETE FROM public.audit_rule WHERE entity_type = 'equipement' AND field IS NULL")
    op.execute("DELETE FROM public.audit_reason_code WHERE code = 'EQUIPMENT_UPDATE'")
