-- ============================================================================
-- stock_item.sql - Articles en stock
-- ============================================================================
-- Pièces détachées, consommables, outillage
-- Référence auto-générée par trigger basée sur famille/spéc/dimension
--
-- @see stock_family.sql (02_ref)
-- @see stock_sub_family.sql
-- @see manufacturer_item.sql
-- @see stock_item_standard_spec.sql
-- @see trigger trg_generate_stock_item_ref
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_item (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Référence auto-générée (FAM-SFAM-SPEC-DIM)
    ref VARCHAR(255) UNIQUE,
    
    -- Désignation
    designation TEXT NOT NULL,
    
    -- Classification
    family_code VARCHAR(255), -- FK vers stock_family
    sub_family_code VARCHAR(255), -- FK vers stock_sub_family
    spec TEXT, -- Spécification (ex: M8, Ø20mm)
    dimension VARCHAR(255), -- Dimension physique
    
    -- Unité
    unit VARCHAR(255), -- ex: pièce, mètre, litre, kg
    
    -- Stock
    stock_quantity INTEGER DEFAULT 0,
    stock_min INTEGER, -- Seuil alerte stock bas
    
    -- Relations
    manufacturer_item_id UUID, -- FK vers manufacturer_item
    standards_spec UUID, -- FK vers stock_item_standard_spec
    
    -- Contrainte CHECK stock >= 0
    CONSTRAINT check_stock_positive CHECK (stock_quantity >= 0)
);

-- Commentaires
COMMENT ON TABLE public.stock_item IS 'Articles en stock (pièces, consommables, outillage)';
COMMENT ON COLUMN public.stock_item.ref IS 'Référence auto-générée (trigger)';
COMMENT ON COLUMN public.stock_item.stock_min IS 'Seuil déclenchement alerte stock bas';
