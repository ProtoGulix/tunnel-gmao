-- Table: public.purchase_request

-- DROP TABLE IF EXISTS public.purchase_request;

CREATE TABLE IF NOT EXISTS public.purchase_request
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    status character varying(50) COLLATE pg_catalog."default" NOT NULL DEFAULT 'open'::character varying,
    stock_item_id uuid,
    item_label text COLLATE pg_catalog."default" NOT NULL,
    quantity integer NOT NULL,
    unit character varying(50) COLLATE pg_catalog."default",
    requested_by text COLLATE pg_catalog."default",
    urgency character varying(20) COLLATE pg_catalog."default" DEFAULT 'normal'::character varying,
    reason text COLLATE pg_catalog."default",
    notes text COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    workshop character varying(255) COLLATE pg_catalog."default",
    intervention_id uuid,
    CONSTRAINT purchase_request_pkey PRIMARY KEY (id),
    CONSTRAINT purchase_request_intervention_id_foreign FOREIGN KEY (intervention_id)
        REFERENCES public.intervention (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT purchase_request_stock_item_id_fkey FOREIGN KEY (stock_item_id)
        REFERENCES public.stock_item (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT purchase_request_quantity_check CHECK (quantity > 0)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.purchase_request
    OWNER to directus;
-- Index: idx_purchase_request_created

-- DROP INDEX IF EXISTS public.idx_purchase_request_created;

CREATE INDEX IF NOT EXISTS idx_purchase_request_created
    ON public.purchase_request USING btree
    (created_at DESC NULLS FIRST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;
-- Index: idx_purchase_request_status

-- DROP INDEX IF EXISTS public.idx_purchase_request_status;

CREATE INDEX IF NOT EXISTS idx_purchase_request_status
    ON public.purchase_request USING btree
    (status COLLATE pg_catalog."default" ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;
-- Index: idx_purchase_request_stock_item

-- DROP INDEX IF EXISTS public.idx_purchase_request_stock_item;

CREATE INDEX IF NOT EXISTS idx_purchase_request_stock_item
    ON public.purchase_request USING btree
    (stock_item_id ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;