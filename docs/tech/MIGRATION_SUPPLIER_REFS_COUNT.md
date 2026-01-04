# Migration - Optimisation du compte de références fournisseurs

## Problème

Le calcul du nombre de références fournisseurs par article se faisait côté frontend en itérant sur tous les items et leurs références. Cela consommait beaucoup de ressources, particulièrement avec un grand nombre d'articles.

## Solution

Ajouter un champ `supplier_refs_count` dans la table `stock_item` qui est maintenu automatiquement par des triggers PostgreSQL.

## Avantages

- ✅ **Performance** : Calcul une seule fois en base de données au lieu de O(n) itérations frontend
- ✅ **Scalabilité** : Fonctionne même avec des milliers d'articles
- ✅ **Cohérence** : Toujours à jour grâce aux triggers
- ✅ **Simplicité** : Directus récupère le champ comme n'importe quel autre
- ✅ **Index** : Permet de filtrer/trier rapidement par nombre de références

## Installation

### 1. Exécuter le script SQL

```bash
psql -d gmao -U votre_user -f db/schema/05_triggers/trg_update_supplier_refs_count.sql
```

Le script fait automatiquement :

1. Ajoute la colonne `supplier_refs_count` à `stock_item`
2. Crée l'index pour les performances
3. Crée la fonction trigger
4. Attache les triggers sur INSERT/UPDATE/DELETE
5. Initialise les valeurs existantes

### 2. Vérifier la migration

```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'stock_item'
AND column_name = 'supplier_refs_count';

-- Vérifier quelques valeurs
SELECT
    si.ref,
    si.supplier_refs_count,
    COUNT(sis.id) as actual_count
FROM stock_item si
LEFT JOIN stock_item_supplier sis ON sis.stock_item_id = si.id
GROUP BY si.id, si.ref, si.supplier_refs_count
LIMIT 10;
```

### 3. Redémarrer l'application

Le frontend utilise maintenant automatiquement le champ `supplier_refs_count` de la base de données.

## Comportement des triggers

### INSERT sur stock_item_supplier

```sql
INSERT INTO stock_item_supplier (stock_item_id, supplier_id, supplier_ref, is_preferred)
VALUES ('uuid-article', 'uuid-fournisseur', 'REF-123', false);
-- → Incrémente automatiquement supplier_refs_count de l'article
```

### DELETE sur stock_item_supplier

```sql
DELETE FROM stock_item_supplier WHERE id = 'uuid-ref';
-- → Décrémente automatiquement supplier_refs_count de l'article
```

### UPDATE qui change stock_item_id

```sql
UPDATE stock_item_supplier
SET stock_item_id = 'nouveau-uuid-article'
WHERE id = 'uuid-ref';
-- → Décrémente l'ancien article ET incrémente le nouveau
```

## Tests

### Test 1 : Vérifier le trigger INSERT

```sql
-- État initial
SELECT ref, supplier_refs_count FROM stock_item WHERE ref = 'TEST-001';
-- Résultat: supplier_refs_count = 2

-- Ajouter une référence
INSERT INTO stock_item_supplier (stock_item_id, supplier_id, supplier_ref)
SELECT id, (SELECT id FROM supplier LIMIT 1), 'NEW-REF'
FROM stock_item WHERE ref = 'TEST-001';

-- Vérifier
SELECT ref, supplier_refs_count FROM stock_item WHERE ref = 'TEST-001';
-- Résultat attendu: supplier_refs_count = 3
```

### Test 2 : Vérifier le trigger DELETE

```sql
-- Supprimer une référence
DELETE FROM stock_item_supplier
WHERE stock_item_id = (SELECT id FROM stock_item WHERE ref = 'TEST-001')
LIMIT 1;

-- Vérifier
SELECT ref, supplier_refs_count FROM stock_item WHERE ref = 'TEST-001';
-- Résultat attendu: supplier_refs_count = 2
```

## Rollback (si nécessaire)

```sql
-- Supprimer les triggers
DROP TRIGGER IF EXISTS trg_stock_item_supplier_refs_count_insert ON public.stock_item_supplier;
DROP TRIGGER IF EXISTS trg_stock_item_supplier_refs_count_update ON public.stock_item_supplier;
DROP TRIGGER IF EXISTS trg_stock_item_supplier_refs_count_delete ON public.stock_item_supplier;

-- Supprimer la fonction
DROP FUNCTION IF EXISTS public.fn_update_supplier_refs_count();

-- Supprimer la colonne (ATTENTION : perte de données)
ALTER TABLE public.stock_item DROP COLUMN IF EXISTS supplier_refs_count;

-- Supprimer l'index
DROP INDEX IF EXISTS idx_stock_item_supplier_refs_count;
```

Ensuite, restaurer l'ancien code dans `StockManagement.jsx` qui calculait les comptes à partir de `supplierRefsByItem`.

## Performance attendue

### Avant (calcul frontend)

- Temps de calcul : O(n × m) où n = nombre d'items, m = moyenne de refs par item
- Exemple : 1000 items × 3 refs = 3000 itérations à chaque render
- CPU : ~10-50ms selon la machine
- Re-calcul à chaque changement de `supplierRefsByItem`

### Après (champ base de données)

- Temps de calcul : O(n) simple map sur les items
- Exemple : 1000 items = 1000 lectures de propriété
- CPU : <1ms
- Pas de re-calcul, déjà fait en base

**Gain estimé : 10-50x plus rapide** 🚀

## Maintenance

Le système est maintenant **zero-maintenance** côté application :

- Les triggers PostgreSQL maintiennent automatiquement les comptes
- Aucune synchronisation manuelle nécessaire
- Fonctionne avec tous les outils (Directus Admin, SQL direct, API)
- Robuste même en cas de transactions concurrentes

## Notes techniques

### Pourquoi PostgreSQL et pas Directus ?

- Directus ne supporte pas les champs calculés persistants avec triggers
- La solution trigger est plus performante et fiable
- Compatible avec tous les clients (pas seulement l'API Directus)

### Pourquoi pas un champ calculé volatile ?

- Un champ calculé (computed field) serait recalculé à chaque requête
- Un champ stocké avec trigger se calcule une seule fois à la modification
- Beaucoup plus performant quand on lit souvent, modifie rarement

### Index

L'index sur `supplier_refs_count` permet de :

- Filtrer rapidement les articles avec/sans références
- Trier efficacement par nombre de références
- Requêtes analytiques (COUNT, GROUP BY, etc.)
