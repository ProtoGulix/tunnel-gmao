-- ============================================================================
-- intervention_action.sql - Actions réalisées durant interventions
-- ============================================================================
-- Détail des actions/tâches effectuées lors d'une intervention
-- Lien avec sous-catégories d'actions pour classification
--
-- @see intervention.sql
-- @see action_subcategory.sql (02_ref)
-- @see complexity_factor.sql (02_ref)
-- ============================================================================

-- Table: public.intervention_action

-- DROP TABLE IF EXISTS public.intervention_action;

CREATE TABLE IF NOT EXISTS public.intervention_action
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    intervention_id uuid,
    description text COLLATE pg_catalog."default",
    time_spent numeric(6,2) DEFAULT 0,
    updated_at timestamp with time zone,
    action_subcategory integer,
    created_at timestamp with time zone,
    tech uuid,
    complexity_score integer,
    complexity_anotation json,
    CONSTRAINT intervention_action_pkey PRIMARY KEY (id),
    CONSTRAINT intervention_action_action_subcategory_foreign FOREIGN KEY (action_subcategory)
        REFERENCES public.action_subcategory (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT intervention_action_intervention_id_fkey FOREIGN KEY (intervention_id)
        REFERENCES public.intervention (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT intervention_action_tech_foreign FOREIGN KEY (tech)
        REFERENCES public.directus_users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.intervention_action
    OWNER to directus;
-- Index: intervention_action_created_at_index

-- DROP INDEX IF EXISTS public.intervention_action_created_at_index;

CREATE INDEX IF NOT EXISTS intervention_action_created_at_index
    ON public.intervention_action USING btree
    (created_at ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;