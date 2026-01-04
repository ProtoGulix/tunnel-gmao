-- ============================================================================
-- stock_item_supplier.sql - Relations articles/fournisseurs
-- ============================================================================
-- Catalogues fournisseurs : quels articles disponibles chez quels fournisseurs
-- Prix, délais, quantités minimum
--
-- @see stock_item.sql
-- @see supplier.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_item_supplier (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    stock_item_id UUID, -- FK vers stock_item
    supplier_id UUID, -- FK vers supplier
    manufacturer_item_id UUID, -- FK vers manufacturer_item (référence fabricant)
    
    -- Référence fournisseur
    supplier_ref VARCHAR(255), -- Référence catalogue fournisseur
    
    -- Tarification
    unit_price NUMERIC(10,2),
    min_order_quantity INTEGER, -- Quantité minimum commande
    lead_time_days INTEGER, -- Délai livraison (jours)
    
    -- Fournisseur préféré
    is_preferred BOOLEAN DEFAULT FALSE,
    
    -- Notes
    notes TEXT,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte unicité (1 ligne par article/fournisseur)
    CONSTRAINT uq_stock_item_supplier UNIQUE (stock_item_id, supplier_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_stock_item_supplier_preferred 
    ON public.stock_item_supplier(stock_item_id, is_preferred) 
    WHERE is_preferred = TRUE;

-- Commentaires
COMMENT ON TABLE public.stock_item_supplier IS 'Catalogues fournisseurs (articles disponibles)';
COMMENT ON COLUMN public.stock_item_supplier.is_preferred IS 'Fournisseur préféré pour cet article';
COMMENT ON COLUMN public.stock_item_supplier.lead_time_days IS 'Délai livraison en jours';
