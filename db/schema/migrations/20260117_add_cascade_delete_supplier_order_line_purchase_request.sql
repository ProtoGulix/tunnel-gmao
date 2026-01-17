-- ============================================================================
-- Migration 20260117 : Ajout CASCADE DELETE sur supplier_order_line_purchase_request
-- ============================================================================
-- Résout l'erreur HTTP 500 lors de la suppression de lignes de panier :
-- "null value in column supplier_order_line_id violates not-null constraint"
--
-- Impact :
-- - Suppression automatique des entrées de jonction lors de la suppression
--   d'une supplier_order_line
-- - Les purchase_requests elles-mêmes ne sont pas supprimées (comportement voulu)
-- - Migration idempotente (peut être exécutée plusieurs fois)
--
-- Date : 2026-01-17
-- Auteur : Équipe développement GMAO
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : Vérification de l'état actuel
-- ============================================================================
DO $$
DECLARE
    current_delete_rule TEXT;
BEGIN
    SELECT rc.delete_rule INTO current_delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_name = 'supplier_order_line_purchase_request'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name LIKE '%supplier_order_line_id%';
    
    RAISE NOTICE 'État actuel de la contrainte FK : delete_rule = %', COALESCE(current_delete_rule, 'NON TROUVÉE');
END $$;

-- ============================================================================
-- ÉTAPE 2 : Suppression des anciennes contraintes
-- ============================================================================
ALTER TABLE public.supplier_order_line_purchase_request
    DROP CONSTRAINT IF EXISTS supplier_order_line_purchase_reques_supplier_order_line_id_fkey;

ALTER TABLE public.supplier_order_line_purchase_request
    DROP CONSTRAINT IF EXISTS supplier_order_line_purchase_request_purchase_request_id_fkey;

RAISE NOTICE 'Anciennes contraintes supprimées avec succès';

-- ============================================================================
-- ÉTAPE 3 : Ajout des nouvelles contraintes avec CASCADE DELETE
-- ============================================================================

-- Contrainte FK vers supplier_order_line avec CASCADE DELETE
ALTER TABLE public.supplier_order_line_purchase_request
    ADD CONSTRAINT supplier_order_line_purchase_reques_supplier_order_line_id_fkey
    FOREIGN KEY (supplier_order_line_id)
    REFERENCES public.supplier_order_line(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION;

RAISE NOTICE 'Contrainte FK supplier_order_line_id ajoutée avec ON DELETE CASCADE';

-- Contrainte FK vers purchase_request avec CASCADE DELETE
ALTER TABLE public.supplier_order_line_purchase_request
    ADD CONSTRAINT supplier_order_line_purchase_request_purchase_request_id_fkey
    FOREIGN KEY (purchase_request_id)
    REFERENCES public.purchase_request(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION;

RAISE NOTICE 'Contrainte FK purchase_request_id ajoutée avec ON DELETE CASCADE';

-- ============================================================================
-- ÉTAPE 4 : Vérification finale
-- ============================================================================
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'VÉRIFICATION FINALE DES CONTRAINTES FK';
    RAISE NOTICE '=================================================================';
    
    FOR constraint_record IN
        SELECT 
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            rc.delete_rule,
            rc.update_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
            ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'supplier_order_line_purchase_request'
          AND tc.constraint_type = 'FOREIGN KEY'
        ORDER BY kcu.column_name
    LOOP
        RAISE NOTICE 'Colonne: % → Référence: % | DELETE: % | UPDATE: %',
            constraint_record.column_name,
            constraint_record.foreign_table_name,
            constraint_record.delete_rule,
            constraint_record.update_rule;
    END LOOP;
    
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✅ Migration terminée avec succès';
    RAISE NOTICE '=================================================================';
END $$;

COMMIT;

-- ============================================================================
-- NOTES D'UTILISATION
-- ============================================================================
-- Pour appliquer cette migration :
--   docker exec -i gmaomvp-db-1 psql -U directus -d directus < 20260117_add_cascade_delete_supplier_order_line_purchase_request.sql
--
-- Ou depuis psql :
--   \i db/schema/migrations/20260117_add_cascade_delete_supplier_order_line_purchase_request.sql
--
-- Pour vérifier manuellement :
--   SELECT constraint_name, delete_rule, update_rule
--   FROM information_schema.referential_constraints
--   WHERE constraint_name LIKE '%supplier_order_line_purchase%';
-- ============================================================================
