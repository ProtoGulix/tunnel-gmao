-- ============================================================================
-- Migration 20260120 : Trigger mise à jour purchase_request quand commande reçue
-- ============================================================================
-- Quand supplier_order passe en "reçu" (received/closed), mettre à jour :
-- 1. Les supplier_order_line associées (quantity_received = quantity)
-- 2. Les purchase_request liées en "received"
-- ============================================================================

BEGIN;

-- ============================================================================
-- FONCTION 1 : Mettre à jour purchase_requests quand order reçue
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_update_purchase_on_order_received()
RETURNS TRIGGER AS $$
DECLARE
    v_line_record RECORD;
    v_purchase_record RECORD;
BEGIN
    -- Vérifier que le changement de statut est vers "received" ou "closed"
    IF NEW.status IN ('received', 'closed') AND OLD.status != NEW.status THEN
        
        RAISE NOTICE 'Trigger: Commande % passe en %', NEW.order_number, NEW.status;
        
        -- Boucle sur toutes les lignes de cette commande
        FOR v_line_record IN 
            SELECT id, quantity FROM public.supplier_order_line 
            WHERE supplier_order_id = NEW.id
        LOOP
            -- Mettre à jour quantity_received = quantity
            UPDATE public.supplier_order_line
            SET quantity_received = quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_line_record.id;
            
            RAISE NOTICE '  → Ligne % : quantity_received mis à jour', v_line_record.id;
            
            -- Récupérer toutes les purchase_requests liées à cette ligne
            FOR v_purchase_record IN
                SELECT DISTINCT pr.id, pr.status
                FROM public.purchase_request pr
                JOIN public.supplier_order_line_purchase_request solpr 
                    ON solpr.purchase_request_id = pr.id
                WHERE solpr.supplier_order_line_id = v_line_record.id
                  AND pr.status != 'received'
            LOOP
                -- Mettre à jour purchase_request en "received"
                UPDATE public.purchase_request
                SET status = 'received',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = v_purchase_record.id;
                
                RAISE NOTICE '    → Purchase Request % : statut = received', v_purchase_record.id;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Trigger: Mise à jour terminée pour commande %', NEW.order_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER : Exécution après UPDATE de supplier_order
-- ============================================================================
DROP TRIGGER IF EXISTS trg_update_purchase_on_order_received ON public.supplier_order;

CREATE TRIGGER trg_update_purchase_on_order_received
AFTER UPDATE OF status ON public.supplier_order
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_purchase_on_order_received();

RAISE NOTICE '✅ Trigger trg_update_purchase_on_order_received créé avec succès';

COMMIT;

-- ============================================================================
-- NOTES D'UTILISATION
-- ============================================================================
-- Pour appliquer cette migration :
--   docker exec -i gmaomvp-db-1 psql -U directus -d directus < 20260120_add_trigger_update_purchase_on_order_received.sql
--
-- Ou depuis psql :
--   \i db/schema/migrations/20260120_add_trigger_update_purchase_on_order_received.sql
--
-- Pour tester le trigger (manuel) :
--   UPDATE supplier_order SET status = 'received' WHERE order_number = 'CMD-20260120-0001';
--
-- Pour vérifier les logs du trigger :
--   Regarder les RAISE NOTICE dans les logs PostgreSQL
--
-- Pour désactiver temporairement :
--   ALTER TRIGGER trg_update_purchase_on_order_received ON supplier_order DISABLE;
--
-- Pour le réactiver :
--   ALTER TRIGGER trg_update_purchase_on_order_received ON supplier_order ENABLE;
-- ============================================================================
