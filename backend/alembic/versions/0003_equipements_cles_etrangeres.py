"""Clés étrangères de l'arbre des équipements (ADR 0011, décision 2.1)

Ajoute sur machine : equipement_mere -> machine.id, equipement_class_id ->
equipement_class.id et statut_id -> equipement_statuts.id, toutes en ON DELETE
RESTRICT, plus un index sur equipement_mere (parcours de l'arbre, recherche des
filles). Échoue sans rien modifier si des données orphelines existent (DDL
transactionnel de PostgreSQL) : le diagnostic du 2026-10-10 n'en a trouvé aucune.

Revision ID: 0003_equipements_fk
Revises: 0002_donnees_reference
Create Date: 2026-10-10
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0003_equipements_fk"
down_revision: Union[str, None] = "0002_donnees_reference"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE public.machine ADD CONSTRAINT machine_equipement_mere_fkey "
        "FOREIGN KEY (equipement_mere) REFERENCES public.machine (id) ON DELETE RESTRICT"
    )
    op.execute(
        "ALTER TABLE public.machine ADD CONSTRAINT machine_equipement_class_id_fkey "
        "FOREIGN KEY (equipement_class_id) REFERENCES public.equipement_class (id) "
        "ON DELETE RESTRICT"
    )
    op.execute(
        "ALTER TABLE public.machine ADD CONSTRAINT machine_statut_id_fkey "
        "FOREIGN KEY (statut_id) REFERENCES public.equipement_statuts (id) ON DELETE RESTRICT"
    )
    op.execute(
        "CREATE INDEX idx_machine_equipement_mere ON public.machine (equipement_mere)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS public.idx_machine_equipement_mere")
    op.execute("ALTER TABLE public.machine DROP CONSTRAINT IF EXISTS machine_statut_id_fkey")
    op.execute(
        "ALTER TABLE public.machine DROP CONSTRAINT IF EXISTS machine_equipement_class_id_fkey"
    )
    op.execute("ALTER TABLE public.machine DROP CONSTRAINT IF EXISTS machine_equipement_mere_fkey")
