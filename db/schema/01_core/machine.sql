-- ============================================================================
-- machine.sql - Équipements et machines
-- ============================================================================
-- Inventaire équipements soumis à maintenance
-- Support hiérarchie (equipement_mere pour sous-équipements)
--
-- @see location.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.machine (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Code unique (ex: CONV-01, POMP-02)
    code VARCHAR(255) NOT NULL UNIQUE,
    
    -- Informations équipement
    nom TEXT,
    type_equipement VARCHAR(255), -- Type: Convoyeur, Pompe, Robot, etc.
    fabricant VARCHAR(255),
    numero_serie VARCHAR(255),
    date_mise_service DATE,
    
    -- Hiérarchie (équipement parent)
    equipement_mere UUID, -- FK auto-référence
    
    -- Localisation
    localisation UUID, -- FK vers location
    
    -- Notes
    notes TEXT
);

-- Index
CREATE INDEX IF NOT EXISTS machine_code_index ON public.machine(code);
CREATE INDEX IF NOT EXISTS machine_equipement_mere_index ON public.machine(equipement_mere);

-- Commentaires
COMMENT ON TABLE public.machine IS 'Équipements et machines soumis à maintenance';
COMMENT ON COLUMN public.machine.code IS 'Code unique équipement (utilisé dans code intervention)';
COMMENT ON COLUMN public.machine.equipement_mere IS 'Équipement parent (pour hiérarchie)';
