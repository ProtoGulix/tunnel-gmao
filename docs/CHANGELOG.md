# Changelog
## 1.2.6 - 2026-01-09

### Export / Paniers fournisseurs

- **Affichage du fabricant** : Les informations du fabricant (nom + référence) s'affichent correctement dans les exports CSV et emails en chargeant les données depuis la référence fournisseur
- **Format d'export simplifié** : Une ligne par article avec les champs essentiels (nom, fabricant, réf fab, specs, quantité)
- **Format cohérent** : Le mail texte (mailto) et le mail HTML affichent maintenant exactement le même format (délimiteurs "-", "N/A" pour les valeurs manquantes)
- **Référence commande** : Le numéro de commande s'affiche correctement dans le mail
## 1.2.5 - 2026-01-08

### UX / Sidebar

- Clic sur la version dans la sidebar : ouvre le changelog dans un nouvel onglet.
- Lien de version plus discret (typographie allégée, hover doux) pour limiter le bruit visuel.

## 1.2.4 - 2026-01-08

### UX / Front

- Liste des interventions: toute la ligne est désormais cliquable et ouvre le détail.
- Effet de survol subtil sur les lignes (ombre + légère élévation), cohérent avec les cartes de la page publique.
- Conventions: imports d’icônes uniformisés via le module centralisé `@/lib/icons`.

### Divers

- Petits ajustements visuels et cohérence des badges/sections.

## 1.2.3 - 2026-01-08

### Front

- Formulaire de création d'intervention : champ date de création saisi par l'utilisateur, transmis au backend.
- Sélecteur de type d'intervention alimenté par la config `INTERVENTION_TYPES` (plus de valeurs en dur).

## 1.2.2 - 2026-01-08

### Improvements

- Stabilité générale et corrections mineures
- Optimisations des performances

## 1.2.1 - 2026-01-05

### Database Schema Synchronization

- **Fixed schema inconsistencies** between SQL files and actual database `gmaomvp-db-1`
- **stock_item.sql**:
  - Aligned column names: `designation` → `name`, `stock_quantity` → `quantity`
  - Added missing columns: `location`, `supplier_refs_count`
  - Fixed column types: `family_code`, `sub_family_code`, `spec` with proper constraints
  - Maintained typo `standars_spec` for backward compatibility
- **supplier_order.sql**:
  - Aligned column names: `order_date` → `ordered_at`, `actual_delivery_date` → `received_at`
  - Added missing columns: `total_amount`, `currency`
- **supplier_order_line.sql**:
  - Added missing columns: `supplier_ref_snapshot`, `quantity_received`
- **99_foreign_keys.sql**:
  - Fixed foreign key references (column names and order)
  - Removed non-existent foreign keys from action_category_meta and action_classification_probe

All schema files are now synchronized with production database.

## 1.2.0 - 2026-01-05

- DB schema update for action meta handling (migration required before deploying this version).
- Unified SupplierRefsInlinePanel in purchase/suppliers (removed duplicate in stock/, adjusted imports).
- Renamed and cleaned StockItemSearch (formerly StockItemLinkForm) with convention-compliant split components.
- Removed unused/duplicate supplier reference components to reduce dead code.

### Upgrade notes

1. Run the database migration scripts included in db/schema prior to starting the app.
2. Deploy the new front-end build after migrations.
3. Recommended checks: `npm run lint` and `npm run build`.
