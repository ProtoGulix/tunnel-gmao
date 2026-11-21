"""Auteur des journaux de statut et fin des doublons de demande (CASC-01, ADR 0029)

Les triggers qui écrivent un journal de statut n'avaient aucun moyen de connaître l'auteur
de la requête. La transaction de requête pose maintenant `app.user_id` (réglage local à la
transaction) ; cette migration :
- ajoute `intervention_status_log.changed_by` (uuid, nullable, FK tunnel_user ON DELETE SET
  NULL comme les autres colonnes d'auteur) ;
- fait lire `NULLIF(current_setting('app.user_id', true), '')::uuid` par trg_log_status_change,
  trg_init_status_log (ligne « ouvert » de l'intervention), fn_log_request_status_change, fn_init_request_status_log et fn_sync_status_log_to_intervention
  (ligne de clôture de la demande) ;
- fait taire fn_log_request_status_change pendant l'UPDATE de la demande dans
  fn_sync_status_log_to_intervention, qui écrit déjà sa propre ligne : fin des doublons.
Hors requête (tâche planifiée, migration), le réglage est absent : l'auteur reste vide.
Idempotent (ADD COLUMN IF NOT EXISTS, contrainte testée, CREATE OR REPLACE).

Effet sur les données existantes : une colonne nullable ajoutée, aucune ligne écrite ni
modifiée (ADR 0029, point 8 : les auteurs et les doublons passés restent tels quels). Seules
les écritures futures changent.
Retour arrière : le downgrade remet les cinq fonctions d'origine, retire la contrainte puis
la colonne intervention_status_log.changed_by (les auteurs écrits depuis la montée de version
sont perdus ; request_status_log.changed_by n'est pas touchée).

Revision ID: 0022_auteur_des_journaux
Revises: 0021_motifs_reouverture
Create Date: 2026-11-20
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0022_auteur_des_journaux"
down_revision: Union[str, None] = "0021_motifs_reouverture"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

_FK = "intervention_status_log_changed_by_fkey"
_AUTEUR = "NULLIF(current_setting('app.user_id', true), '')::uuid"

_INIT_NEW = f"""
CREATE OR REPLACE FUNCTION public.fn_init_request_status_log() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM set_config('app.skip_request_status_log', 'true', true);

    INSERT INTO public.request_status_log (request_id, status_from, status_to, changed_by, notes)
    VALUES (NEW.id, NULL, 'nouvelle', {_AUTEUR}, 'Création demande');

    PERFORM set_config('app.skip_request_status_log', 'false', true);
    RETURN NEW;
END;
$$
"""

_INIT_OLD = """
CREATE OR REPLACE FUNCTION public.fn_init_request_status_log() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM set_config('app.skip_request_status_log', 'true', true);

    INSERT INTO public.request_status_log (request_id, status_from, status_to, notes)
    VALUES (NEW.id, NULL, 'nouvelle', 'Création demande');

    PERFORM set_config('app.skip_request_status_log', 'false', true);
    RETURN NEW;
END;
$$
"""

_REQUEST_LOG_HEAD = """
CREATE OR REPLACE FUNCTION public.fn_log_request_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF current_setting('app.skip_request_status_log', true) = 'true' THEN
        RETURN NEW;
    END IF;

    IF NEW.statut IS DISTINCT FROM OLD.statut THEN
        -- Vérifie que le statut actuel correspond à la dernière entrée du log
        IF OLD.statut IS DISTINCT FROM (
            SELECT status_to FROM public.request_status_log
            WHERE request_id = NEW.id
            ORDER BY date DESC
            LIMIT 1
        ) THEN
            RAISE EXCEPTION
                'Incohérence statut : statut actuel "%" ne correspond pas à la dernière entrée du log',
                OLD.statut;
        END IF;

"""
_REQUEST_LOG_TAIL = """
    END IF;

    RETURN NEW;
