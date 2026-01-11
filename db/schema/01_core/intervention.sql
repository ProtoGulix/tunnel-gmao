-- ============================================================================
-- intervention.sql - Table principale des interventions
-- ============================================================================
-- Interventions de maintenance sur machines/équipements
-- Code généré automatiquement par trigger : MACHINE-TYPE-YYYYMMDD-INITIALES
--
-- @see machine.sql
-- @see intervention_status_ref.sql
-- @see trigger trg_interv_code
-- @see trigger trg_init_status_log
-- @see trigger trg_log_status_change
-- ============================================================================

-- Table: public.intervention

-- DROP TABLE IF EXISTS public.intervention;

CREATE TABLE IF NOT EXISTS public.intervention
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    code character varying(64) COLLATE pg_catalog."default",
    title character varying(200) COLLATE pg_catalog."default" NOT NULL,
    machine_id uuid,
    type_inter character varying(10) COLLATE pg_catalog."default" NOT NULL,
    priority character varying(20) COLLATE pg_catalog."default" DEFAULT 'normal'::character varying,
    reported_by character varying(200) COLLATE pg_catalog."default",
    tech_initials character varying(255) COLLATE pg_catalog."default",
    status_actual character varying(255) COLLATE pg_catalog."default",
    updated_by uuid,
    printed_fiche boolean DEFAULT false,
    reported_date date,
    CONSTRAINT intervention_pkey PRIMARY KEY (id),
    CONSTRAINT intervention_code_key UNIQUE (code),
    CONSTRAINT intervention_machine_id_fkey FOREIGN KEY (machine_id)
        REFERENCES public.machine (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT intervention_status_actual_foreign FOREIGN KEY (status_actual)
        REFERENCES public.intervention_status_ref (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT intervention_updated_by_foreign FOREIGN KEY (updated_by)
        REFERENCES public.directus_users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.intervention
    OWNER to directus;
-- Index: intervention_machine_id_index

-- DROP INDEX IF EXISTS public.intervention_machine_id_index;

CREATE INDEX IF NOT EXISTS intervention_machine_id_index
    ON public.intervention USING btree
    (machine_id ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;