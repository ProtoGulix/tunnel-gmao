"""Types d'intervention permis par classe d'équipement (TPE-01, ADR 0031)

Cette migration crée la table de liaison `equipement_class_intervention_type`
(equipement_class_id uuid, intervention_type_code varchar(10)) :
- clé primaire sur le couple (la lecture par classe s'appuie sur elle) ;
- clé étrangère vers equipement_class(id) ON DELETE CASCADE : supprimer une classe supprime
  sa liste ;
- clé étrangère vers intervention_type(code) ON UPDATE CASCADE (le code est une valeur
  modifiable depuis l'administration), suppression refusée tant qu'une classe le référence ;
- index sur intervention_type_code, pour la clé étrangère (mise à jour ou suppression d'un type).
Aucune ligne n'est insérée : une classe sans ligne permet tous les types (ADR 0031, point 2).
Les droits du rôle applicatif viennent des privilèges par défaut posés par le bootstrap pour
le rôle propriétaire : aucun GRANT ici, comme les migrations précédentes.
Idempotent (IF NOT EXISTS).

Effet sur les données existantes : aucun. Une table vide est ajoutée, rien n'est lu ni modifié.
Retour arrière : le downgrade supprime la table (DROP TABLE IF EXISTS) ; les listes de types
saisies depuis la montée de version sont perdues, les classes et les types ne sont pas touchés.

Revision ID: 0023_types_par_classe
Revises: 0022_auteur_des_journaux
Create Date: 2026-11-20
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0023_types_par_classe"
down_revision: Union[str, None] = "0022_auteur_des_journaux"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

_CREATE = """
CREATE TABLE IF NOT EXISTS public.equipement_class_intervention_type (
    equipement_class_id uuid NOT NULL,
    intervention_type_code character varying(10) NOT NULL,
    CONSTRAINT equipement_class_intervention_type_pkey
        PRIMARY KEY (equipement_class_id, intervention_type_code),
    CONSTRAINT equipement_class_intervention_type_class_fkey
        FOREIGN KEY (equipement_class_id) REFERENCES public.equipement_class (id)
        ON DELETE CASCADE,
    CONSTRAINT equipement_class_intervention_type_type_fkey
        FOREIGN KEY (intervention_type_code) REFERENCES public.intervention_type (code)
        ON UPDATE CASCADE
)
"""

_INDEX = (
    "CREATE INDEX IF NOT EXISTS idx_equipement_class_intervention_type_code "
    "ON public.equipement_class_intervention_type (intervention_type_code)"
)

_DROP = "DROP TABLE IF EXISTS public.equipement_class_intervention_type"


def upgrade_statements() -> list[str]:
    """Instructions de upgrade, exposées pour que les tests les rejouent sur une base."""
    return [_CREATE, _INDEX]


def downgrade_statements() -> list[str]:
    """Instructions de downgrade, exposées pour les tests."""
    return [_DROP]


def upgrade() -> None:
    for statement in upgrade_statements():
        op.execute(statement)


def downgrade() -> None:
    for statement in downgrade_statements():
        op.execute(statement)
