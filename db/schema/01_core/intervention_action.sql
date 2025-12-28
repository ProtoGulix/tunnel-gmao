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

CREATE TABLE IF NOT EXISTS public.intervention_action (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    intervention_id UUID,
    action_subcategory INTEGER, -- FK vers action_subcategory
    tech UUID, -- Technicien ayant réalisé l'action
    
    -- Détails action
    description TEXT,
    time_spent NUMERIC(6,2) DEFAULT 0, -- Temps passé (heures)
    complexity_score INTEGER, -- Score de complexité calculé
    complexity_anotation JSON, -- Annotations de complexité (facteurs contributifs)
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS intervention_action_created_at_index ON public.intervention_action(created_at);

-- Commentaires
COMMENT ON TABLE public.intervention_action IS 'Actions réalisées durant interventions';
COMMENT ON COLUMN public.intervention_action.action_subcategory IS 'Sous-catégorie d''action (classification métier)';
COMMENT ON COLUMN public.intervention_action.time_spent IS 'Temps passé en heures (ex: 1.5 pour 1h30)';
COMMENT ON COLUMN public.intervention_action.complexity_score IS 'Score de complexité calculé (somme des facteurs)';
COMMENT ON COLUMN public.intervention_action.complexity_anotation IS 'Détail JSON des facteurs de complexité appliqués';
