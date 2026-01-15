-- Migration: Convertir manufacturer_item_id en relation Many-to-One
-- Cette migration ne modifie PAS les données existantes, seulement la metadata Directus

-- 1. Ajouter la relation dans directus_relations pour que Directus comprenne que c'est une relation
INSERT INTO directus_relations (
  many_collection,
  many_field,
  one_collection,
  one_field,
  junction_field
) VALUES (
  'stock_item_supplier',
  'manufacturer_item_id',
  'manufacturer_item',
  NULL,
  NULL
)
ON CONFLICT DO NOTHING; -- Au cas où la relation existe déjà

-- 2. Vérifier que le champ existe et a le bon type (devrait déjà être uuid)
-- Pas besoin de modifier la colonne, les UUIDs sont déjà corrects

-- 3. Ajouter une foreign key constraint si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_stock_item_supplier_manufacturer_item'
  ) THEN
    ALTER TABLE stock_item_supplier
      ADD CONSTRAINT fk_stock_item_supplier_manufacturer_item
      FOREIGN KEY (manufacturer_item_id) 
      REFERENCES manufacturer_item(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Note: Cette migration est SAFE car:
-- - Les données existantes ne sont pas modifiées
-- - On ajoute juste la metadata Directus
-- - La foreign key est en ON DELETE SET NULL (pas de cascade)
-- - Si la relation existe déjà, on ne fait rien (ON CONFLICT DO NOTHING)
