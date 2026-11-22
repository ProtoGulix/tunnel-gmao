"""L'archivage d'une intervention est irrévocable, garanti par la base (IRR-01, ADR 0041)

Une intervention archivée (printed_fiche vrai, ADR 0040) ne doit plus changer d'état d'archive,
et si elle est fermée elle ne se rouvre pas. Un déclencheur BEFORE UPDATE sur intervention
refuse :
- le passage de printed_fiche de vrai à faux ou NULL ;
- la sortie du statut « ferme » d'une intervention archivée.
Le refus vaut pour toute écriture du rôle applicatif (API, script, requête manuelle) ; seul le
rôle propriétaire, celui des migrations, peut désactiver le déclencheur. Les messages sont dans
la liste blanche de api/errors/exceptions.py : l'API les renvoie en 400.

Idempotent : CREATE OR REPLACE de la fonction, déclencheur retiré puis recréé.

Effet sur les données existantes : aucune ligne écrite ni modifiée. Les interventions déjà
archivées sont figées dès la montée de version.
Retour arrière : le downgrade retire le déclencheur et la fonction ; l'archivage redevient
révocable, aucune donnée n'est touchée.

Revision ID: 0026_archivage_irrevocable
Revises: 0025_priorite_normal
Create Date: 2026-11-22
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0026_archivage_irrevocable"
down_revision: Union[str, None] = "0025_priorite_normal"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

# Apostrophes doublées dans les messages ; ni ":" ni "%" : op.execute y verrait des paramètres.
_FUNCTION = """
CREATE OR REPLACE FUNCTION public.fn_archivage_irrevocable() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.printed_fiche IS TRUE THEN
        IF NEW.printed_fiche IS DISTINCT FROM TRUE THEN
            RAISE EXCEPTION 'L''archivage d''une intervention est irrévocable';
        END IF;
        IF OLD.status_actual = 'ferme' AND NEW.status_actual IS DISTINCT FROM 'ferme' THEN
            RAISE EXCEPTION 'Une intervention archivée ne peut pas être rouverte';
        END IF;
    END IF;
    RETURN NEW;
END;
$$
"""

_DROP_TRIGGER = "DROP TRIGGER IF EXISTS trg_archivage_irrevocable ON public.intervention"

_TRIGGER = """
CREATE TRIGGER trg_archivage_irrevocable BEFORE UPDATE ON public.intervention
    FOR EACH ROW EXECUTE FUNCTION public.fn_archivage_irrevocable()
"""


def upgrade() -> None:
    op.execute(_FUNCTION)
    op.execute(_DROP_TRIGGER)
    op.execute(_TRIGGER)


def downgrade() -> None:
    op.execute(_DROP_TRIGGER)
    op.execute("DROP FUNCTION IF EXISTS public.fn_archivage_irrevocable()")
