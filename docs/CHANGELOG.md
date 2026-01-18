# Changelog

## 1.7.1 - 2026-01-18

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Build plus rapide et plus fiable (modularisation réduit la complexité du bundler)
- Codebase plus maintenable pour les futures évolutions
- Fichiers volumineux désormais lisibles (< 200 lignes chacun)

### 🧱 Stabilisation / Dette technique

- Modularisation complète des fichiers volumineux : OrderRow, OrderLineTable, useSupplierOrdersTable, supplierOrdersHandlers, TwinLinesValidationAlert
- Ajout systématique de PropTypes sur tous les composants
- Réduction de la complexité cyclomatique par extraction de helpers
- Nettoyage des imports et exports pour meilleure clarté

### 🧩 Composants / Modules concernés

- `components/purchase/OrderRow`
- `components/purchase/OrderLineTable`
- `hooks/purchase/useSupplierOrdersTable`
- `lib/api/supplierOrdersHandlers`
- `components/purchase/TwinLinesValidationAlert`

### ⚠️ Points de vigilance

- Vérifier que les exports index.js de chaque module reflètent correctement les symboles publics
- La complexité a été réduite mais certains fichiers conservent des flags `/* eslint-disable complexity */` documentés
- Performance identique au déploiement (Vite optimise le bundling correctement)

## 1.7.0 - 2026-01-17 ⚠️ BREAKING CHANGES

### ⚠️ Modifications de conventions requises

**Migration complète Emojis → Lucide React** :

- **Règle ESLint obligatoire** : Détection automatique des emojis et caractères Unicode décoratifs
  - Pattern regex étendu : emojis standard + caractères décoratifs (→, ↻, ·, ◆)
  - Message : "Les emojis et caractères Unicode décoratifs sont interdits dans le code. Utilisez les icônes Lucide React"
  - Fichier : `eslint.config.mjs` ligne ~74
- **Breaking change** : Tout code contenant des emojis sera rejeté par le linter
- **Impact** : ~45-50 instances d'emojis/Unicode remplacées dans 13 fichiers

**Modifications du schéma de données** :

- Migration des configurations de badges vers composants React uniquement
- Tous les champs `icon` dans `badgeConfig.js` sont maintenant des composants Lucide
- Suppression des chaînes Unicode dans les configurations

### Nouvelles conventions (CONVENTIONS.md)

**Section 2.3 - Interdiction des Emojis (MANDATORY)** :

- ❌ Interdit : Emojis dans code source (✅, ❌, 📦, etc.)
- ✅ Autorisé : Icônes Lucide React uniquement
- Objectifs : Cohérence visuelle, contrôle taille/couleur, accessibilité, rendu uniforme
- Table de correspondance par contexte (Succès → CheckCircle2, Erreur → AlertTriangle, etc.)

**Section 3.4 - Style de Code Naturel (MANDATORY)** :

- Éviter les patterns "IA" : commentaires robotiques, noms verbeux, sur-ingénierie
- Nommage authentique et concis
- Code pragmatique et idiomatique
- Messages d'erreur directs et contextuels
- Checklist de code naturel (7 points)

**Section 14.3 - Système de Notification Unifié (MANDATORY)** :

- ❌ Interdit : `alert()`, `confirm()`, `prompt()` natifs
- ✅ Autorisé : Composants React (Callout, Dialog, TextField)
- Palette de couleurs standardisée (Erreur: red, Avertissement: amber, Succès: green, Info: blue)
- Notifications non bloquantes et accessibles
- Support `aria-live`, `aria-describedby`

### Composants migrés (13 fichiers)

