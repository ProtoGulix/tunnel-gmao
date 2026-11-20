"""Les types d'intervention vivent en base (TYP-01, ADR 0026)

Cette migration :
- ajoute la colonne description à intervention_type ;
- insère les 8 types (CUR, PRE, REA, BAT, PRO, COF, PIL, MES) absents, sans rien écraser,
  et remplit la description seulement si elle est NULL ;
- rattrape tout code utilisé par intervention.type_inter ou
  intervention_request.suggested_type_inter mais absent de la table (type inactif, libellé =
  code, journalisé) pour que la clé étrangère ne casse jamais une base ;
- pose les clés étrangères intervention_type_inter_fkey et
  intervention_request_suggested_type_inter_fkey vers intervention_type(code) ;
- retire le CHECK chk_suggested_type_inter (0018), que la clé étrangère remplace : il
  interdirait tout type ajouté depuis l'administration.
Idempotent. Le trigger de génération du code intervention ne lit que NEW.type_inter : il
n'est pas touché.

Effet sur les données : jusqu'à 8 lignes ajoutées dans intervention_type, descriptions
remplies si vides, éventuels codes orphelins ajoutés inactifs. Aucune ligne d'intervention
ni de demande modifiée. Les valeurs de suggested_type_inter plus longues que 10 caractères,
sans type correspondant, ne sont pas rattrapées : la clé étrangère échoue alors en nommant
la contrainte (donnée à corriger).
Retour arrière : le downgrade retire les deux clés étrangères, remet chk_suggested_type_inter
si aucune demande ne le viole, et retire la colonne description seulement si elle est vide
partout. Les lignes de types ne sont jamais supprimées.

Revision ID: 0020_types_intervention_en_base
Revises: 0019_motifs_ignorer_occurrence
Create Date: 2026-11-20
"""

from __future__ import annotations

import logging
from typing import Union

from alembic import op

revision: str = "0020_types_intervention_en_base"
down_revision: Union[str, None] = "0019_motifs_ignorer_occurrence"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

logger = logging.getLogger("alembic.runtime.migration")

# (code, libellé, couleur, description) : littéraux fixes, quotes doublées.
_TYPES = (
    ("CUR", "Curatif", "red", "Réparer une panne ou un défaut constaté sur un équipement."),
    ("PRE", "Préventif", "green", "Entretien planifié pour éviter la panne (plan préventif)."),
    ("REA", "Réapprovisionnement", "blue", "Réapprovisionner des pièces ou des consommables."),
    (
        "BAT",
        "Batiment",
        "gray",
        "Travaux sur les locaux et les réseaux du bâtiment, hors équipement de production.",
    ),
    (
        "PRO",
        "Projet",
        "blue",
        "Amélioration, modification ou ajout sur un équipement ou une installation.",
    ),
    (
        "COF",
        "Remise en conformité",
        "amber",
        "Mise aux normes ou correction suite à un contrôle (sécurité, réglementaire).",
    ),
    (
        "PIL",
        "Pilotage",
        "blue",
        "Organisation et suivi du service : documentation, réunions, formation.",
    ),
    (
        "MES",
        "Mise en service",
        "amber",
        "Installation et démarrage d''un équipement neuf ou déplacé.",
    ),
)

_SEQ = "public.intervention_type_id_seq"
_FK_INTERVENTION = "intervention_type_inter_fkey"
_FK_REQUEST = "intervention_request_suggested_type_inter_fkey"
_CHECK = "chk_suggested_type_inter"
_CHECK_DEF = (
    "CHECK (((suggested_type_inter IS NULL) OR ((suggested_type_inter)::text = ANY "
    "(ARRAY[('CUR'::character varying)::text, ('PRE'::character varying)::text, "
    "('REA'::character varying)::text, ('BAT'::character varying)::text, "
    "('PRO'::character varying)::text, ('COF'::character varying)::text, "
    "('PIL'::character varying)::text, ('MES'::character varying)::text]))))"
)

# Codes utilisés et absents de la table (suggested_type_inter est plus large que code).
ORPHANS_SQL = (
    "SELECT code FROM (SELECT type_inter AS code FROM public.intervention "
    "UNION SELECT suggested_type_inter FROM public.intervention_request "
    "WHERE suggested_type_inter IS NOT NULL AND length(suggested_type_inter) <= 10) u "
    "WHERE NOT EXISTS (SELECT 1 FROM public.intervention_type t WHERE t.code = u.code) "
    "ORDER BY code"
)


