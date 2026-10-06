"""Données de référence (statuts, rôles, catégories, seuils, règles d'audit)

Exécute backend/db/seed_reference.sql : INSERT ... ON CONFLICT DO NOTHING, donc
rejouable sans doublon ni écrasement. Aucun référentiel propre à une usine
(services, classes d'équipement, familles de stock, templates, règles
préventives, locations) : ils restent vides. Correction par rapport au spike :
intervention_status_ref.code vaut id (ouvert, ferme, attente_pieces, attente_prod).

Revision ID: 0002_donnees_reference
Revises: 0001_schema_initial
Create Date: 2026-10-06
"""

from __future__ import annotations

from pathlib import Path
from typing import Union

from alembic import op

revision: str = "0002_donnees_reference"
down_revision: Union[str, None] = "0001_schema_initial"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

_SEED = Path(__file__).resolve().parents[2] / "db" / "seed_reference.sql"


def upgrade() -> None:
    cursor = op.get_bind().connection.cursor()
    try:
        cursor.execute(_SEED.read_text(encoding="utf-8"))
    finally:
        cursor.close()


def downgrade() -> None:
    raise NotImplementedError(
        "Les données de référence ne se retirent pas : restaurer une sauvegarde."
    )
