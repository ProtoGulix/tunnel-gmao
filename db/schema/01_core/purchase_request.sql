-- ============================================================================
-- purchase_request.sql - Demandes d'achat
-- ============================================================================
-- Demandes d'achat articles (approvisionnement stock)
-- Cycle: en_attente → approuvé → commandé → reçu
--
-- @see stock_item.sql
-- @see intervention.sql
-- @see purchase_status.sql (02_ref)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.purchase_request (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    stock_item_id UUID, -- FK vers stock_item
    intervention_id UUID, -- FK vers intervention (optionnel si lié)
    
    -- Quantités
    quantity_requested INTEGER NOT NULL,
    quantity_approved INTEGER,
    
    -- Justification
    reason TEXT,
    notes TEXT,
    urgent BOOLEAN DEFAULT FALSE,
    
    -- Statut
    status VARCHAR(255) DEFAULT 'en_attente',
    
    -- Acteurs
    requester_name VARCHAR(255), -- Demandeur
    approver_name VARCHAR(255), -- Approbateur
    
    -- Dates
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMPTZ
);

-- Index
CREATE INDEX IF NOT EXISTS idx_purchase_request_status ON public.purchase_request(status);
CREATE INDEX IF NOT EXISTS idx_purchase_request_stock_item ON public.purchase_request(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_request_created ON public.purchase_request(created_at DESC);

-- Commentaires
COMMENT ON TABLE public.purchase_request IS 'Demandes d''achat articles stock';
COMMENT ON COLUMN public.purchase_request.urgent IS 'Demande urgente (priorité traitement)';
