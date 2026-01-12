# Changelog

## 1.4.2 - 2026-01-12

### Corrections

- **Fix rafraîchissement fabricants** : Ajout d'un système de versioning pour forcer le re-render des tables d'articles en stock quand la liste des fabricants est mise à jour.
- **Fix copie HTML email** : Ajout de fallbacks pour `navigator.clipboard` afin de supporter HTTP, localhost et les anciens navigateurs.

## 1.4.1 - 2026-01-12

### Corrections

- **Fix import manquant** : Ajout de l'import `actionSubcategories` dans InterventionDetail.jsx pour corriger l'erreur lors de la création d'actions.
- **Suppression validation prix** : Retrait de l'obligation de renseigner le montant total pour passer un panier fournisseur au statut "Commandé".

## 1.4.0 - 2026-01-12

### Gestion des demandes d'achat depuis les fiches action

**BREAKING**: Changement du schéma base de données - nouvelles requêtes sur la table M2M `intervention_action_purchase_request`.

#### Composants créés

- **ActionMetadataHeader** : Affichage des métadonnées d'action (catégorie, temps passé, complexité, technicien, timestamp).
- **ActionButtons** : Boutons d'action réutilisables (Editer, Dupliquer, Créer DA, Supprimer) avec badge de compte DA.
- **PurchaseRequestList** : Liste des demandes d'achat liées avec confirmation suppression inline (non-modale).

#### Fonctionnalités

- **Liste DA liée à chaque action** avec code article en badge gris au début de ligne.
- **Indicateur "À qualifier"** : icône alerte + fond amber pour DA sans article stocké associé.
- **Badges** : quantité, urgence et statut de chaque DA.
- **Suppression DA avec confirmation inline** (pattern non-modal) : icône poubelle → boutons [Confirmer]/[Annuler].
- **Création DA depuis ActionItemCard** avec liaison M2M automatique via nested PATCH.
- **Suppression DA** avec suppression automatique du lien M2M et de la DA elle-même.

#### Refactorisation

- **ActionItemCard** : Extraction métadonnées/boutons → utilisation des nouveaux composants communs; réduction complexité.
- **Optimisation chargement** : Spécifications stock chargées uniquement pour items avec DA (au lieu de tous les items).
- **Chargement parallèle** : Stocks + fournisseurs + demandes d'achat en parallèle dans InterventionDetail.

#### API Adapter

- **stock.deletePurchaseRequest()** : Nouvelle fonction pour supprimer une DA et son lien M2M.
- **Exposition purchaseRequestIds** dans mappers actions et interventions.
- **M2M creation** : Nested PATCH `intervention.action.update[].purchase_request_ids.create[]`.

#### Database

- **M2M junction table** `intervention_action_purchase_request` : nouvelles requêtes pour creation/deletion.
- **Champs M2M exposés** dans datasources actions et interventions.

## 1.3.3 - 2026-01-11

### Système de sélection unifié

- **Composant partagé `SelectionSummary`** : carte de résumé homogène (stock vs demande spéciale) avec badge, titre, méta à droite et bouton d'annulation.
- **Refactor `PurchaseRequestForm`** : utilise `SelectionSummary` pour l'article sélectionné; distinction visuelle entre article stocké (vert) et demande spéciale (orange).
- **Refactor `InterventionCreate`** : utilise `SelectionSummary` pour la machine sélectionnée; badge code, nom à côté et équipement mère à droite; pas de demande spéciale pour ce champ.
- **`SearchableSelect`** : option `allowSpecialRequest` ajoutée pour contrôler la création de demandes spéciales (désactivée pour machines, activée pour achats).
- **`PurchaseRequestPage`** : affiche un `SelectionSummary` du dernier envoi (item_label, quantité, unité) lors du succès.

## 1.3.2 - 2026-01-11

### Demande d'achat - Interface de sélection améliorée

- **Composant SearchableSelect réutilisable** : Recherche d'articles avec suggestions, gestion des demandes spéciales (articles non répertoriés), intégration dans le formulaire de demande d'achat.
- **Formulaire PurchaseRequestForm refactorisé** : Respect des règles ESLint (complexité < 10, lignes < 200), séparation en sous-composants (DetailsRow, FormActions).
- **Demande spéciale intégrée** : Option cliquable pour valider un article saisi manuellement si aucun résultat n'est trouvé; distinction visuelle (badge orange vs vert pour stock).
- **Champ demandeur obligatoire** : Bloque l'envoi tant que le demandeur n'est pas renseigné.
- **UX conservation de recherche** : Annuler une sélection (`X`) conserve le texte saisi pour modification rapide.
- **Page PurchaseRequestPage** : Affichage minimaliste du formulaire avec possibilité d'annuler la sélection et de chercher un autre article.

## 1.3.0 - 2026-01-10

### Nouvelle fonctionnalité

- **Consommation de capacité par site (équipement mère de premier niveau)**
  - Calcul côté frontend uniquement à partir des actions: groupement par `intervention_id.machine_id` et remontée vers l'équipement mère selon la hiérarchie (`is_mere`, `equipement_mere`)
  - Métriques par site: heures totales, heures FRAG, % du temps service, % du FRAG service
  - Tri par heures FRAG décroissantes pour rendre visibles les contraintes organisationnelles
  - Composant: `src/components/service/SiteConsumptionTable.jsx`
  - Hook: `src/hooks/useServiceData.js` (`calculateSiteConsumption`, `getParentEquipment`)

### Architecture

