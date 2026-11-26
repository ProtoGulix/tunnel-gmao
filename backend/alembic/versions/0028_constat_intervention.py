"""Constat après intervention : questions, choix, constats, réponses (CST-01, ADR 0043)

Cette migration :
- crée constat_question et constat_choice (référentiel : code, libellé, ordre, actif ; un choix
  porte un type d'intervention préconisé, une question un choix parent) et pose les questions
  et choix de départ ;
- crée constat (une version par ligne, supersedes_id unique) et constat_answer ;
- ajoute intervention_type.constat_required (vrai pour CUR à la création de la colonne
  seulement : un réglage fait ensuite depuis l'administration n'est jamais écrasé) ;
- ajoute intervention_request.source_intervention_id (intervention d'origine, nullable) ;
- ajoute le motif CONSTAT_CORRECTION (décision constat_corrected) et les règles d'audit des
  entités constat, constat_question et constat_choice (routinières).
Aucune suppression en cascade : un constat n'est jamais effacé par celle d'une autre ligne.
Idempotent. Le fichier db/seed_reference.sql s'exécute avant cette migration (0002) : il
contient les mêmes instructions.

Effet sur les données existantes : aucune ligne existante modifiée, sauf constat_required de CUR
mis à vrai. Tables vides ajoutées, référentiel posé, un motif et trois règles d'audit ajoutés.
Retour arrière : le downgrade REFUSE (erreur ASSERT) s'il existe un constat ou une demande liée à
une intervention d'origine, pour ne rien perdre ; sinon il supprime les tables, les deux
colonnes, les règles d'audit et le motif (conservé si un audit_log le cite).

Revision ID: 0028_constat_intervention
Revises: 0027_motifs_remise_a_faire
Create Date: 2026-11-22
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0028_constat_intervention"
down_revision: Union[str, None] = "0027_motifs_remise_a_faire"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

# (code, libellé, multiple, code du choix parent). Dans l'ordre de l'écran.
_QUESTIONS = (
    ("LEVER", "Qu''est-ce qui aurait réduit ou évité cet arrêt ?", True, None),
    ("FREQUENCY", "À quelle fréquence ?", False, "TASK"),
    ("KNOWN_SINCE", "Problème connu depuis ?", False, "PROJECT"),
    ("DOMAIN", "Quels domaines ?", True, "TRAINING"),
    ("PARAMETER", "Quels paramètres ?", True, "MONITORING"),
    ("SIGNAL", "Signal visible avant la panne ?", False, None),
    ("PART", "Parties concernées", True, None),
)

# (question, code, libellé, type préconisé). Codes de choix uniques sur toute la table.
_CHOICES = (
    ("LEVER", "TASK", "Tâche de maintenance régulière", "PRE"),
    ("LEVER", "PROJECT", "Projet ou modification", "PRO"),
    ("LEVER", "TRAINING", "Formation", None),
    ("LEVER", "MONITORING", "Surveillance ou inspection", None),
    ("LEVER", "OTHER", "Autre", None),
    ("FREQUENCY", "FREQ_WEEKLY", "Hebdomadaire", None),
    ("FREQUENCY", "FREQ_MONTHLY", "Mensuelle", None),
    ("FREQUENCY", "FREQ_QUARTERLY", "Trimestrielle", None),
    ("FREQUENCY", "FREQ_YEARLY", "Annuelle", None),
    ("FREQUENCY", "FREQ_PLANNED_STOP", "Lors d''un arrêt planifié", None),
    ("KNOWN_SINCE", "SINCE_NEVER", "Jamais (apparu brutalement)", None),
    ("KNOWN_SINCE", "SINCE_LT_1M", "Moins d''un mois", None),
    ("KNOWN_SINCE", "SINCE_1_3M", "1 à 3 mois", None),
    ("KNOWN_SINCE", "SINCE_GT_3M", "Plus de 3 mois", None),
    ("DOMAIN", "DOM_ELECTRICAL", "Électrique", None),
    ("DOMAIN", "DOM_AUTOMATION", "Automatisme", None),
    ("DOMAIN", "DOM_MECHANICAL", "Mécanique", None),
    ("DOMAIN", "DOM_PNEUMATIC", "Pneumatique", None),
    ("DOMAIN", "DOM_SOFTWARE", "Logiciel", None),
    ("DOMAIN", "DOM_METHOD", "Méthode ou procédure", None),
    ("PARAMETER", "PARAM_VIBRATION", "Vibration", None),
    ("PARAMETER", "PARAM_TEMPERATURE", "Température", None),
    ("PARAMETER", "PARAM_PRESSURE", "Pression", None),
    ("PARAMETER", "PARAM_LEVEL", "Niveau", None),
    ("PARAMETER", "PARAM_VISUAL", "État visuel", None),
    ("PARAMETER", "PARAM_COUNTER", "Compteur", None),
    ("SIGNAL", "SIGNAL_SEEN", "Oui et je l''ai vu", None),
    ("SIGNAL", "SIGNAL_NOT_REPORTED", "Oui mais non remonté", None),
    ("SIGNAL", "SIGNAL_NONE", "Non", None),
    ("PART", "PART_PLC", "Automate", None),
    ("PART", "PART_ELECTRICAL", "Électrique", None),
    ("PART", "PART_PNEUMATIC", "Pneumatique", None),
    ("PART", "PART_MECHANICAL", "Mécanique", None),
    ("PART", "PART_BUILDING", "Bâtiment", None),
)

_MOTIF = (
    "CONSTAT_CORRECTION",
    "Correction",
    "#d97706",
    "Le constat est corrigé : une nouvelle version remplace la précédente.",
)

_ENTITIES = ("constat", "constat_question", "constat_choice")

_CREATE_QUESTION = """CREATE TABLE IF NOT EXISTS public.constat_question (
    id serial NOT NULL,
    code character varying(50) NOT NULL,
    label text NOT NULL,
    is_multiple boolean NOT NULL DEFAULT false,
    parent_choice_id integer,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    CONSTRAINT constat_question_pkey PRIMARY KEY (id),
    CONSTRAINT constat_question_code_key UNIQUE (code)
)"""

_CREATE_CHOICE = """CREATE TABLE IF NOT EXISTS public.constat_choice (
    id serial NOT NULL,
    question_id integer NOT NULL,
    code character varying(50) NOT NULL,
    label text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    suggested_type_inter character varying(10),
    CONSTRAINT constat_choice_pkey PRIMARY KEY (id),
    CONSTRAINT constat_choice_code_key UNIQUE (code),
    CONSTRAINT constat_choice_question_fkey FOREIGN KEY (question_id)
        REFERENCES public.constat_question (id),
    CONSTRAINT constat_choice_suggested_type_fkey FOREIGN KEY (suggested_type_inter)
        REFERENCES public.intervention_type (code) ON UPDATE CASCADE
)"""

_PARENT_FK = (
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "
    "'constat_question_parent_choice_fkey' AND conrelid = "
    "'public.constat_question'::regclass) THEN ALTER TABLE public.constat_question "
    "ADD CONSTRAINT constat_question_parent_choice_fkey FOREIGN KEY (parent_choice_id) "
    "REFERENCES public.constat_choice (id); END IF; END $$"
)

# Version courante = ligne que aucune autre ne remplace. Aucune cascade : suppression refusée
# tant qu'une ligne en dépend.
_CREATE_CONSTAT = """CREATE TABLE IF NOT EXISTS public.constat (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    intervention_id uuid NOT NULL,
    machine_id uuid NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    supersedes_id uuid,
    request_id uuid NOT NULL,
    linked_request_id uuid,
    CONSTRAINT constat_pkey PRIMARY KEY (id),
    CONSTRAINT constat_supersedes_id_key UNIQUE (supersedes_id),
    CONSTRAINT constat_not_self_superseding CHECK (supersedes_id IS DISTINCT FROM id),
    CONSTRAINT constat_intervention_fkey FOREIGN KEY (intervention_id)
        REFERENCES public.intervention (id),
    CONSTRAINT constat_machine_fkey FOREIGN KEY (machine_id) REFERENCES public.machine (id),
    CONSTRAINT constat_created_by_fkey FOREIGN KEY (created_by)
        REFERENCES public.tunnel_user (id),
    CONSTRAINT constat_supersedes_fkey FOREIGN KEY (supersedes_id)
        REFERENCES public.constat (id),
    CONSTRAINT constat_request_fkey FOREIGN KEY (request_id)
        REFERENCES public.intervention_request (id),
    CONSTRAINT constat_linked_request_fkey FOREIGN KEY (linked_request_id)
        REFERENCES public.intervention_request (id)
)"""

_CREATE_ANSWER = """CREATE TABLE IF NOT EXISTS public.constat_answer (
    constat_id uuid NOT NULL,
    choice_code character varying(50) NOT NULL,
    CONSTRAINT constat_answer_pkey PRIMARY KEY (constat_id, choice_code),
    CONSTRAINT constat_answer_constat_fkey FOREIGN KEY (constat_id)
        REFERENCES public.constat (id),
    CONSTRAINT constat_answer_choice_fkey FOREIGN KEY (choice_code)
        REFERENCES public.constat_choice (code) ON UPDATE CASCADE
)"""

_INDEXES = (
    "CREATE INDEX IF NOT EXISTS idx_constat_intervention ON public.constat (intervention_id)",
    "CREATE INDEX IF NOT EXISTS idx_constat_machine ON public.constat (machine_id)",
    "CREATE INDEX IF NOT EXISTS idx_constat_request ON public.constat (request_id)",
    "CREATE INDEX IF NOT EXISTS idx_constat_linked_request ON public.constat "
    "(linked_request_id)",
    "CREATE INDEX IF NOT EXISTS idx_constat_answer_choice ON public.constat_answer "
    "(choice_code)",
    "CREATE INDEX IF NOT EXISTS idx_constat_choice_question ON public.constat_choice "
    "(question_id)",
    "CREATE INDEX IF NOT EXISTS idx_intervention_request_source_intervention ON "
    "public.intervention_request (source_intervention_id)",
)

# La colonne et la valeur de CUR sont posées ensemble : relancer ne réécrase pas un réglage.
_REQUIRED = (
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE "
    "table_schema = 'public' AND table_name = 'intervention_type' AND column_name = "
    "'constat_required') THEN ALTER TABLE public.intervention_type ADD COLUMN "
    "constat_required boolean NOT NULL DEFAULT false; UPDATE public.intervention_type "
    "SET constat_required = true WHERE code = 'CUR'; END IF; END $$"
)

_SOURCE = (
    "ALTER TABLE public.intervention_request ADD COLUMN IF NOT EXISTS "
    "source_intervention_id uuid",
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "
    "'intervention_request_source_intervention_fkey' AND conrelid = "
    "'public.intervention_request'::regclass) THEN ALTER TABLE public.intervention_request "
    "ADD CONSTRAINT intervention_request_source_intervention_fkey FOREIGN KEY "
    "(source_intervention_id) REFERENCES public.intervention (id); END IF; END $$",
)

_SEQ_RULE = "public.audit_rule_id_seq"
_SEQ_REASON = "public.audit_reason_code_id_seq"


def _seed_statements() -> list[str]:
    """Questions puis choix, dans l'ordre : un parent existe avant la question qui en dépend."""
    statements = []
    for order, (code, label, multiple, parent) in enumerate(_QUESTIONS, start=1):
        parent_sql = (
            f"(SELECT id FROM public.constat_choice WHERE code = '{parent}')" if parent else "NULL"
        )
        statements.append(
            "INSERT INTO public.constat_question (code, label, is_multiple, parent_choice_id, "
            f"sort_order, is_active) SELECT '{code}', '{label}', "
            f"{'true' if multiple else 'false'}, {parent_sql}, {order}, true WHERE NOT EXISTS "
            f"(SELECT 1 FROM public.constat_question WHERE code = '{code}') "
            "ON CONFLICT (code) DO NOTHING"
        )
        position = 0
        for question, choice, choice_label, type_code in _CHOICES:
            if question != code:
                continue
            position += 1
            type_sql = f"'{type_code}'" if type_code else "NULL"
            statements.append(
                "INSERT INTO public.constat_choice (question_id, code, label, sort_order, "
                "is_active, suggested_type_inter) SELECT (SELECT id FROM "
                f"public.constat_question WHERE code = '{code}'), '{choice}', "
                f"'{choice_label}', {position}, true, {type_sql} WHERE NOT EXISTS "
                f"(SELECT 1 FROM public.constat_choice WHERE code = '{choice}') "
                "ON CONFLICT (code) DO NOTHING"
            )
    return statements