END;
$$
"""
_REQUEST_LOG_NEW = (
    _REQUEST_LOG_HEAD
    + f"""        INSERT INTO public.request_status_log (request_id, status_from, status_to, changed_by)
        VALUES (NEW.id, OLD.statut, NEW.statut, {_AUTEUR});"""
    + _REQUEST_LOG_TAIL
)
_REQUEST_LOG_OLD = (
    _REQUEST_LOG_HEAD
    + """        INSERT INTO public.request_status_log (request_id, status_from, status_to)
        VALUES (NEW.id, OLD.statut, NEW.statut);"""
    + _REQUEST_LOG_TAIL
)

_SYNC_HEAD = """
CREATE OR REPLACE FUNCTION public.fn_sync_status_log_to_intervention() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        DECLARE
            v_status_code TEXT;
            v_occurrence_id UUID;
            v_request_id UUID;
            v_request_statut TEXT;
            v_skip_before TEXT;
        BEGIN
            -- 1. Mettre à jour intervention.status_actual avec le nouveau statut
            UPDATE public.intervention
            SET status_actual = NEW.status_to
            WHERE id = NEW.intervention_id;

            -- 2. Résoudre le code du statut cible
            SELECT code INTO v_status_code
            FROM public.intervention_status_ref
            WHERE id = NEW.status_to;

            -- 3. Si fermeture : propager sur l'occurrence préventive + la demande
            IF v_status_code = 'ferme' THEN

                -- Chercher l'occurrence liée à cette intervention
                SELECT id INTO v_occurrence_id
                FROM public.preventive_occurrence
                WHERE intervention_id = NEW.intervention_id
                LIMIT 1;

                IF v_occurrence_id IS NOT NULL THEN
                    UPDATE public.preventive_occurrence
                    SET status = 'completed'
                    WHERE id = v_occurrence_id;
                END IF;

                -- Clôturer la demande liée si elle est encore 'acceptee'
                SELECT id, statut INTO v_request_id, v_request_statut
                FROM public.intervention_request
                WHERE intervention_id = NEW.intervention_id
                  AND statut = 'acceptee'
                LIMIT 1;

                IF v_request_id IS NOT NULL THEN
"""
_SYNC_TAIL = """
            END IF;

            RETURN NEW;
        END;
        $$
"""
_SYNC_NEW = (
    _SYNC_HEAD
    + f"""                    -- La ligne de journal est écrite ci-dessous : le trigger de journal se
                    -- tait le temps de l'UPDATE (sinon doublon), puis retrouve son état.
                    v_skip_before := COALESCE(
                        NULLIF(current_setting('app.skip_request_status_log', true), ''), 'false');
                    PERFORM set_config('app.skip_request_status_log', 'true', true);

                    UPDATE public.intervention_request
                    SET statut = 'cloturee'
                    WHERE id = v_request_id;

                    PERFORM set_config('app.skip_request_status_log', v_skip_before, true);

                    INSERT INTO public.request_status_log
                        (request_id, status_from, status_to, changed_by, notes)
                    VALUES (
                        v_request_id,
                        v_request_statut,
                        'cloturee',
                        {_AUTEUR},
                        'Clôture automatique suite à la fermeture de l''intervention (via log de statut)'
                    );
                END IF;
"""
    + _SYNC_TAIL
)
_SYNC_OLD = (
    # Corps d'origine : sans la variable v_skip_before, propre à la nouvelle version.
    _SYNC_HEAD.replace("            v_skip_before TEXT;\n", "")
    + """                    UPDATE public.intervention_request
                    SET statut = 'cloturee'
                    WHERE id = v_request_id;

                    INSERT INTO public.request_status_log
                        (request_id, status_from, status_to, changed_by, notes)
                    VALUES (
                        v_request_id,
                        v_request_statut,
                        'cloturee',
                        NULL,
                        'Clôture automatique suite à la fermeture de l''intervention (via log de statut)'
                    );
                END IF;
"""
    + _SYNC_TAIL
)

_INTERVENTION_LOG_HEAD = """
CREATE OR REPLACE FUNCTION public.trg_log_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_log_id UUID := uuid_generate_v4();
BEGIN
    -- Ignore les créations (OLD.status_actual IS NULL)
    IF OLD.status_actual IS NOT NULL AND NEW.status_actual IS DISTINCT FROM OLD.status_actual THEN
"""
_INTERVENTION_LOG_TAIL = """
    END IF;

    RETURN NEW;
