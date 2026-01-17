-- Migration: Configurer CASCADE DELETE sur supplier_order_line_purchase_request
-- 
-- Problème résolu:
-- Erreur 500 lors de la suppression d'une ligne de panier:
-- "null value in column supplier_order_line_id violates not-null constraint"
--
-- Solution:
-- Ajouter ON DELETE CASCADE sur la contrainte de clé étrangère pour que
-- les entrées de la table de jonction soient automatiquement supprimées
-- quand la ligne parente est supprimée.
--
-- Date: 2026-01-17
-- Impact: Permet la suppression de lignes de panier sans erreur

BEGIN;

-- 1. Vérifier l'état actuel de la contrainte
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'supplier_order_line_purchase_request'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'supplier_order_line_id';

-- 2. Supprimer l'ancienne contrainte si elle existe
ALTER TABLE supplier_order_line_purchase_request
  DROP CONSTRAINT IF EXISTS supplier_order_line_purchase_request_supplier_order_line_id_fkey;

-- 3. Ajouter la nouvelle contrainte avec CASCADE DELETE
ALTER TABLE supplier_order_line_purchase_request
  ADD CONSTRAINT supplier_order_line_purchase_request_supplier_order_line_id_fkey
    FOREIGN KEY (supplier_order_line_id)
    REFERENCES supplier_order_line(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- 4. Vérifier que la contrainte a bien été créée
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
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
  AND kcu.column_name = 'supplier_order_line_id';

-- Résultat attendu: delete_rule = 'CASCADE'

COMMIT;

-- Notes:
-- - Cette migration est idempotente (peut être exécutée plusieurs fois sans problème)
-- - Les données existantes ne sont pas affectées
-- - Après cette migration, la suppression d'une supplier_order_line supprimera
--   automatiquement les entrées correspondantes dans supplier_order_line_purchase_request
-- - Les purchase_requests elles-mêmes ne sont pas supprimées (comportement voulu)
