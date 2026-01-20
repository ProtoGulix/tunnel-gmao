## 1.11.1 - 2026-01-20

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Correction : ajout de référence fournisseur fonctionne correctement

## 1.11.0 - 2026-01-20

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Gestion des catégories et sous-catégories d'actions disponible dans l'onglet Actions
- Version du logiciel affichée dynamiquement dans le titre de la page
- Palette de couleurs étendue avec 50 nuances pour personnalisation avancée

### 🧱 Stabilisation / Dette technique

- Refactoring enrichissement client-side des sous-catégories pour résoudre erreur permissions Directus
- Extension COLOR_PALETTE avec variations de tons (primaryTone1-10, successTone1-10, etc.)
- Sélection de couleurs strictement conforme à la palette approuvée

### 🧩 Composants / Modules concernés

- src/main.jsx (import version dynamique)
- src/pages/ActionsPage.jsx (ajout onglet categories)
- src/components/actions/ActionCategoriesTable.jsx (nouveau)
- src/components/actions/CategoryRow.jsx (nouveau)
- src/components/actions/SubcategoryRow.jsx (nouveau)
- src/config/actionPageConfig.js (configuration onglet)
- src/config/colorPalette.js (50 nouvelles couleurs)
- src/lib/api/adapters/directus/actionSubcategories/adapter.ts (enrichissement client-side)
- src/lib/api/adapters/directus/actionSubcategories/datasource.ts (suppression nested fields)

### ⚠️ Points de vigilance

- API create/delete pour catégories préparées mais non activées (attente endpoints backend)
- Dropdown de sélection de couleur contient 54 options (peut nécessiter groupement UX en 1.12.0)

## 1.10.0 - 2026-01-20

Stabilité : 🟡 en consolidation

### 🎯 Impact fonctionnel

- Gestion des familles et sous-familles de pièces disponible depuis l’onglet Pièces
- Tableau Fournisseurs modernisé : actions regroupées et panneau d’extension pour les références par fournisseur

### 🧱 Stabilisation / Dette technique

- Mutualisation du tableau fournisseurs sur le composant DataTable pour cohérence UI
- Ajout des opérations CRUD familles/sous-familles dans l’adapter Directus (cache invalidé)

### 🧩 Composants / Modules concernés

- src/pages/Parts.jsx
- src/components/purchase/suppliers/SuppliersTable.jsx
- src/components/purchase/suppliers/SupplierRefsBySupplierPanel.jsx
- src/components/stock/StockFamiliesTable.jsx (nouveau)
- src/components/stock/FamilyRow.jsx (nouveau)
- src/components/stock/SubfamilyRow.jsx (nouveau)
- src/lib/api/adapters/directus/stock/adapter.ts
- src/lib/api/adapters/directus/stock/datasource.ts

### ⚠️ Points de vigilance

- Suppression de SuppliersInlinePanel.jsx : vérifier les intégrations externes éventuelles
- Le panneau familles/sous-familles déclenche des confirmations navigateur (window.confirm) conservées temporairement

## 1.9.1 - 2026-01-20

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Amélioration interne : optimisation code TechnicianHome et InterventionCreate

### 🧩 Composants / Modules concernés

- src/pages/TechnicianHome.jsx
- src/hooks/useTechnicianHome.js (nouveau)
- src/components/technician/ActionCard.jsx (nouveau)
- src/pages/InterventionCreate.jsx
- src/hooks/useInterventionCreate.js

## 1.9.0 - 2026-01-19

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Nouvelle page "Pupitre Atelier" : tableau de bord pour techniciens avec indicateurs clés (urgences, interventions ouvertes, anomalies hygiènes)
- Landing page intelligente : utilisateurs authentifiés sont automatiquement redirigés vers le pupitre atelier
- Utilisateurs non-authentifiés accèdent toujours à la page d'accueil publique
- Bug fix InterventionDetail : affichage priorité/urgence corrigé (mapPriorityToConfigKey)
- Amélioration lisibilité détail intervention : header hiérarchisé (dropdowns statut/priorité déplacés dans actions)

### 🧱 Stabilisation / Dette technique

