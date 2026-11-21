"""Clés étrangères de intervention_action_task (TRI-02)

La table de jonction action-tâche n'avait aucune clé étrangère : supprimer une action laissait
un lien orphelin, compté comme action et bloquant la suppression de la tâche.

Effet sur les données : les liens orphelins éventuels (action ou tâche inexistante) sont
supprimés et leur nombre est journalisé ; aucune autre ligne n'est modifiée. Puis deux clés
étrangères ON DELETE CASCADE sont posées (vers intervention_action et intervention_task).
Retour arrière : le downgrade retire les deux contraintes ; les liens supprimés ne sont pas
restaurés.

Revision ID: 0017_action_task_fk
Revises: 0016_notification_dismissed_at
Create Date: 2026-11-19
"""

from __future__ import annotations

import logging
from typing import Union

from alembic import op

revision: str = "0017_action_task_fk"
down_revision: Union[str, None] = "0016_notification_dismissed_at"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

logger = logging.getLogger("alembic.runtime.migration")

_FK_ACTION = "intervention_action_task_action_id_fkey"
_FK_TASK = "intervention_action_task_task_id_fkey"


def _add_fk(name: str, column: str, target: str) -> None:
    # Pas de IF NOT EXISTS pour une contrainte : test dans pg_constraint (idempotence).
    op.execute(
        f"""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = '{name}'
                  AND conrelid = 'public.intervention_action_task'::regclass
            ) THEN
                ALTER TABLE public.intervention_action_task
                    ADD CONSTRAINT {name} FOREIGN KEY ({column})
                    REFERENCES public.{target}(id) ON DELETE CASCADE;
            END IF;
        END $$
        """
    )


def upgrade() -> None:
    result = op.get_bind().exec_driver_sql(
        """
        WITH deleted AS (
            DELETE FROM public.intervention_action_task iat
            WHERE NOT EXISTS (SELECT 1 FROM public.intervention_action a WHERE a.id = iat.action_id)
               OR NOT EXISTS (SELECT 1 FROM public.intervention_task t WHERE t.id = iat.task_id)
            RETURNING 1
        )
        SELECT count(*) FROM deleted
        """
    )
    logger.info("0017 : %s lien(s) orphelin(s) action-tâche supprimé(s)", result.scalar())
    _add_fk(_FK_ACTION, "action_id", "intervention_action")
    _add_fk(_FK_TASK, "task_id", "intervention_task")


def downgrade() -> None:
    op.execute(f"ALTER TABLE public.intervention_action_task DROP CONSTRAINT IF EXISTS {_FK_TASK}")
    op.execute(
        f"ALTER TABLE public.intervention_action_task DROP CONSTRAINT IF EXISTS {_FK_ACTION}"
    )
