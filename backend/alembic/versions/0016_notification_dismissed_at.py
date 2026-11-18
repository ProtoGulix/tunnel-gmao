"""Masquage des notifications : colonne notification.dismissed_at (PREV-11)

Une notification masquée par son destinataire reste en base : la déduplication des paliers de
relance (notify_active_users_once) la compte encore, ce qui évite qu'une relance supprimée
revienne au passage suivant de la tâche quotidienne.

Effet sur les données : une colonne nullable ajoutée, aucune ligne réécrite. Retour arrière :
le downgrade retire la colonne (les masquages sont perdus, les notifications réapparaissent).

Revision ID: 0016_notification_dismissed_at
Revises: 0015_motif_system_schedule
Create Date: 2026-11-18
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0016_notification_dismissed_at"
down_revision: Union[str, None] = "0015_motif_system_schedule"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE public.notification ADD COLUMN IF NOT EXISTS dismissed_at timestamptz")


def downgrade() -> None:
    op.execute("ALTER TABLE public.notification DROP COLUMN IF EXISTS dismissed_at")
