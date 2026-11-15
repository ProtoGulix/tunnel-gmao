"""Vide le résidu « 0 » du champ affectation (ADR 0011, étape 5)

La migration de la v4 a laissé la valeur « 0 » dans machine.affectation pour la
plupart des équipements (320 sur 346 sur la base de dev, constat du 2026-10-10).
Ce n'est pas un emplacement : on la remplace par NULL, que la fiche affiche « Vide ».
Seule la valeur exacte « 0 » (espaces compris) est touchée ; tout autre texte reste.

Irréversible par nature : le downgrade ne remet pas « 0 », qui ne portait aucune
information.

Revision ID: 0005_affectation_residu
Revises: 0004_audit_equipements
Create Date: 2026-10-10
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0005_affectation_residu"
down_revision: Union[str, None] = "0004_audit_equipements"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

# Exposé pour le test d'intégration, qui l'applique à des lignes insérées après coup.
CLEAN_SQL = "UPDATE public.machine SET affectation = NULL WHERE btrim(affectation) = '0'"


def upgrade() -> None:
    op.execute(CLEAN_SQL)


def downgrade() -> None:
    # Rien à restaurer : « 0 » n'était pas une donnée.
    pass