**Composants actions/** :

- `ActionStatsCards.jsx` : Badge "Aucune" avec Check icon + inline-flex style
- `ActionsListTable.jsx` : ComplexityIcon extraction + Badge fix
- `AnomaliesPanel.jsx` : CircleCheck component

**Composants purchase/** :

- `TwinLinesValidationAlert.jsx` : 4 badges (LineBadges function + twin list) avec Check/Circle/Clock
- `QuoteLineManager.jsx` : Badge sélection avec Check icon

**Composants common/** :

- `EmptyState.jsx` : Support pour composants non instanciés (`typeof icon === "function"`)
- `AnalysisComponents.jsx` : 4 icônes AdviceCallout (BarChart3, Lightbulb, AlertTriangle, InfoIcon)
- `MobileHeader.jsx` : Menu toggle avec X/Menu icons
- `CriticalAlert.jsx` : JSDoc et default prop nettoyés

**Configurations** :

- `badgeConfig.js` : 19 emojis + 6 Unicode → 100% Lucide React (18 icônes importées)
  - Diamond (◆), ArrowRight (→), Circle (·), Repeat (↻)
  - ComplexityBadges, LoadPriorityBadges, RecurrenceBadges, ProductivityThresholds

**Hooks & Contexts** :

- `useServiceData.js` : Console.log emojis supprimés (⚠️, ❌)
- `CacheContext.jsx` : Console.warn emoji supprimé (🗑️)
- `TopInterventionsTable.jsx` : Status badges avec StatusIcon (CircleDot/AlertTriangle/Check)

### Corrections architecturales

**Contrainte Radix UI découverte** :

- Les composants `<Badge>` ne peuvent pas contenir `<Flex>` en enfant
- Erreur : "String contains an invalid character" (DOMException)
- Solution : `style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}`
- Appliqué : 5 fichiers, 8 instances de badges

**Gestion des icônes comme props** :

- Pattern standardisé : `const Icon = badge.icon; <Icon size={12} />`
- EmptyState.jsx : Support universel (string/element/elementType)
- PropTypes : `PropTypes.oneOfType([PropTypes.string, PropTypes.element, PropTypes.elementType])`

### Icônes Lucide déployées

**18 icônes uniques utilisées** :

- **Validation** : Check, CheckCircle2
- **Erreur** : XCircle, AlertTriangle
- **État** : Circle, CircleDot, Clock, Timer
- **Navigation** : Menu, X, ArrowRight, ArrowDown
- **Actions** : Search, Plus, Edit2, Pause
- **Métier** : Package, Star, Diamond, Repeat
- **Info** : Info/InfoIcon, BarChart3, Lightbulb, HelpCircle, Zap, Flame

**Standards de taille** :

- 12px : Petits badges, icônes inline
- 14-16px : Standard inline/texte
- 18px : Icônes callout
- 24px : Contrôles UI (menu, boutons)
- 48px : Icônes EmptyState

### Impact développeur

- ✅ ESLint bloque automatiquement les emojis/Unicode (CI/CD safe)
- ✅ Code professionnel et maintenable
- ✅ Accessibilité garantie (aria-label, screen readers)
- ✅ Contrôle total sur la taille et la couleur des icônes
- ✅ Rendu uniforme sur tous les navigateurs et OS
- ✅ Type safety : Tous les champs `icon` sont des composants React
- ✅ Build stable : 0 erreurs, 977.87 kB bundle

### Impact utilisateur

- Cohérence visuelle totale de l'interface
- Icônes uniformes et professionnelles
- Meilleure accessibilité (support lecteurs d'écran)
- Affichage identique quel que soit le système d'exploitation

### Migration

- 13 fichiers migrés
- ~45-50 emojis/Unicode remplacés
- 0 violation ESLint restante
- Tous les builds passent (977.87 kB, 25.13s)
- Documentation complète dans CONVENTIONS.md

### Notes techniques

- **ESLint rule** : `no-restricted-syntax` avec pattern Unicode étendu
- **Radix UI constraint** : Badge ne peut pas contenir Flex (DOM structure)
- **React rendering** : Instantiation de composants vs. passage d'objets
- **badgeConfig.js** : Migration critique (configuration exportée utilisée partout)

## 1.6.0 - 2026-01-16 ⚠️ BREAKING CHANGES

### ⚠️ Modifications de base de données requises

**Relation O2M sur `supplier_order`** :

- Ajout de la relation `order_lines` (O2M vers `supplier_order_line`)
- L'alias de relation doit être configuré comme `order_lines` dans Directus
- Champs requis : `order_lines.id`, `order_lines.urgency`

**Relation M2M sur `supplier_order_line`** :

- Ajout de la relation `purchase_requests` (M2M via table existante `supplier_order_line_purchase_request`)
- L'alias de relation doit être configuré comme `purchase_requests` dans Directus
- Champs requis : `purchase_requests.id`, `purchase_requests.purchase_request_id.id`, `purchase_requests.purchase_request_id.status`, `purchase_requests.purchase_request_id.urgency`, `purchase_requests.purchase_request_id.requested_by`, `purchase_requests.purchase_request_id.intervention_id`
- Utilisée pour l'affichage des détails des lignes dans OrderLineTable (badges urgence, intervention, demandeur)

**Impact** : Les paniers fournisseurs ne s'afficheront pas correctement sans ces relations

### Calcul automatique des indicateurs de panier

**Nombre de lignes** :

- Calcul automatique côté serveur via `order_lines.length`
- Suppression du préchargement complet des lignes (amélioration des performances)
- Affichage immédiat du nombre de lignes dans la liste des paniers

**Niveau d'urgence** :

- Calcul du niveau d'urgence maximum du panier (high/normal/low)
- Logique : le panier hérite du niveau d'urgence le plus élevé de ses lignes
- Lecture directe de `supplier_order_line.urgency` (snapshot au moment du dispatch)
- Badge coloré cohérent :
  - 🔴 **URGENT** (rouge, solid) pour "high"
  - 🟠 **Normal** (amber, soft) pour "normal"
  - ⚪ **Faible** (gris, soft) pour "low"

**Affichage** :

- Suppression du badge URGENT en double dans la colonne fournisseur
- Colonne dédiée "Urgence" avec les 3 niveaux
- Harmonisation des couleurs entre liste des paniers et lignes détaillées

### Centralisation de la configuration

**colorPalette.js** :

- Ajout de `COLOR_USAGE.urgency` pour les niveaux d'urgence
- Mapping des niveaux vers la palette industrielle

**stockManagementConfig.js** :

- Enrichissement de `URGENCY_LEVELS` avec `color` et `variant`
- Source unique de vérité pour l'affichage des badges d'urgence
- Réutilisable dans OrderRow et OrderLineTable

### Impact utilisateur

- ✅ Visibilité immédiate du niveau d'urgence de chaque panier
- ✅ Affichage cohérent entre la liste et les détails
- ✅ Performance améliorée (un seul appel API au lieu de charger toutes les lignes)
- ✅ Indicateurs calculés automatiquement sans cache complexe

## 1.5.5 - 2026-01-16

### Affichage de l'urgence et correction du champ unité

- **PurchaseRequestsTable.jsx** : Ajout de la colonne "Urgence" pour les demandes d'achat
  - Nouvelle colonne positionnée entre "État" et "Référence"
  - Fonction `renderUrgencyBadge` : Affichage visuel cohérent de la priorité
    - `high` : Badge orange solide "URGENT"
    - `low` : Badge bleu soft "Faible"
    - `normal` : Badge gris soft "Normal"
  - Alignement avec l'affichage de l'urgence dans les paniers fournisseurs (OrderRow)

- **datasource.ts** : Correction du retour des champs lors de la création/modification
  - Ajout du paramètre `fields` dans `createPurchaseRequestInBackend` (POST)
  - Ajout du paramètre `fields` dans `updatePurchaseRequestInBackend` (PATCH)
  - Résout le problème : Directus retourne maintenant tous les champs (`unit`, `urgency`, etc.) après création/modification
  - Garantit la cohérence des données entre requête et réponse

### Impact utilisateur

- La priorité des demandes d'achat est maintenant visible dans le tableau principal
- Les champs `unit` et `urgency` sont correctement retournés après création/modification d'une demande
- Amélioration de la prise de décision grâce à la visibilité de l'urgence

## 1.5.5 - 2026-01-16

### Affichage de l'urgence et correction du champ unité

- **PurchaseRequestsTable.jsx** : Ajout de la colonne "Urgence" pour les demandes d'achat
  - Nouvelle colonne positionnée entre "État" et "Référence"
  - Fonction `renderUrgencyBadge` : Affichage visuel cohérent de la priorité
    - `high` : Badge orange solide "URGENT"
    - `low` : Badge bleu soft "Faible"
    - `normal` : Badge gris soft "Normal"
  - Alignement avec l'affichage de l'urgence dans les paniers fournisseurs (OrderRow)

- **datasource.ts** : Correction du retour des champs lors de la création/modification
  - Ajout du paramètre `fields` dans `createPurchaseRequestInBackend` (POST)
  - Ajout du paramètre `fields` dans `updatePurchaseRequestInBackend` (PATCH)
  - Résout le problème : Directus retourne maintenant tous les champs (`unit`, `urgency`, etc.) après création/modification
  - Garantit la cohérence des données entre requête et réponse

### Impact utilisateur

- La priorité des demandes d'achat est maintenant visible dans le tableau principal
- Les champs `unit` et `urgency` sont correctement retournés après création/modification d'une demande
- Amélioration de la prise de décision grâce à la visibilité de l'urgence

## 1.5.4 - 2026-01-15

### Refonte majeure : Séparation Pièces/Approvisionnements

- **Nouvelle architecture : Pages Parts et Procurement** : Séparation claire entre le référentiel technique et le flux d'achat
  - **Parts.jsx** : Référentiel technique pur (Pièces, Fournisseurs, Fabricants) sans quantités stock
  - **Procurement.jsx** : Flux d'achat complet (Demandes d'achat, Mutualisation, Envoyés, Commandés, Clôturés)
  - **menuConfig.js** : Nouvelles routes `parts` et `procurement`, suppression de `stock`
  - **routes.js** : Import des nouveaux composants, retrait de StockManagement.jsx

### Restructuration : Paniers fournisseurs avec logique métier automatisée

- **Remplacement "À préparer" → "Mutualisation"** : État métier clair avec calculs automatiques
  - Calcul automatique de l'urgence globale (MAX des urgences des lignes)
  - Calcul automatique de l'âge maximum (MAX des âges des lignes)
  - Détection automatique de rupture de mutualisation (ligne urgente OU ligne normale >7j)
  - Badge violet pour paniers en mutualisation, badge rouge pour ruptures
  - Alert visible indiquant le nombre de paniers en rupture de mutualisation

- **Onglets suivant le processus métier** : DA → Mutualisation → Envoyés → Commandés → Clôturés
  - **POOLING** : Paniers OPEN avec logique de mutualisation automatique
  - **SENT** : Paniers envoyés aux fournisseurs (status SENT)
  - **ORDERED** : Paniers commandés (status ACK ou RECEIVED)
  - **CLOSED** : Paniers clôturés ou annulés (status CLOSED ou CANCELLED)
  - Icônes contextuelles : ShoppingCart, Users, Send, PackageCheck, Archive

### Amélioration UX : Affichage des paniers fournisseurs (OrderRow)

- **Mise en évidence du fournisseur** : Mental model aligné sur "commande chez REXEL" plutôt que "commande #12345"
  - Nom fournisseur en gras, taille 2, ligne principale
  - N° commande en badge gris discret monospace en dessous
  - Badges URGENT (orange) et ⚠>7j (rouge) sur la ligne fournisseur

- **Fusion badge statut + sélecteur** : Un seul composant avec icônes, couleurs et interaction
  - Select.Trigger avec `color={statusConfig.color}` pour couleur du statut
  - Icône dynamique selon le statut (FolderOpen, Send, Mail, PackageCheck, Archive, XCircle)
  - Label français visible : "Ouvert", "Envoyé (attente)", "Réponse reçue", etc.
  - Suppression de la colonne "Status" badge redondante

- **Nouvelle colonne Urgence** : Remplacement de la colonne Montant par niveau d'urgence
  - Badge "URGENT" (orange/solid) pour paniers avec au moins une ligne urgente
  - Badge "Normal" (gris/soft) pour les autres paniers
  - Information plus pertinente pour prioriser les actions

- **Réorganisation des colonnes** : Ordre logique pour consultation rapide
  - Fournisseur / N° (colonne principale élargie)
  - Âge (j) avec code couleur (gris → jaune → orange → rouge)
  - Nb lignes (badge gris)
  - Urgence (URGENT/Normal)
  - Statut (sélecteur avec icône et couleur)
  - Actions (alignées à droite, largeur fixe 200px)

### Refactorisation : ToggleDetailsButton

- **Design cohérent avec texte et flèche** : Meilleure affordance pour l'interaction
  - Texte "Détails" avec prop `showText` (défaut: true)
  - Flèche dynamique : ChevronRight (fermé) → ChevronDown (ouvert)
  - Changement de couleur : gris (fermé) → bleu (ouvert)
  - Taille par défaut 2, override à 1 dans les paniers pour compacité
  - Utilisé dans Parts.jsx (références fournisseurs) et Procurement.jsx (paniers)

### Simplification : Actions paniers

- **3 niveaux d'actions clairs** : Détails / Email / Autres
  - Bouton "Détails" (ToggleDetailsButton) : Expand/collapse des lignes
  - Bouton "Email" (bleu/soft) : Action principale d'envoi
  - Dropdown "..." (gris/ghost) : Actions secondaires et sensibles
    - Copier email HTML
    - Export CSV
    - Réévaluer statuts DA (orange, si applicable)
    - Purger le panier (rouge, destructif)
  - Tous les boutons en taille 1 pour cohérence visuelle

### Nettoyage

- **Suppression StockManagement.jsx** : Fichier obsolète (~1200 lignes) remplacé par Parts + Procurement
- **Suppression imports inutilisés** : ChevronRight (remplacé par ToggleDetailsButton), primaryAction non utilisé
- **Suppression renderAmount/renderOrderNumber** : Fonctions helper non utilisées après refonte

## 1.5.3 - 2026-01-15

### Améliorations majeures

- **Performance: Chargement lazy des références fournisseurs** : Élimination du problème N+1 queries en différant le chargement des références fournisseurs à la demande
  - **Avant** : ~30 requêtes XHR au chargement initial de la page (1 par article visible)
  - **Après** : 0 requête au chargement initial, chargement uniquement quand l'utilisateur clique sur "Détails"
  - **PurchaseRequestsTable** : Ajout du callback `onLoadDetailsData` et des états de chargement `detailsLoadingStates`
  - **StockManagement** : Suppression des `useEffect` de préchargement, ajout de `handleLoadDetailsForRequest`
  - Spinner visible sur le bouton "Détails" pendant le chargement
  - Impact positif majeur sur le temps de chargement initial

- **Optimisation: Relation M2O pour les données stock_item** : Utilisation des relations Directus pour charger les données en une seule requête au lieu de lookups côté client
  - **datasource.ts** : Expansion de `stock_item_id.id`, `stock_item_id.ref`, `stock_item_id.supplier_refs.id`
  - **mapper.ts** : Extraction des données depuis l'objet relation + comptage des supplier_refs en JS
  - **PurchaseRequestsTable** : Utilisation directe de `request.stockItemRef` et `request.stockItemSupplierRefsCount`
  - Élimination des fonctions `getStockItemRef()` et `getPreferredSupplier()`
  - Tri et filtrage simplifiés sans dépendances sur les lookups

- **Simplification: Suppression de la colonne "Fournisseur"** : Retrait de la colonne redondante dans le tableau des demandes d'achat
  - Information déjà visible via le badge "État" (vert si fournisseur préféré défini)
  - Réduction de la largeur du tableau pour meilleure lisibilité
  - Logique métier maintenue via `stockItemSupplierRefsCount`

- **Architecture: Suppression du module Consultation** : Allègement du code en retirant le système de consultation fournisseurs non utilisé
  - Suppression du composant `ConsultationTab.jsx` (~435 lignes)
  - Retrait de l'onglet "Consultation" de StockManagement
  - Nettoyage des imports inutilisés (FileText icon)
  - Réduction de la complexité globale de l'application

### Corrections

- **Fix: Filtrage des DA reçues** : Les demandes d'achat avec statut `received` ne sont plus chargées au démarrage
  - **datasource.ts** : Ajout du filtre `status: { _neq: 'received' }` sur `fetchPurchaseRequestsFromBackend`
  - Les DA reçues restent visibles dans la section "Demandes archivées" au bas du tableau
  - Amélioration de la clarté de l'affichage principal

- **Fix: Logique de dispatch simplifiée** : Le dispatch vérifie uniquement que les DA ont un article lié, le backend détermine la dispatchabilité
  - **StockManagement.handleDispatchClick** : Suppression de la vérification frontend du fournisseur préféré
  - Le backend SQL `dispatch_purchase_requests()` gère toute la logique métier
  - Message utilisateur plus clair: "Aucune demande dispatchable" au lieu de "Aucune demande prête pour dispatch"

- **Fix: Comptage des supplier_refs** : Utilisation d'un comptage array-based au lieu du champ trigger cassé
  - **datasource.ts** : Chargement de `stock_item_id.supplier_refs.id` (array minimal)
  - **mapper.ts** : Comptage avec `Array.isArray() ? .length : 0`
  - Plus fiable que le champ `supplier_refs_count` maintenu par trigger
  - Temps réel garanti (pas de lag de synchronisation)

### Technique

- **Debug logs** : Ajout de logs de développement pour tracer les données M2O
  - `mapper.ts` : Log de la structure `stock_item_id` relation
  - `PurchaseRequestsTable.jsx` : Log des données reçues par requête
  - Activés uniquement en `NODE_ENV === 'development'`

## 1.5.2 - 2026-01-14

### Améliorations

- **Refactorisation: Suppression des demandes d'achat** : Création d'une architecture réutilisable pour la suppression des DA avec pattern de sécurité double-clic
  - **`useDeletePurchaseRequest`** : Hook personnalisé centralisant la logique de suppression
  - **`DeletePurchaseRequestButton`** : Composant réutilisable avec états visuels (icône trash → "Confirmer ?")
  - **PurchaseRequestsTable** : Utilisation du hook et du composant pour éliminer le code dupliqué
  - **Pattern double-clic** : Premier clic = confirmation visuelle (3s timeout), deuxième clic = exécution
  - Cohérence UX améliorée sur toute l'application

### Corrections

- **Fix: Synchronisation du statut des DA lors du changement de statut panier** : Le statut des demandes d'achat est maintenant correctement mis à jour lorsqu'un panier fournisseur change de statut
  - **datasource.ts** : Ajout du chargement manuel des relations M2M `supplier_order_line_purchase_request`
  - **supplierOrdersHandlers.js** : Restructuration de `handleStatusChange` pour garantir la mise à jour des DA pour TOUS les changements de statut
  - **STATUS_MAPPING** : Correction du mapping OPEN → `in_progress` (au lieu de `open`)

- **Fix: Labels de statut DA plus clairs** : Changement du label "Attente fournisseur" en "En attente de consultation" pour mieux refléter l'état réel du panier OPEN
  - **purchasingConfig.js** : Mise à jour du label et de la description du statut `IN_PROGRESS`
  - **PurchaseRequestsTable.jsx** : Utilisation cohérente du label centralisé

## 1.4.4 - 2026-01-14

### Corrections

- **Fix: Bouton de réévaluation des statuts DA** : Ajout d'un bouton de réévaluation provisoire (🔄 Réévaluer statuts DA) dans le menu dropdown des paniers pour permettre une synchronisation manuelle des statuts des demandes d'achat en cas d'erreur.
  - `handleReEvaluateDA()` : Nouvelle fonction de réévaluation dans supplierOrdersHandlers.js
  - `OrderRow.jsx` : Ajout du bouton dans le dropdown menu avec gestion des erreurs
  - `SupplierOrdersTable.jsx` : Intégration du handler avec les callbacks existants
  - **TODO (v1.5)**: À supprimer après correction complète du bug de synchronisation des DA

## 1.5.1 - 2026-01-14

### Corrections

- **Fix: Affichage des références en Consultation** : Correction de la synchronisation camelCase/snake_case entre les composants React et l'API Directus. Les champs de consultation (`quote_received`, `is_selected`, `quote_price`, etc.) sont maintenant correctement affichés après mise à jour.
  - `QuoteLineManager` : Support des deux formats de champs (camelCase local et snake_case API)
  - `ConsultationTab` : Synchronisation correcte des mises à jour avec conversion camelCase → snake_case
  - Affichage unifié des données indépendamment du format reçu de l'API

## 1.5.0 - 2026-01-13

### 🎯 Système de consultation fournisseurs

**BREAKING CHANGE**: Modification majeure du processus d'achat fournisseur. Les paniers existants créés avant cette version ne disposent pas des liens M2M `supplier_order_line_purchase_request` et ne peuvent pas être purgés correctement.

#### Nouveaux champs et tables

- **supplier_order_line** : Ajout de 8 nouveaux champs de consultation
  - `quote_received` : Indique si le devis fournisseur a été reçu
  - `is_selected` : Indique le fournisseur sélectionné (un seul par référence)
  - `quote_price` : Prix du devis proposé
  - `lead_time_days` : Délai de livraison en jours
  - `manufacturer` : Fabricant proposé par le fournisseur
  - `manufacturer_ref` : Référence fabricant proposée
  - `quote_received_at` : Date/heure de réception du devis
  - `rejected_reason` : Raison du rejet

- **supplier_order_line_purchase_request** : Table de liaison M2M entre lignes de panier et demandes d'achat, créée automatiquement lors du dispatch

#### Fonction dispatch modifiée

- **Dispatch vers TOUS les fournisseurs** : Les demandes d'achat sont désormais dispatchées vers les paniers OPEN de TOUS les fournisseurs associés à une référence (au lieu d'un seul fournisseur préféré)
- **Création automatique des liens M2M** : La fonction PL/pgSQL `dispatch_purchase_requests()` crée automatiquement les entrées dans `supplier_order_line_purchase_request`
- **Initialisation des champs consultation** : Tous les champs de consultation sont initialisés à leurs valeurs par défaut (`quote_received=false`, `is_selected=false`, etc.)

#### Fonctionnalité de purge

- **Purge des paniers fournisseurs** : Nouveau endpoint `purgeSupplierOrder(orderId)` pour supprimer complètement un panier
- **Remise en attente des DAs** : Les demandes d'achat associées repassent automatiquement au statut `open` pour être dispatchées à nouveau
- **Nettoyage complet** : Suppression des liens M2M, des lignes de panier et du panier lui-même

#### Validation intelligente pré-commande

- **Auto-sélection pour fournisseur unique** : Si une référence n'a qu'un seul fournisseur associé, elle est automatiquement sélectionnée lors du passage en commande
- **Sélection obligatoire pour multi-fournisseurs** : Si plusieurs fournisseurs sont disponibles, l'utilisateur DOIT passer par l'onglet Consultation pour sélectionner explicitement un fournisseur
- **Blocage avec message explicite** : Le système empêche la commande et liste les articles nécessitant une sélection

#### Interface Consultation

- **Nouvel onglet Consultation** : Vue transversale pour gérer les devis et la sélection des fournisseurs
- **Composants de gestion des devis** :
  - `ConsultationTab` : Vue d'ensemble avec statistiques (total, devis reçus, sélectionnés, en attente)
  - `QuoteLineManager` : Gestionnaire par ligne avec saisie devis et bouton de sélection
  - `QuoteLineForm` : Formulaire de saisie des devis (prix, délai, fabricant, référence)
- **Regroupement par article** : Affichage de toutes les options fournisseurs disponibles pour chaque référence
- **Sélection exclusive** : Un seul fournisseur peut être sélectionné par référence (désélection automatique des autres)

#### Modifications API

- **ApiAdapter.ts** : Ajout des champs consultation dans `SupplierOrderLine`, nouvelle signature `purgeSupplierOrder`
- **datasource.ts** : Implémentation `purgeSupplierOrder`, `updateSupplierOrderLine`, fallback manuel pour dispatch
- **adapter.ts** : Export des nouvelles fonctions `purgeSupplierOrder` et `updateSupplierOrderLine`
- **Mock adapter** : Implémentation mock de `purgeSupplierOrder`

#### Interface utilisateur

- **OrderRow** : Ajout du menu "🗑️ Purger le panier" avec confirmation
- **SupplierOrdersTable** : Gestion de la purge avec nettoyage du cache et rafraîchissement
- **StockManagement** : Intégration de l'onglet Consultation entre "Paniers" et "Stock"

### ⚠️ Breaking Changes

1. **Structure de dispatch modifiée** : Les paniers sont maintenant créés pour TOUS les fournisseurs (au lieu d'un seul fournisseur préféré). Les anciennes données ne suivent pas ce modèle.

2. **Liens M2M obligatoires** : La fonction de purge nécessite l'existence des liens M2M `supplier_order_line_purchase_request`. Les paniers créés avant cette version ne disposent pas de ces liens et ne peuvent pas être purgés correctement.

3. **Validation pré-commande stricte** : Le passage en commande est bloqué pour les références ayant plusieurs fournisseurs si aucune sélection explicite n'a été faite dans l'onglet Consultation.

### Migration recommandée

Pour les installations existantes :

1. Appliquer le schéma SQL : `db/schema/01_core/supplier_order_line.sql` (champs consultation)
2. Appliquer la fonction modifiée : `db/schema/05_triggers/fn_dispatch_purchase_requests.sql`
3. **Purger manuellement** les paniers existants en base de données (ils n'ont pas les liens M2M)
4. Redispatcher les demandes d'achat pour créer les nouveaux paniers avec liens M2M

## 1.4.3 - 2026-01-13

### Améliorations

- **Affichage du profil utilisateur** : Nom, prénom et rôle de l'utilisateur connecté s'affichent maintenant dans le footer de la sidebar, centré avec un meilleur style.
- **Support flexible des formats** : Les champs utilisateur supportent à la fois `first_name`/`last_name` (snake_case) et `firstName`/`lastName` (camelCase).

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