- Nettoyage des fuites de mention backend dans des couches non-adapter (suppression de références explicites au backend dans les commentaires hors `src/lib/api/adapters`) via `arch-check`.
- Restent à traiter (suivi séparé): filtres backend présents dans quelques composants; inchangés dans cette version.

## 🆕 En cours - 2026-01-10

## 1.3.1 - 2026-01-10

### Finalisation et corrections mineures

- Commit des fichiers restants liés à la page État du service et à la nouvelle section de consommation par site:
  - Adapters Directus: ajout des champs `intervention_id.machine_id` + hiérarchie (`is_mere`, `equipement_mere`).
  - Mapper actions: mapping complet de la machine et de l'équipement mère.
  - Hook `useServiceData`: extraction `getParentEquipment()`, réduction de complexité, calcul `calculateSiteConsumption()`.
  - Composant `SiteConsumptionTable`: affichage du code + nom d'équipement.
  - Composants de présentation et configuration (ServiceStatusComponents, ServiceStatusDetails, serviceTimeClassification, serviceTimeTypeCategories).
  - Normalizer: nettoyage des mentions backend dans commentaires pour passer `arch-check`.

### Notes

- `arch-check`: les fuites de backend dans les commentaires sont résolues; des filtres backend existent encore dans quelques composants (suivi séparé).

### Nouvelles fonctionnalités

#### Page État du Service

Nouvelle page d'aide à la décision au niveau service (`/service-status`).

**Objectif** : Évaluer en < 30s si le service est en capacité de tenir et progresser.

**Composants** :

- 3 KPICards synthétiques (Charge, Fragmentation, Pilotage)
- Répartition du temps (PROD, DEP, PILOT, FRAG)
- Analyse fragmentation (% actions courtes)
- Règles de lecture décisionnelles factuelles
- Alertes automatiques si seuils critiques

**Fichiers créés** :

- `src/pages/ServiceStatus.jsx` - Page principale
- `src/hooks/useServiceData.js` - Hook API
- `src/components/service/ServiceStatusComponents.jsx` - Composants présentation

**TODO Backend** : Créer vue SQL `service_time_breakdown` et route API

**Documentation** : [docs/features/SERVICE_STATUS_PAGE.md](features/SERVICE_STATUS_PAGE.md)

---

## 1.2.10 - 2026-01-10

### Front / Tables réutilisables

- Nouveau composant `DataTable` (header sticky, état vide, skeletons) utilisé comme base commune pour les listes (paniers fournisseurs, demandes d'achat, fabricants, items de stock).
- Migration des tableaux existants vers `DataTable` avec `rowRenderer` pour les lignes expandables (paniers fournisseurs, demandes d'achat) et harmonisation des états vides/chargement.
- Refactor des listes fournisseurs/fabricants/stock : suppression des composants redondants (`ManufacturerTableContent`, `StockItemRow`) au profit du rendu unifié.

### Pilotage machine

- Refonte de la page MachineDetail : en-tête opérationnelle (statut, navigation retour, refresh), alerte critique, tableau des interventions avec pagination/recherche, bloc activité (temps passé) et suggestions préventif.
- Chargement machine optimisé : `useMachineData` ne récupère plus les interventions globales, agrège les actions depuis les interventions expand et rend le chargement des sous-catégories optionnel.
- Ouverture/fermeture d'intervention calculée depuis `status_log` via `useInterventionDuration` pour afficher des durées précises.

### API / Backend

- `interventions.fetchInterventions` accepte un filtre `machineId` et rapatrie les `status_log` pour les calculs de durée.
- Mapper interventions : date d'ouverture dérivée du `status_log` et normalisation des statuts inchangée.

## 1.2.9 - 2026-01-09

### En développement

- ...

## 1.2.8 - 2026-01-09

### UX / Composants réutilisables

- **Composant InteractiveTable** : Création d'un composant de tableau interactif réutilisable avec lignes cliquables, effets de survol et boutons d'action configurables
- **MachineList refactorisé** : Utilisation d'InteractiveTable avec configuration personnalisée (colonnes, rendu des cellules, styles de lignes)
- **InterventionsList refactorisé** : Remplacement de ~400 lignes de JSX répétitif par 4 instances d'InteractiveTable avec configurations dédiées pour chaque bloc (actionnable, bloqué, projet, archivé)
- **Architecture DRY** : Réduction significative de la duplication de code, maintenance facilitée, UX cohérente entre les pages de liste

### Composants

- **SearchField** : Composant de recherche avec icône et bouton de nettoyage, déployé sur MachineList et InterventionsList

## 1.2.7 - 2026-01-09

### Corrections / Validation backend

- **Demandes d'achat publiques** : Les demandes d'achat créées depuis la page publique (sans intervention associée) fonctionnent maintenant correctement. Le mapper n'envoie plus `intervention_id: null` qui causait une erreur de validation de clé étrangère.
- **Qualification de demandes d'achat spéciales** : La création de nouvelles références de stock sans fabricant associé fonctionne maintenant correctement. Le mapper n'envoie plus `manufacturer_item_id: null` qui causait une erreur de validation de clé étrangère.
- **Support des deux formats de nommage** : Le mapper supporte maintenant à la fois `camelCase` et `snake_case` avec priorité au `snake_case` pour les champs `item_label` et `requested_by`.

### Architecture

- **Gestion des clés étrangères optionnelles** : Standardisation du pattern d'exclusion des clés étrangères nulles dans les mappers (ne pas envoyer le champ plutôt que d'envoyer `null`), conformément aux exigences de validation Directus.

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
