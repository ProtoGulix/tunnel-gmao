"""Contrainte CHECK sur la priorité d'une demande (ADT-01, ADR 0047)

intervention_request.priorite (varchar 20, vide partout) prend les codes de priorité des
interventions (PRIORITY_TYPES, ADR 0039) : faible, normal, important, urgent, ou NULL.

Garde : s'il existe une valeur hors liste, la migration échoue en la nommant (donnée à
corriger, pas à masquer) et rien n'est posé. Contrainte conditionnelle par nom (ADR 0024),
rejouable.

Effet sur les données existantes : aucune ligne modifiée.
Retour arrière : le downgrade retire la contrainte ; aucune donnée touchée.

Revision ID: 0030_priorite_demande
Revises: 0029_constat_reglages_des_choix
Create Date: 2026-11-28
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0030_priorite_demande"
down_revision: Union[str, None] = "0029_constat_reglages_des_choix"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

CONSTRAINT = "intervention_request_priorite_check"

_GUARD = """
DO $guard$
DECLARE
    v_bad text;
BEGIN
    SELECT string_agg(DISTINCT priorite, ', ') INTO v_bad
      FROM public.intervention_request
     WHERE priorite IS NOT NULL
       AND priorite NOT IN ('faible', 'normal', 'important', 'urgent');
    IF v_bad IS NOT NULL THEN
        RAISE EXCEPTION USING MESSAGE = format(
            'ADT-01 : priorité(s) inconnue(s) dans intervention_request.priorite : %s. '
            'Corriger ces valeurs avant de rejouer la migration.', v_bad);
    END IF;
END
$guard$
"""

_CHECK = f"""
DO $check$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = '{CONSTRAINT}' AND conrelid = 'public.intervention_request'::regclass
    ) THEN
        ALTER TABLE public.intervention_request ADD CONSTRAINT {CONSTRAINT}
            CHECK (priorite IS NULL OR priorite IN ('faible', 'normal', 'important', 'urgent'));
    END IF;
END
$check$
"""


def upgrade_statements() -> list[str]:
    """Instructions de upgrade, exposées pour que les tests les rejouent sur une base."""
    return [_GUARD, _CHECK]


def downgrade_statements() -> list[str]:
    return [f"ALTER TABLE public.intervention_request DROP CONSTRAINT IF EXISTS {CONSTRAINT}"]


def upgrade() -> None:
    for statement in upgrade_statements():
        op.execute(statement)


def downgrade() -> None:
    for statement in downgrade_statements():
        op.execute(statement)