- Système de redirection au niveau du routeur (App.jsx) : logique centralisée et maintenable
- Respect des conventions : HomeRedirect() suit le pattern existant des composants
- Cohérence avec le flow d'authentification existant (Login.jsx → TechnicianHome)

### 🧩 Composants / Modules concernés

- src/pages/TechnicianHome.jsx : nouveau composant pupitre atelier
- src/App.jsx : ajout HomeRedirect(), modification du routing
- src/pages/Login.jsx : redirection défaut `/technician` (au lieu de `/interventions`)
- src/config/menuConfig.js : technician-home configuration
- src/pages/routes.js : TechnicianHome mapping
- src/pages/InterventionDetail.jsx : refactoring header + fix affichage priorité
- src/components/layout/HierarchicalHeaderLayout.jsx : amélioration responsive dropdowns
- src/config/interventionTypes.js : ajout labels PRIORITY_COLORS

### ⚠️ Points de vigilance

- La route `/` maintient le pattern de ProtectedRoute interne pour utilisateurs authentifiés
- Les utilisateurs avec redirect_after_login stocké conservent leur destination prévue

## 1.8.0 - 2026-01-19

Stabilité : 🟡 en consolidation

### 🎯 Impact fonctionnel

- Le panneau de détails des demandes d'achat se charge correctement et affiche les références fournisseurs et spécifications
- Les couleurs de fond des lignes sont moins intenses pour améliorer la lisibilité
- Interface de tableau de demandes d'achat optimisée et plus réactive

### 🧱 Stabilisation / Dette technique

