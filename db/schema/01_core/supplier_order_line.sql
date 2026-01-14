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
    
    -- Référence fournisseur (snapshot au moment de la commande)
    supplier_ref_snapshot TEXT, -- Capture de la référence fournisseur
    
    -- Quantité et prix
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2),
    total_price NUMERIC(10,2), -- Auto-calculé par trigger
    
    -- Réception
    quantity_received INTEGER, -- Quantité effectivement reçue
    
    -- Consultation fournisseurs
    quote_received BOOLEAN DEFAULT FALSE,
    is_selected BOOLEAN DEFAULT FALSE,
    quote_price NUMERIC(10,2),
    lead_time_days INTEGER,
    manufacturer TEXT,
    manufacturer_ref TEXT,
    quote_received_at TIMESTAMPTZ,
    rejected_reason TEXT,

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
COMMENT ON COLUMN public.supplier_order_line.supplier_ref_snapshot IS 'Snapshot de la référence fournisseur au moment de la commande';
COMMENT ON COLUMN public.supplier_order_line.quantity_received IS 'Quantité effectivement reçue';
COMMENT ON COLUMN public.supplier_order_line.quote_received IS 'Indique si le devis fournisseur a été reçu (true = réponse reçue, false = en attente)';
COMMENT ON COLUMN public.supplier_order_line.is_selected IS 'Indique que ce fournisseur est sélectionné pour cette référence. Une seule ligne par référence/commande peut avoir is_selected=true.';
COMMENT ON COLUMN public.supplier_order_line.quote_price IS 'Prix unitaire du devis proposé par le fournisseur';
COMMENT ON COLUMN public.supplier_order_line.lead_time_days IS 'Délai de livraison promis par le fournisseur (en jours)';
COMMENT ON COLUMN public.supplier_order_line.manufacturer IS 'Nom du fabricant proposé par le fournisseur (peut différer du commandé initialement)';
COMMENT ON COLUMN public.supplier_order_line.manufacturer_ref IS 'Référence fabricant proposée par le fournisseur';
COMMENT ON COLUMN public.supplier_order_line.quote_received_at IS 'Date/heure de réception du devis';
COMMENT ON COLUMN public.supplier_order_line.rejected_reason IS 'Raison du rejet si le fournisseur refuse de fournir ou si la ligne n''est pas sélectionnée';
