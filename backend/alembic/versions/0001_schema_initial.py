"""Schéma initial de Tunnel (70 tables, 2 vues, fonctions et triggers)

Exécute backend/db/schema.sql, généré par pg_dump --schema-only de la base de
dev (spike 0001, ADR 0006). Remplace toute l'ancienne chaîne (000 à 030).
Le rôle qui lance la migration doit pouvoir faire CREATE EXTENSION (unaccent,
uuid-ossp) : c'est le cas du rôle propriétaire de l'image postgres officielle.

INSTANCE EXISTANTE (base de dev / production actuelle, à la révision
030_intervention_status_ref_code de l'ancienne chaîne) : ne jamais lancer
`upgrade`. Procédure, à faire à la main et jamais automatiquement :

1. Sauvegarde complète : pg_dump de toute la base.
2. Vérifier que le schéma réel égale db/schema.sql : comparer
   `pg_dump --schema-only --no-owner --no-privileges -T 'directus_*'
   -T alembic_version -T alembic_version_backend` de l'instance avec celui
   d'une base neuve installée par cette chaîne (seules les lignes \\restrict et
   quatre expressions CHECK/vue réécrites par PostgreSQL peuvent différer).
3. Vérifier que intervention_status_ref.code = id sur les 4 lignes.
4. `cd backend && alembic stamp 0002_donnees_reference` (avec DATABASE_URL_OWNER).
   La table alembic_version_backend contient alors cette révision à la place de
   030_intervention_status_ref_code. Rien d'autre n'est modifié.

Revision ID: 0001_schema_initial
Revises:
Create Date: 2026-10-06
"""

from __future__ import annotations

from pathlib import Path
from typing import Union

from alembic import op

revision: str = "0001_schema_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

_SQL_DIR = Path(__file__).resolve().parents[2] / "db"


def run_sql_file(name: str) -> None:
    """Exécute un fichier SQL complet via le curseur DBAPI (pas d'interpolation de %)."""
    sql = (_SQL_DIR / name).read_text(encoding="utf-8")
    cursor = op.get_bind().connection.cursor()
    try:
        cursor.execute(sql)
        # pg_dump vide search_path pour la session : on le remet avant de rendre la main.
        cursor.execute("SET search_path TO public")
    finally:
        cursor.close()


def upgrade() -> None:
    run_sql_file("schema.sql")


def downgrade() -> None:
    raise NotImplementedError("La révision initiale ne se défait pas : restaurer une sauvegarde.")