- Refactoring majeur du composant PurchaseRequestsTable : séparation en modules indépendants
- Réduction de la complexité cyclomatique (18 → 10) pour respecter les standards de qualité
- Extraction de helpers réutilisables (couleurs d'âge, tri, définition des colonnes)
- Création de composants enfants pour meilleure maintenabilité (PurchaseRequestRow)
- Centralisation des PropTypes et des constantes
- Amélioration de la séparation des responsabilités

### 🧩 Composants / Modules concernés

- components/purchase/requests/PurchaseRequestsTable.jsx
- components/purchase/requests/PurchaseRequestRow.jsx (nouveau)
- components/purchase/requests/purchaseRequestsTable.helpers.jsx (nouveau)
- components/purchase/requests/purchaseRequestRow.helpers.jsx (nouveau)
- components/purchase/requests/purchaseRequestsTable.propTypes.js (nouveau)

### ⚠️ Points de vigilance

- Architecture modulaire : les changements futurs doivent respecter la séparation des composants
- Les props du composant parent restent nombreuses → à surveiller pour prochaines itérations

## 1.7.2 - 2026-01-18

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Les demandes d'achat créées s'affichent immédiatement

## 1.7.0 - 2026-01-17

Stabilité : 🟡 en consolidation

### 🎯 Impact fonctionnel

- Interface uniformisée : remplacement de tous les pictogrammes hétérogènes par un jeu d’icônes cohérent
- Meilleure lisibilité des statuts, alertes et badges dans toute l’application
- Amélioration de l’accessibilité (lecture écran, contraste, cohérence visuelle)
- Suppression des symboles ambigus ou dépendants du système d’exploitation

### 🧱 Stabilisation / Dette technique

- Standardisation complète du système d’icônes → élimination des comportements visuels incohérents
- Centralisation des conventions UI → réduction du risque de dérive future
- Sécurisation des composants d’alerte et de notification → comportements maîtrisés et prévisibles

### 🧩 Composants / Modules concernés

- components/actions/\*
- components/purchase/\*
- components/common/\*
- components/service/\*
- config/badgeConfig
- hooks/\*
- context/\*

### ⚠️ Points de vigilance

- Toute icône doit désormais respecter la convention définie (pas de symboles libres)
- Les composants UI deviennent dépendants du système d’icônes centralisé
- Toute nouvelle vue doit s’aligner strictement sur ces conventions

## 1.6.0 - 2026-01-16

Stabilité : 🟡 en consolidation

### 🎯 Impact fonctionnel

- Les paniers fournisseurs affichent désormais des indicateurs fiables et cohérents
- Le niveau d’urgence d’un panier est automatiquement visible et priorisable
- Les informations affichées correspondent exactement à l’état réel des demandes associées
- Les paniers incomplets ou incohérents sont évités par construction

### 🧱 Stabilisation / Dette technique

- Centralisation des règles de calcul des indicateurs → réduction des incohérences d’affichage
- Automatisation des indicateurs clés → suppression de dépendances implicites côté interface
- Alignement strict entre données et affichage → fiabilité accrue des décisions utilisateur

### 🧩 Composants / Modules concernés

- components/purchase/OrderRow
- components/purchase/OrderLineTable
- components/purchase/SupplierOrdersTable
- config/stockManagementConfig
- config/colorPalette
- lib/api/\*

### ⚠️ Points de vigilance

- Les indicateurs reposent désormais sur des règles automatiques non modifiables côté interface
- Toute évolution des règles d’urgence doit être faite de manière centralisée
- Les installations existantes doivent être vérifiées pour cohérence des données

## 1.5.x - 2026-01-16

Stabilité : 🟡 en consolidation

### 🎯 Impact fonctionnel

- Le processus d’achat fournisseur est désormais complet et cohérent de bout en bout
- Les demandes d’achat sont correctement liées aux actions et aux paniers fournisseurs
- L’utilisateur est guidé et bloqué lorsque des informations obligatoires manquent
- Les paniers fournisseurs reflètent fidèlement l’état réel des demandes associées

### 🧱 Stabilisation / Dette technique

- Centralisation de la logique de dispatch et de synchronisation des statuts → suppression des incohérences
- Sécurisation des suppressions et des changements de statut → prévention des pertes de données
- Simplification du chargement des données → amélioration de la fiabilité et des performances perçues

### 🧩 Composants / Modules concernés

- components/purchase/\*
- components/actions/\*
- components/common/\*
- hooks/\*
- lib/api/\*
- config/\*

### ⚠️ Points de vigilance

- Les paniers créés avant cette version peuvent nécessiter une remise à plat
- Le processus d’achat impose désormais des règles strictes non contournables
- Toute évolution doit préserver la cohérence entre demandes, lignes et paniers

## 1.4.x - 2026-01-12

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Les demandes d’achat peuvent être créées, suivies et supprimées directement depuis les actions
- La qualification des demandes est plus claire et plus rapide
- L’utilisateur visualise immédiatement les liens entre interventions, actions et achats
- Les erreurs de saisie ou de synchronisation sont fortement réduites

### 🧱 Stabilisation / Dette technique

- Unification des règles de liaison entre actions et demandes d’achat → fiabilité accrue
- Sécurisation des suppressions et des mises à jour → prévention des incohérences
- Clarification du modèle de données côté utilisateur → compréhension facilitée

### 🧩 Composants / Modules concernés

- components/actions/\*
- components/purchase/\*
- components/interventions/\*
- lib/api/\*
- hooks/\*

### ⚠️ Points de vigilance

- Les règles de liaison action ↔ demande d’achat sont désormais structurantes
- Toute modification future doit respecter ces relations
- Vérifier les cas limites lors de suppressions multiples

## Versions antérieures (≤ 1.3.x) — Historique consolidé

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Mise en place des fondations de la GMAO : machines, interventions, actions
- Création et suivi des demandes d’achat liées aux interventions
- Visualisation structurée de l’activité maintenance (temps, catégories, statuts)
- Premiers indicateurs d’aide à la décision au niveau machine et service
- Navigation unifiée et accès cohérent aux données principales

### 🧱 Stabilisation / Dette technique

- Structuration progressive du modèle de données maintenance
- Mise en place des premières conventions UI et métier
- Sécurisation des flux principaux (création, modification, suppression)
- Nettoyage des incohérences initiales liées aux itérations rapides

### 🧩 Composants / Modules concernés

- components/interventions/\*
- components/actions/\*
- components/purchase/\*
- components/machines/\*
- components/service/\*
- hooks/\*
- lib/api/\*
- config/\*

### ⚠️ Points de vigilance

- Certaines décisions historiques limitent encore la flexibilité
- Le modèle initial a été construit par itérations rapides
- Toute refonte majeure doit tenir compte de cet héritage

---

Les versions antérieures à la 1.4.x ont été regroupées afin de préserver la lisibilité
et d’éviter toute dérive vers un journal de développement.

---
