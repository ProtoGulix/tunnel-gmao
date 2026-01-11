-- ============================================================================
-- intervention_action_purchase_request.sql - Liaison actions / demandes d'achat
-- ============================================================================
-- Table M2M reliant les actions d'intervention aux demandes d'achat liées
-- ============================================================================

-- Table: public.intervention_action_purchase_request

-- DROP TABLE IF EXISTS public.intervention_action_purchase_request;

CREATE TABLE IF NOT EXISTS public.intervention_action_purchase_request
(
    id integer NOT NULL DEFAULT nextval('intervention_action_purchase_request_id_seq'::regclass),
    intervention_action_id uuid,
    purchase_request_id uuid,
    CONSTRAINT intervention_action_purchase_request_pkey PRIMARY KEY (id),
    CONSTRAINT intervention_action_purchase_request_inter__58223902_foreign FOREIGN KEY (intervention_action_id)
        REFERENCES public.intervention_action (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT intervention_action_purchase_request_purch__1ea27a8f_foreign FOREIGN KEY (purchase_request_id)
        REFERENCES public.purchase_request (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.intervention_action_purchase_request
    OWNER to directus;