def _add_fk(table: str, column: str, name: str) -> str:
    return (
        "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "
        f"'{name}' AND conrelid = 'public.{table}'::regclass) THEN "
        f"ALTER TABLE public.{table} ADD CONSTRAINT {name} FOREIGN KEY ({column}) "
        "REFERENCES public.intervention_type(code); END IF; END $$"
    )


def upgrade_statements() -> list[str]:
    """Instructions de upgrade, exposées pour que les tests les rejouent sur une base."""
    statements = ["ALTER TABLE public.intervention_type ADD COLUMN IF NOT EXISTS description text"]
    for code, label, color, description in _TYPES:
        statements.append(
            "INSERT INTO public.intervention_type (id, code, label, color, is_active, "
            "description) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM "
            f"public.intervention_type), '{code}', '{label}', '{color}', true, "
            f"'{description}' WHERE NOT EXISTS (SELECT 1 FROM public.intervention_type "
            f"WHERE code = '{code}') ON CONFLICT (code) DO NOTHING"
        )
        statements.append(
            f"UPDATE public.intervention_type SET description = '{description}' "
            f"WHERE code = '{code}' AND description IS NULL"
        )
    statements += [
        # Rattrapage avant les clés étrangères : une base ne doit jamais faire échouer la pose.
        "INSERT INTO public.intervention_type (id, code, label, is_active) SELECT "
        "(SELECT COALESCE(MAX(id), 0) FROM public.intervention_type) + row_number() OVER "
        "(ORDER BY o.code), o.code, o.code, false FROM (" + ORPHANS_SQL + ") o "
        "ON CONFLICT (code) DO NOTHING",
        # Séquence recalée sans reculer.
        f"SELECT setval('{_SEQ}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM "
        f"public.intervention_type), (SELECT last_value FROM {_SEQ})))",
        _add_fk("intervention", "type_inter", _FK_INTERVENTION),
        _add_fk("intervention_request", "suggested_type_inter", _FK_REQUEST),
        f"ALTER TABLE public.intervention_request DROP CONSTRAINT IF EXISTS {_CHECK}",
    ]
    return statements


def downgrade_statements() -> list[str]:
    return [
        f"ALTER TABLE public.intervention DROP CONSTRAINT IF EXISTS {_FK_INTERVENTION}",
        f"ALTER TABLE public.intervention_request DROP CONSTRAINT IF EXISTS {_FK_REQUEST}",
        # Remis seulement si aucune demande ne le viole (un type ajouté depuis l'admin le ferait).
        "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "
        f"'{_CHECK}' AND conrelid = 'public.intervention_request'::regclass) AND NOT EXISTS "
        "(SELECT 1 FROM public.intervention_request WHERE suggested_type_inter IS NOT NULL "
        "AND suggested_type_inter NOT IN ('CUR','PRE','REA','BAT','PRO','COF','PIL','MES')) "
        "THEN ALTER TABLE public.intervention_request ADD CONSTRAINT "
        f"{_CHECK} {_CHECK_DEF}; END IF; END $$",
        # Colonne retirée seulement si aucune description n'a été saisie ou posée.
        "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM public.intervention_type WHERE description "
        "IS NOT NULL) THEN ALTER TABLE public.intervention_type DROP COLUMN IF EXISTS "
        "description; END IF; END $$",
    ]


def upgrade() -> None:
    connection = op.get_bind()
    # Le comptage précède les instructions : c'est lui qui est journalisé. Les 8 types
    # insérés par la migration ne sont pas des orphelins, même absents avant elle.
    seeded = {row[0] for row in _TYPES}
    orphans = [
        row[0] for row in connection.exec_driver_sql(ORPHANS_SQL).fetchall() if row[0] not in seeded
    ]
    for statement in upgrade_statements():
        op.execute(statement)
    if orphans:
        logger.warning(
            "0020 : %s code(s) de type utilisés mais absents, ajoutés inactifs : %s",
            len(orphans),
            ", ".join(orphans),
        )
    logger.info("0020 : types d'intervention en base, clés étrangères posées")


def downgrade() -> None:
    for statement in downgrade_statements():
        op.execute(statement)