def _audit_statements() -> list[str]:
    code, label, color, description = _MOTIF
    statements = [
        "INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, "
        "decision_types, color, description, is_active) SELECT "
        "(SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), "
        f"'{code}', '{label}', 'user', '{{constat}}', '{{constat_corrected}}', '{color}', "
        f"'{description}', true WHERE NOT EXISTS "
        f"(SELECT 1 FROM public.audit_reason_code WHERE code = '{code}') "
        "ON CONFLICT (code) DO NOTHING",
        f"SELECT setval('{_SEQ_REASON}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM "
        f"public.audit_reason_code), (SELECT last_value FROM {_SEQ_REASON})))",
    ]
    for entity in _ENTITIES:
        statements += [
            "UPDATE public.audit_reason_code SET entity_types = "
            f"array_append(COALESCE(entity_types, '{{}}'), '{entity}') "
            "WHERE code = 'ROUTINE' AND entity_types IS NOT NULL "
            f"AND NOT ('{entity}' = ANY(entity_types))",
            "INSERT INTO public.audit_rule (id, entity_type, field, is_routine, "
            "default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM "
            f"public.audit_rule), '{entity}', NULL, true, 'ROUTINE' WHERE NOT EXISTS "
            f"(SELECT 1 FROM public.audit_rule WHERE entity_type = '{entity}' "
            "AND field IS NULL)",
        ]
    statements.append(
        f"SELECT setval('{_SEQ_RULE}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM "
        f"public.audit_rule), (SELECT last_value FROM {_SEQ_RULE})))"
    )
    return statements


