"""La priorité « normale » s'écrit « normal » et devient une contrainte CHECK (PRIO-01, ADR 0039)

intervention.priority était une chaîne libre : « normale » (écrit par le mobile, la création
depuis une demande, le préventif) coexistait avec « normal » (référence du backend, valeur par
défaut de la colonne). Cette migration convertit « normale » en « normal », puis pose une
contrainte CHECK sur les quatre valeurs de PRIORITY_TYPES (faible, normal, important, urgent)
ou NULL.

Changement hors travail normal : chaque intervention convertie est tracée dans audit_log par
fn_audit_log_decision (ligne système, decision_type priority_changed, ancienne valeur
{"priority": "normale"}, nouvelle valeur {"priority": "normal"}), dans la transaction de la
migration. Nouveau motif PRIORITY_NORMALIZED (catégorie system), identique à la ligne de
db/seed_reference.sql (base neuve). Le motif DATA_BACKFILL (0014) n'est pas réutilisé : ses
decision_types ne couvrent que reported_date_changed.

Garde : après conversion, s'il reste une valeur hors liste, la migration échoue en la nommant
(donnée à corriger, pas à masquer) et rien n'est posé. La contrainte est conditionnelle par
nom (ADR 0024).

Idempotent : seules les lignes en « normale » sont touchées ; rejouée, la migration ne change
rien, n'ajoute aucune ligne d'audit et ne repose pas la contrainte. Un motif existant n'est ni
modifié ni écrasé.

Effet sur les données : priority « normale » devient « normal » (et seulement elle), une ligne
d'audit_log par intervention convertie, une ligne ajoutée dans audit_reason_code.
Retour arrière : le downgrade retire la contrainte et le motif (seulement si aucun audit_log
ne le référence). Il NE remet PAS « normale » : rien ne distinguerait les lignes converties de
celles saisies en « normal » ; les lignes d'audit listent les interventions converties si une
remise manuelle est voulue.

Revision ID: 0025_priorite_normal
Revises: 0024_motifs_rejet_demande
Create Date: 2026-11-21
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0025_priorite_normal"
down_revision: Union[str, None] = "0024_motifs_rejet_demande"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

_SEQ = "public.audit_reason_code_id_seq"
CONSTRAINT = "intervention_priority_check"

# Littéraux fixes, quotes doublées (même ligne que db/seed_reference.sql).
_MOTIF = (
    "INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, "
    "decision_types, color, description, is_active) SELECT "
    "(SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), "
    "'PRIORITY_NORMALIZED', 'Priorité normalisée', 'system', '{intervention}', "
    "'{priority_changed}', '#64748b', 'Écriture de la priorité corrigée par une migration "
    "(normale devenue normal, ADR 0039).', true "
    "WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code "
    "WHERE code = 'PRIORITY_NORMALIZED') ON CONFLICT (code) DO NOTHING"
)

# Ni ":=", ni "(?:", ni "%" : op.execute (SQLAlchemy text) y verrait des paramètres.
_CONVERT = """
DO $convert$
DECLARE
    r RECORD;
    v_count integer = 0;
BEGIN
    FOR r IN SELECT id FROM public.intervention WHERE priority = 'normale' LOOP
        UPDATE public.intervention SET priority = 'normal' WHERE id = r.id;
        PERFORM public.fn_audit_log_decision(
            'intervention', r.id, 'priority_changed',
            jsonb_build_object('priority', 'normale'),
            jsonb_build_object('priority', 'normal'),
            'PRIORITY_NORMALIZED', 'priorité normale écrite normal (ADR 0039)', NULL, true);
        v_count = v_count + 1;
    END LOOP;
    RAISE NOTICE 'PRIO-01 : % priorités normale converties en normal', v_count;
END
$convert$
"""

_GUARD = """
DO $guard$
DECLARE
    v_bad text;
BEGIN
    SELECT string_agg(DISTINCT priority, ', ') INTO v_bad
      FROM public.intervention
     WHERE priority IS NOT NULL
       AND priority NOT IN ('faible', 'normal', 'important', 'urgent');
    IF v_bad IS NOT NULL THEN
        -- Message de migration, jamais renvoyé à un client : forme USING MESSAGE, hors du
        -- classement des refus métier de la base (test_messages_base_p0001).
        RAISE EXCEPTION USING MESSAGE = format(
            'PRIO-01 : priorité(s) inconnue(s) dans intervention.priority : %s. '
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
        WHERE conname = '{CONSTRAINT}' AND conrelid = 'public.intervention'::regclass
    ) THEN
        ALTER TABLE public.intervention ADD CONSTRAINT {CONSTRAINT}
            CHECK (priority IS NULL OR priority IN ('faible', 'normal', 'important', 'urgent'));
    END IF;
END
$check$
"""


def upgrade_statements() -> list[str]:
    """Instructions de upgrade, exposées pour que les tests les rejouent sur une base."""
    return [
        _MOTIF,
        # Séquence recalée (nommée explicitement : pas de OWNED BY, voir 0004) sans reculer.
        f"SELECT setval('{_SEQ}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM "
        f"public.audit_reason_code), (SELECT last_value FROM {_SEQ})))",
        _CONVERT,
        _GUARD,
        _CHECK,
    ]


def downgrade_statements() -> list[str]:
    return [
        f"ALTER TABLE public.intervention DROP CONSTRAINT IF EXISTS {CONSTRAINT}",
        "DELETE FROM public.audit_reason_code r WHERE r.code = 'PRIORITY_NORMALIZED' "
        "AND NOT EXISTS (SELECT 1 FROM public.audit_log l WHERE l.reason_code_id = r.id)",
    ]


def upgrade() -> None:
    for statement in upgrade_statements():
        op.execute(statement)


def downgrade() -> None:
    for statement in downgrade_statements():
        op.execute(statement)
