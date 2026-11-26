"""Réglages des choix du constat : demande selon le levier (CDL-01, ADR 0045)

Cette migration :
- ajoute constat_choice.creates_request (le choix génère une demande) et is_exclusive (le choix
  ne se combine avec aucun autre de sa question). creates_request passe à vrai pour TASK et
  PROJECT à la création de la colonne seulement : un réglage fait ensuite depuis
  l'administration n'est jamais écrasé ;
- pose le choix NOTHING « Rien ne l'aurait évité » (question LEVER, exclusif, sans demande,
  sans type, en dernier) ;
- rend constat.request_id facultatif (un constat peut exister sans demande).
Idempotent. Le fichier db/seed_reference.sql s'exécute avant cette migration (0002) : il
contient les mêmes instructions.

Effet sur les données existantes : aucune ligne modifiée sauf creates_request de TASK et PROJECT
mis à vrai ; un choix ajouté ; les constats existants gardent leur demande.
Retour arrière : le downgrade REFUSE (erreur ASSERT) si un constat n'a pas de demande ou si une
réponse vise NOTHING ; sinon il retire NOTHING, remet request_id obligatoire et retire les deux
colonnes (les réglages faits depuis l'administration sont perdus).

Revision ID: 0029_constat_reglages_des_choix
Revises: 0028_constat_intervention
Create Date: 2026-11-26
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0029_constat_reglages_des_choix"
down_revision: Union[str, None] = "0028_constat_intervention"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

# Colonne et valeurs de TASK et PROJECT posées ensemble : relancer n'écrase pas un réglage.
_CREATES_REQUEST = (
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE "
    "table_schema = 'public' AND table_name = 'constat_choice' AND column_name = "
    "'creates_request') THEN ALTER TABLE public.constat_choice ADD COLUMN "
    "creates_request boolean NOT NULL DEFAULT false; UPDATE public.constat_choice "
    "SET creates_request = true WHERE code IN ('TASK', 'PROJECT'); END IF; END $$"
)

_EXCLUSIVE = (
    "ALTER TABLE public.constat_choice ADD COLUMN IF NOT EXISTS "
    "is_exclusive boolean NOT NULL DEFAULT false"
)

_NOTHING = (
    "INSERT INTO public.constat_choice (question_id, code, label, sort_order, is_active, "
    "suggested_type_inter, creates_request, is_exclusive) SELECT (SELECT id FROM "
    "public.constat_question WHERE code = 'LEVER'), 'NOTHING', 'Rien ne l''aurait évité', "
    "(SELECT COALESCE(MAX(c.sort_order), 0) + 1 FROM public.constat_choice c WHERE "
    "c.question_id = (SELECT id FROM public.constat_question WHERE code = 'LEVER')), "
    "true, NULL, false, true WHERE NOT EXISTS "
    "(SELECT 1 FROM public.constat_choice WHERE code = 'NOTHING') ON CONFLICT (code) DO NOTHING"
)

_OPTIONAL_REQUEST = "ALTER TABLE public.constat ALTER COLUMN request_id DROP NOT NULL"


def upgrade_statements() -> list[str]:
    """Instructions de upgrade, exposées pour que les tests les rejouent sur une base."""
    return [_CREATES_REQUEST, _EXCLUSIVE, _NOTHING, _OPTIONAL_REQUEST]


# ASSERT et non RAISE EXCEPTION : garde-fou d'exploitation, jamais un refus métier.
_GUARD = (
    "DO $$ DECLARE n bigint; BEGIN "
    "SELECT count(*) INTO n FROM public.constat WHERE request_id IS NULL; "
    "ASSERT n = 0, 'retour arrière refusé : des constats n''ont pas de demande'; "
    "SELECT count(*) INTO n FROM public.constat_answer WHERE choice_code = 'NOTHING'; "
    "ASSERT n = 0, 'retour arrière refusé : des réponses visent NOTHING'; END $$"
)


def downgrade_statements() -> list[str]:
    return [
        _GUARD,
        "DELETE FROM public.constat_choice WHERE code = 'NOTHING'",
        "ALTER TABLE public.constat ALTER COLUMN request_id SET NOT NULL",
        "ALTER TABLE public.constat_choice DROP COLUMN IF EXISTS is_exclusive",
        "ALTER TABLE public.constat_choice DROP COLUMN IF EXISTS creates_request",
    ]


def upgrade() -> None:
    for statement in upgrade_statements():
        op.execute(statement)


def downgrade() -> None:
    for statement in downgrade_statements():
        op.execute(statement)