def upgrade_statements() -> list[str]:
    """Instructions de upgrade, exposées pour que les tests les rejouent sur une base."""
    return [
        _CREATE_QUESTION,
        _CREATE_CHOICE,
        _PARENT_FK,
        _CREATE_CONSTAT,
        _CREATE_ANSWER,
        _REQUIRED,
        *_SOURCE,
        *_INDEXES,
        *_seed_statements(),
        *_audit_statements(),
    ]


# Refuse tout retour arrière qui effacerait un constat ou le lien d'une demande. ASSERT et non
# RAISE EXCEPTION : ce garde-fou d'exploitation ne doit jamais passer pour un refus métier.
_GUARD = (
    "DO $$ DECLARE n bigint; BEGIN "
    "IF to_regclass('public.constat') IS NOT NULL THEN "
    "EXECUTE 'SELECT count(*) FROM public.constat' INTO n; "
    "ASSERT n = 0, 'retour arrière refusé : des constats existent'; END IF; "
    "IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' "
    "AND table_name = 'intervention_request' AND column_name = 'source_intervention_id') THEN "
    "EXECUTE 'SELECT count(*) FROM public.intervention_request "
    "WHERE source_intervention_id IS NOT NULL' INTO n; "
    "ASSERT n = 0, 'retour arrière refusé : des demandes sont liées à une intervention "
    "d''origine'; END IF; END $$"
)