END;
$$
"""
_INTERVENTION_LOG_NEW = (
    _INTERVENTION_LOG_HEAD
    + f"""        INSERT INTO public.intervention_status_log
            (id, intervention_id, status_from, status_to, date, technician_id, changed_by, notes)
        VALUES (new_log_id, NEW.id, OLD.status_actual, NEW.status_actual, NOW(),
                NEW.updated_by, {_AUTEUR}, 'Changement statut automatique');"""
    + _INTERVENTION_LOG_TAIL
)
_INTERVENTION_LOG_OLD = (
    _INTERVENTION_LOG_HEAD
    + """        INSERT INTO public.intervention_status_log
            (id, intervention_id, status_from, status_to, date, technician_id, notes)
        VALUES (new_log_id, NEW.id, OLD.status_actual, NEW.status_actual, NOW(),
                NEW.updated_by, 'Changement statut automatique');"""
    + _INTERVENTION_LOG_TAIL
)

_INTERVENTION_INIT_NEW = f"""
CREATE OR REPLACE FUNCTION public.trg_init_status_log() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

DECLARE

    new_log_id UUID := uuid_generate_v4();

BEGIN

    -- Initialise statut à "ouvert"

    UPDATE public.intervention

    SET status_actual = 'ouvert'

    WHERE id = NEW.id;



    -- Crée log initial

    INSERT INTO public.intervention_status_log (

        id,

        intervention_id,

        status_from,

        status_to,

        date,

        technician_id,

        changed_by,

        notes

    )

    VALUES (

        new_log_id,

        NEW.id,

        NULL, -- Pas de statut précédent

        'ouvert',

        NOW(),

        NULL,

        {_AUTEUR},

        'Création intervention'

    );



    RETURN NEW;

END;

$$
"""

# Corps d'origine de schema.sql, repris tel quel (lignes vides comprises) pour que le
# retour arrière restitue exactement la fonction d'avant.
_INTERVENTION_INIT_OLD = """
CREATE OR REPLACE FUNCTION public.trg_init_status_log() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

DECLARE

    new_log_id UUID := uuid_generate_v4();

BEGIN

    -- Initialise statut à "ouvert"

    UPDATE public.intervention

    SET status_actual = 'ouvert'

    WHERE id = NEW.id;



    -- Crée log initial

    INSERT INTO public.intervention_status_log (

        id,

        intervention_id,

        status_from,

        status_to,

        date,

        technician_id,

        notes

    )

    VALUES (

        new_log_id,

        NEW.id,

        NULL, -- Pas de statut précédent

        'ouvert',

        NOW(),

        NULL,

        'Création intervention'

    );



    RETURN NEW;

END;

$$
"""

_ADD_FK = f"""
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '{_FK}') THEN
        ALTER TABLE public.intervention_status_log
            ADD CONSTRAINT {_FK} FOREIGN KEY (changed_by)
            REFERENCES public.tunnel_user(id) ON DELETE SET NULL;
    END IF;
END
$$
"""


def upgrade_statements() -> list[str]:
    """Instructions de upgrade, exposées pour que les tests les rejouent sur une base."""
    return [
        "ALTER TABLE public.intervention_status_log ADD COLUMN IF NOT EXISTS changed_by uuid",
        _ADD_FK,
        _INIT_NEW,
        _REQUEST_LOG_NEW,
        _SYNC_NEW,
        _INTERVENTION_LOG_NEW,
        _INTERVENTION_INIT_NEW,
    ]


def downgrade_statements() -> list[str]:
    # Les fonctions d'origine d'abord : elles n'écrivent plus la colonne retirée ensuite.
    return [
        _INIT_OLD,
        _REQUEST_LOG_OLD,
        _SYNC_OLD,
        _INTERVENTION_LOG_OLD,
        _INTERVENTION_INIT_OLD,
        f"ALTER TABLE public.intervention_status_log DROP CONSTRAINT IF EXISTS {_FK}",
        "ALTER TABLE public.intervention_status_log DROP COLUMN IF EXISTS changed_by",
    ]


def upgrade() -> None:
    for statement in upgrade_statements():
        op.execute(statement)


def downgrade() -> None:
    for statement in downgrade_statements():
        op.execute(statement)
