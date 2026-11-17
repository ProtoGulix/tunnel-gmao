"""Complète les dates de signalement manquantes des interventions (IMPR-04)

Des interventions issues de la reprise d'historique (56 sur la base de dev, toutes de 2025)
ont reported_date NULL : elles n'entrent dans aucune période du tableau de bord d'un
équipement. Le code d'une intervention est généré avec la date du jour de création
(generate_intervention_code) : la date est lue dans le code (segment -AAAAMMJJ-), si elle
est valide. À défaut, la date du premier passage dans intervention_status_log. Sans l'un ni
l'autre, l'intervention reste inchangée et la migration le signale (NOTICE).

Changement hors travail normal : chaque intervention corrigée est tracée dans audit_log par
fn_audit_log_decision (ligne système, decision_type reported_date_changed, ancienne valeur
null, nouvelle valeur la date posée, source dans reason_text), dans la transaction de la
migration. Nouveau motif DATA_BACKFILL (catégorie system), identique à la ligne de
db/seed_reference.sql (base neuve).

Idempotent : seules les interventions à reported_date NULL sont touchées, et celles qui
viennent d'être corrigées ne le sont plus ; rejouée, la migration ne change rien et
n'ajoute aucune ligne d'audit. Un motif DATA_BACKFILL existant n'est ni modifié ni écrasé.

Effet sur les données : reported_date posée sur les interventions qui l'avaient NULL (et
seulement elles), une ligne d'audit_log par intervention corrigée, une ligne ajoutée dans
audit_reason_code. Retour arrière : le downgrade retire le motif seulement si aucun
audit_log ne le référence (pas de clé étrangère : le supprimer laisserait des traces sans
motif lisible) ; il ne remet PAS les dates à NULL, car rien ne distinguerait une date posée
par cette migration d'une date saisie ensuite par un utilisateur ; les lignes d'audit
listent les interventions corrigées si une remise à NULL manuelle est voulue. La séquence
n'est pas reculée.

Revision ID: 0014_dates_signalement
Revises: 0013_motifs_cloture
Create Date: 2026-11-17
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0014_dates_signalement"
down_revision: Union[str, None] = "0013_motifs_cloture"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

_SEQ = "public.audit_reason_code_id_seq"

# Littéraux fixes, quotes doublées (même ligne que db/seed_reference.sql).
_MOTIF = (
    "INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, "
    "decision_types, color, description, is_active) SELECT "
    "(SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), "
    "'DATA_BACKFILL', 'Complétion de données historiques', 'system', '{intervention}', "
    "'{reported_date_changed}', '#64748b', 'Donnée manquante complétée par une migration, "
    "à partir d''une source déjà présente en base (code, journal des statuts).', true "
    "WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code WHERE code = 'DATA_BACKFILL') "
    "ON CONFLICT (code) DO NOTHING"
)

# Ni ":=", ni "(?:", ni "%" : op.execute (SQLAlchemy text) y verrait des paramètres.
_BACKFILL = """
DO $backfill$
DECLARE
    r RECORD;
    v_date date;
    v_source text;
    v_code_part text;
    v_fixed integer = 0;
    v_skipped integer = 0;
BEGIN
    FOR r IN SELECT id, code FROM public.intervention WHERE reported_date IS NULL LOOP
        v_date = NULL;
        v_source = NULL;
        v_code_part = substring(r.code FROM '-([0-9]{8})-');
        IF v_code_part IS NOT NULL THEN
            BEGIN
                v_date = to_date(v_code_part, 'YYYYMMDD');
                -- to_date accepte un 31 février en le reportant : on exige l'aller-retour exact.
                IF to_char(v_date, 'YYYYMMDD') <> v_code_part OR v_date < DATE '2000-01-01' THEN
                    v_date = NULL;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                v_date = NULL;
            END;
            IF v_date IS NOT NULL THEN
                v_source = 'date extraite du code de l''intervention';
            END IF;
        END IF;
        IF v_date IS NULL THEN
            SELECT min(date)::date INTO v_date
              FROM public.intervention_status_log WHERE intervention_id = r.id;
            IF v_date IS NOT NULL THEN
                v_source = 'date du premier passage dans le journal des statuts';
            END IF;
        END IF;
        IF v_date IS NULL THEN
            v_skipped = v_skipped + 1;
            RAISE NOTICE 'IMPR-04 : intervention % (%) sans date exploitable, laissée inchangée', r.id, r.code;
        ELSE
            UPDATE public.intervention SET reported_date = v_date WHERE id = r.id;
            PERFORM public.fn_audit_log_decision(
                'intervention', r.id, 'reported_date_changed',
                jsonb_build_object('reported_date', NULL),
                jsonb_build_object('reported_date', v_date),
                'DATA_BACKFILL', v_source, NULL, true);
            v_fixed = v_fixed + 1;
        END IF;
    END LOOP;
    RAISE NOTICE 'IMPR-04 : % dates de signalement posées, % interventions sans date exploitable', v_fixed, v_skipped;
END
$backfill$
"""


def upgrade_statements() -> list[str]:
    """Instructions de upgrade, exposées pour que les tests les rejouent sur une base."""
    return [
        _MOTIF,
        # Séquence recalée (nommée explicitement : pas de OWNED BY, voir 0004) sans reculer.
        f"SELECT setval('{_SEQ}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM "
        f"public.audit_reason_code), (SELECT last_value FROM {_SEQ})))",
        _BACKFILL,
    ]


def downgrade_statements() -> list[str]:
    return [
        "DELETE FROM public.audit_reason_code r WHERE r.code = 'DATA_BACKFILL' "
        "AND NOT EXISTS (SELECT 1 FROM public.audit_log l WHERE l.reason_code_id = r.id)"
    ]


def upgrade() -> None:
    for statement in upgrade_statements():
        op.execute(statement)


def downgrade() -> None:
    for statement in downgrade_statements():
        op.execute(statement)