def downgrade_statements() -> list[str]:
    statements = [
        _GUARD,
        "DROP TABLE IF EXISTS public.constat_answer",
        "DROP TABLE IF EXISTS public.constat",
        "ALTER TABLE IF EXISTS public.constat_question "
        "DROP CONSTRAINT IF EXISTS constat_question_parent_choice_fkey",
        "DROP TABLE IF EXISTS public.constat_choice",
        "DROP TABLE IF EXISTS public.constat_question",
        "ALTER TABLE public.intervention_request DROP COLUMN IF EXISTS source_intervention_id",
        "ALTER TABLE public.intervention_type DROP COLUMN IF EXISTS constat_required",
    ]
    entities = ", ".join(f"'{e}'" for e in _ENTITIES)
    statements += [
        f"DELETE FROM public.audit_rule WHERE entity_type IN ({entities}) AND field IS NULL",
        "UPDATE public.audit_reason_code SET entity_types = ARRAY(SELECT e FROM "
        f"unnest(entity_types) e WHERE e NOT IN ({entities})) WHERE code = 'ROUTINE' "
        "AND entity_types IS NOT NULL",
        f"DELETE FROM public.audit_reason_code r WHERE r.code = '{_MOTIF[0]}' "
        "AND NOT EXISTS (SELECT 1 FROM public.audit_log l WHERE l.reason_code_id = r.id)",
    ]
    return statements


def upgrade() -> None:
    for statement in upgrade_statements():
        op.execute(statement)


def downgrade() -> None:
    for statement in downgrade_statements():
        op.execute(statement)
