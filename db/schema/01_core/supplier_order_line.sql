-- ============================================================================
-- supplier_order_line.sql - Lignes commandes fournisseurs
-- ============================================================================
-- Détail lignes commandes (article + quantité + prix)
-- Total calculé automatiquement par trigger
--
-- @see supplier_order.sql
-- @see stock_item.sql
-- @see trigger trg_calculate_line_total
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.supplier_order_line (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    supplier_order_id UUID, -- FK vers supplier_order
    stock_item_id UUID, -- FK vers stock_item
    
    -- Quantité et prix
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2),
    total_price NUMERIC(10,2), -- Auto-calculé par trigger
    
    -- Notes
    notes TEXT,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte unicité (1 ligne par article par commande)
    CONSTRAINT uq_supplier_order_line UNIQUE (supplier_order_id, stock_item_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_supplier_order_line_order ON public.supplier_order_line(supplier_order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_order_line_stock_item ON public.supplier_order_line(stock_item_id);

-- Commentaires
COMMENT ON TABLE public.supplier_order_line IS 'Lignes commandes fournisseurs';
COMMENT ON COLUMN public.supplier_order_line.total_price IS 'Total auto-calculé (unit_price × quantity)';
