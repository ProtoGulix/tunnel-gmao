-- ============================================================================
-- supplier_order_line_consultation.sql - Ajout des champs de consultation fournisseur
-- ============================================================================
-- Extension de supplier_order_line pour supporter la consultation/devis fournisseurs
--
-- CONTEXTE MÉTIER :
-- - Les demandes d'achat sont dispatchées dans les paniers OPEN de tous les fournisseurs possibles
-- - Pour chaque référence, on collecte les devis de tous les fournisseurs
-- - Une seule option fournisseur est sélectionnée par référence (is_selected = true)
-- - La commande ne verrouille que les lignes sélectionnées
--
-- NOUVEAUX CHAMPS :
-- - quote_received (boolean) : indique si le fournisseur a répondu à la demande de devis
-- - is_selected (boolean) : indique que ce fournisseur est choisi pour cette référence
-- - quote_price (numeric) : prix du devis fourni
-- - lead_time_days (integer) : délai de livraison en jours
-- - manufacturer (text) : nom du fabricant proposé par le fournisseur
-- - manufacturer_ref (text) : référence fabricant proposée par le fournisseur
--
-- @see supplier_order_line.sql (table parente)
-- @see fn_dispatch_purchase_requests.sql
-- ============================================================================

-- Ajouter les colonnes si elles n'existent pas
ALTER TABLE IF EXISTS public.supplier_order_line
    ADD COLUMN IF NOT EXISTS quote_received BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_selected BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS quote_price NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS lead_time_days INTEGER,
    ADD COLUMN IF NOT EXISTS manufacturer TEXT,
    ADD COLUMN IF NOT EXISTS manufacturer_ref TEXT;

-- Optionnels pour traçabilité
ALTER TABLE IF EXISTS public.supplier_order_line
    ADD COLUMN IF NOT EXISTS quote_received_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rejected_reason TEXT;

-- Commentaires métier
COMMENT ON COLUMN public.supplier_order_line.quote_received 
  IS 'Indique si le devis fournisseur a été reçu (true = réponse reçue, false = en attente)';

COMMENT ON COLUMN public.supplier_order_line.is_selected 
  IS 'Indique que ce fournisseur est sélectionné pour cette référence. Une seule ligne par référence/commande peut avoir is_selected=true.';

COMMENT ON COLUMN public.supplier_order_line.quote_price 
  IS 'Prix unitaire du devis proposé par le fournisseur';

COMMENT ON COLUMN public.supplier_order_line.lead_time_days 
  IS 'Délai de livraison promis par le fournisseur (en jours)';

COMMENT ON COLUMN public.supplier_order_line.manufacturer 
  IS 'Nom du fabricant proposé par le fournisseur (peut différer du commandé initialement)';

COMMENT ON COLUMN public.supplier_order_line.manufacturer_ref 
  IS 'Référence fabricant proposée par le fournisseur';

COMMENT ON COLUMN public.supplier_order_line.quote_received_at 
  IS 'Date/heure de réception du devis';

COMMENT ON COLUMN public.supplier_order_line.rejected_reason 
  IS 'Raison du rejet si le fournisseur refuse de fournir ou si la ligne n''est pas sélectionnée';
