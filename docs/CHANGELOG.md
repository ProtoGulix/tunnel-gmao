## 2.6.0 - 2026-02-15

Stabilité: STABLE

### Amélioration des fiches PDF d'intervention

#### Ce qui a changé

- **Chargement plus rapide**: Les fiches d'intervention en preview s'affichent plus rapidement
- **Messages d'erreur améliorés**: Si une fiche ne peut pas être chargée, vous recevez un message clair indiquant le problème
- **Configuration simplifiée**: Un seul serveur gère maintenant toutes les fonctionnalités (interventions et exports)

#### Impact utilisateur

- Aucun changement visible dans votre utilisation quotidienne
- Les exports PDF fonctionnent exactement comme avant
- Connexion plus fiable lors de l'affichage des fiches

#### Mise à jour nécessaire

- Cette version nécessite une mise à jour du serveur (version 1.8.0)
- Contactez votre administrateur si les fiches PDF ne s'affichent plus correctement

---

## 2.5.0 - 2026-02-11

Stabilité: STABLE

### Nouvelle page : Qualité des données

#### Ce qui a changé

- **Contrôle de la qualité de vos données**: Nouvelle page qui vérifie automatiquement si vos données sont complètes et cohérentes
- **13 vérifications sur vos données principales**:
  - **Actions d'intervention** (7 vérifications): détecte les actions sans temps saisi, sans technicien, avec description vide, sur intervention déjà fermée, etc.
  - **Interventions** (3 vérifications): interventions fermées sans aucune action, sans type défini, ou en cours mais inactives
  - **Articles de stock** (2 vérifications): articles sans seuil minimum ou sans fournisseur
  - **Demandes d'achat** (1 vérification): demandes non liées à un article de stock
- **Filtres pratiques**: Affichez uniquement les problèmes critiques ou ceux d'une catégorie spécifique
- **Vue d'ensemble**: Nombre total de problèmes et répartition par niveau d'urgence
- **Corrections facilitées**: Chaque problème affiche combien d'éléments sont concernés avec des exemples pour les retrouver

#### Modifications importantes

- **Pages temporairement masquées**: Deux pages ne sont plus accessibles jusqu'à nouvelle version du serveur
  - "Charge technique" - en attente de mise à jour serveur
  - "Anomalies de saisie" - en attente de mise à jour serveur
  - Ces pages reviendront dans une prochaine version

#### Impact utilisateur

- Nouvelle entrée "Qualité des données" dans le menu (icône base de données)
- Vérifiez facilement si vos données sont complètes
- Corrigez les problèmes grâce aux exemples fournis
- Deux anciennes pages sont temporairement indisponibles

#### Mise à jour nécessaire

- Cette version nécessite une mise à jour du serveur (version 1.7.0)
- Contactez votre administrateur si vous ne voyez pas la nouvelle page

---

## 2.4.0 - 2026-02-09

Stabilité: STABLE

### Nouvelle page : Anomalies de saisie

#### Ce qui a changé

- **Contrôle qualité des actions**: Nouvelle page dédiée à l'analyse des anomalies dans la saisie des actions de maintenance
- **6 types d'anomalies détectées**:
  - Actions répétitives (même catégorie/machine répétée trop souvent)
  - Actions fragmentées (trop de micro-actions courtes)
  - Durées anormales (temps incohérent avec la catégorie)
  - Classifications douteuses (mots-clés incohérents)
  - Actions consécutives (même technicien avec saisies très rapprochées)
  - Charge faible valeur (temps cumulé élevé sur des tâches à faible valeur)
- **Vue synthétique**: Cartes récapitulatives par niveau de sévérité
- **Suppression de l'ancienne page Actions**: Remplacée par cette nouvelle analyse plus pertinente

#### Impact utilisateur

- Nouvelle entrée "Anomalies saisie" dans le menu
- Identifiez rapidement les problèmes de qualité de données
- Toutes les règles et seuils proviennent du serveur

#### Prérequis

- **Serveur backend v1.6.0 minimum requis** — nouvel endpoint `/stats/anomalies-saisie`

---

## 2.3.1 - 2026-02-09

Stabilité: STABLE

### Charge technique : amélioration de l'affichage

#### Ce qui a changé

- **Détail par classe simplifié**: Présentation plus légère des informations lors du dépliage
- **Style harmonisé**: Meilleure cohérence visuelle avec le reste de l'application

#### Impact utilisateur

- Interface plus sobre et lisible
- Même information, présentation plus claire

---

## 2.3.0 - 2026-02-09

Stabilité: STABLE

### Nouvelle page : Charge technique

#### Ce qui a changé

- **Nouvelle page d'analyse**: Visualisez la répartition du temps de maintenance entre dépannage et travail constructif
- **Indicateur de dépannage évitable**: Identifiez la part du temps de dépannage qui pourrait être évitée (standardisation, conception, méthodes)
- **Répartition par cause**: Tableau détaillé par facteur de complexité avec label et catégorie depuis l'API
- **Analyse par classe d'équipement**: Comparez les charges entre types de machines
  - **Détail expandable** : cliquez une ligne pour voir la ventilation du temps évitable
  - **Causes principales** : top 3 des facteurs de complexité par classe
  - **Recommandation d'action** : conseil concret fourni par le serveur
- **Guide de lecture dynamique**: Objectifs, seuils et recommandations fournis directement par le serveur

#### Impact utilisateur

- Nouvelle entrée "Charge technique" dans le menu
- Aide à la décision : où investir pour réduire le temps de dépannage
- Interface entièrement pilotée par les données serveur (pas de constantes codées en dur)

#### Prérequis

- **Serveur backend v1.5.1 minimum requis** — nouvel endpoint `/stats/charge-technique` enrichi

---

## 2.2.0 - 2026-02-08

Stabilité: STABLE

### Mise à jour de compatibilité serveur

#### Ce qui a changé

- **Adaptation au nouveau serveur**: L'application communique maintenant avec la version 1.4.0 du serveur backend
- **Facteurs de complexité**: Les informations de complexité des actions sont correctement envoyées et reçues
- **Classes d'équipements**: L'affichage des catégories d'équipements fonctionne avec la nouvelle API

#### Impact utilisateur

- Aucun changement visible dans l'interface
- L'application fonctionne normalement avec le serveur mis à jour

#### Prérequis

- **Serveur backend v1.4.0 minimum requis** — contactez votre administrateur si vous rencontrez des erreurs

---

## 2.1.14 - 2026-02-07

Stabilité: STABLE

### Interventions: chargement et stabilité

#### Ce qui a changé

- **Ouverture du détail plus fiable**: l’écran d’intervention s’affiche sans attente inutile
- **Moins d’appels en arrière-plan**: réduction des rafraîchissements non nécessaires
- **Stabilité renforcée**: meilleure tenue lors des ouvertures/retours rapides

#### Impact utilisateur

- Détail d’intervention affiché immédiatement
- Réduction des requêtes inutiles vers le backend

---

## 2.1.13 - 2026-02-07

Stabilité: STABLE

### Approvisionnement: améliorations et correctifs

#### Ce qui a changé

- **Bandeau de dispatch clarifié**: présentation plus nette des résultats et des actions
- **Onglets fournisseurs simplifiés**: affichage plus homogène et lisible
- **Demandes d'achat harmonisées**: comportement unifié entre demandes actives et archivées
- **Outil de recalcul retiré**: l’option n’est plus proposée car elle n’était pas utile au quotidien
- **Changement de statut fiabilisé**: moins d’erreurs lors des transitions

#### Impact utilisateur

- Interface plus claire
- Actions plus fiables sur les paniers

---

## 2.1.12 - 2026-02-06

Stabilité: STABLE

### Intégration API et dispatch automatique

#### Ce qui a changé

- **Dispatch automatique**: Nouvelle fonctionnalité de dispatch automatique des demandes d'achat prêtes (statut PENDING_DISPATCH) vers les paniers fournisseurs via l'API
- **Statistiques optimisées**: Les compteurs des onglets utilisent maintenant les statistiques de l'API au lieu de calculs locaux
- **Endpoint API**: Intégration du nouvel endpoint `/purchase_requests/dispatch` et `/purchase_requests/stats`
- **Fix mapper**: Correction du mapper de références fournisseurs pour accepter le format snake_case conforme à l'API
- **Statuts conformes**: Utilisation des statuts dérivés de l'API (TO_QUALIFY, NO_SUPPLIER_REF, PENDING_DISPATCH, OPEN, etc.)

#### Impact utilisateur

- Bouton de dispatch visible automatiquement quand des demandes sont prêtes
- Compteurs de badges plus précis et performants
- Création de références fournisseurs fonctionnelle
- Workflow d'approvisionnement plus fluide

---

## 2.1.11 - 2026-02-06

Stabilité: STABLE

### Optimisations de performance

#### Ce qui a changé

- **Chargement optimisé**: Les demandes d'achat ne se chargent que lorsque nécessaire (onglet Résumé)
- **Compteurs efficaces**: Le nombre de demandes s'affiche sans charger toutes les données
- **En-tête toujours visible**: L'en-tête de la page reste affiché même pendant le chargement
- **Données complètes**: Les demandes d'achat liées aux actions incluent maintenant tous les détails

#### Impact utilisateur

- Pages plus rapides à l'ouverture
- Meilleure réactivité de l'interface
- Navigation plus fluide entre les onglets

---

## 2.1.10 - 2026-02-06

Stabilité: STABLE

### Améliorations générales

#### Ce qui a changé

- **Demandes d’achat par action**: Les demandes liées sont à nouveau visibles dans la vue des actions
- **Données plus cohérentes**: Les listes utilisées dans les formulaires se chargent sans interruption

#### Impact utilisateur

- Vue action plus complète
- Expérience plus fluide

---

## 2.1.9 - 2026-02-05

Stabilité: STABLE

### Améliorations générales

#### Ce qui a changé

- **Création d’interventions**: L’application utilise la nouvelle API sans blocage
- **Listes d’actions**: Les catégories et sous-catégories se chargent correctement

#### Impact utilisateur

- Création d’intervention plus fiable
- Chargement plus fluide des listes

---

## 2.1.8 - 2026-02-04

Stabilité: STABLE

### Améliorations des demandes d'achat

#### Ce qui a changé

- **Détails visibles**: Les lignes de commande s’affichent correctement dans le détail des demandes
- **Affichage plus clair**: 3 situations distinctes (à qualifier, sans référence fournisseur, déjà dispatchée)
- **Statut fiable**: Le statut affiché correspond exactement à celui fourni par l’API

#### Impact utilisateur

- Accès immédiat aux informations utiles
- Moins de confusion sur l’état des demandes

---

## 2.1.7 - 2026-02-04

Stabilité: STABLE

### Corrections d'erreurs d'hydration

#### Ce qui a changé

- **Erreurs d'hydration corrigées**: Résolution des erreurs causées par des balises HTML imbriquées incorrectement dans les composants de la page Service Status
- **FragmentationCausesList corrigé**: Remplacement de `<Text as="p">` par `<Text as="span">` à l'intérieur du composant `Callout.Text`
- **SiteConsumptionTable corrigé**: Remplacement de `<Box as="p">` par `<Text as="span">` à l'intérieur du composant `Callout.Text`

#### Amélioration technique

- Élimination des erreurs de console liées aux balises `<p>` imbriquées dans `<p>`
- Élimination des erreurs de console liées aux balises `<div>` imbriquées dans `<p>`
- Conformité HTML améliorée et rendu côté serveur plus stable

#### Impact utilisateur

- Aucun changement visuel dans l'interface
- Page Service Status plus stable et sans erreurs de console
- Amélioration de la qualité du code

---

## 2.1.6 - 2026-02-01

Stabilité: STABLE

### Refonte complète de la documentation métier

#### Ce qui a changé

- **Documentation accessible à tous**: Le document REGLES_METIER.md a été entièrement réécrit pour être compréhensible par tous (techniques et non-techniques)
- **Système de stock clarifié**: Documentation du système crédit/dette (prise de pièce puis reconstitution via achat)
- **Workflow d'achat détaillé**: Ajout de la qualification des demandes, des références fournisseur et du cycle de vie des paniers
- **Suppression des concepts abandonnés**: Retrait du concept de sous-tâches qui n'est plus d'actualité

#### Nouveaux concepts documentés

- **Demandes d'achat qualifiées**: Processus de normalisation des nouvelles références
- **Références fournisseur et fabricant**: Liaison entre références internes et externes
- **Paniers fournisseur avec cycle de vie**: États critiques (taille, âge, urgence) et statut ASK
- **Exemples concrets**: Deux scénarios complets illustrant les workflows réels

#### Impact utilisateur

- Documentation beaucoup plus claire et accessible
- Meilleure compréhension des processus métier
- Exemples pratiques pour se former
- Alignement complet entre documentation et système réel

### Nettoyage du code inutilisé

#### Ce qui a été fait

- **Composants machine supprimés**: 8 composants non utilisés retirés du dossier components/machine
- **Hooks supprimés**: 4 hooks obsolètes retirés (useFilters, useRefresh, useMachineStats, useExportAPI)
- **Références nettoyées**: Commentaires obsolètes supprimés dans MachineDetail.jsx et ErrorNotification.jsx

#### Amélioration technique

- Réduction de la taille du code source
- Simplification de la maintenance
- Élimination de code mort

#### Impact utilisateur

- Application plus légère et plus rapide
- Aucun changement visible dans l'interface
- Base de code plus propre pour les futures évolutions

---

## 2.1.5 - 2026-01-29

Stabilité: STABLE

### Amélioration de la création d'actions

#### Ce qui a changé

- **Formulaire d'action amélioré**: L'ajout d'actions sur les interventions est plus rapide et plus fiable
- **Facteurs de complexité fonctionnels**: Vous pouvez maintenant sélectionner les facteurs de complexité sans erreur
- **Chargement optimisé**: Les données du formulaire se chargent plus rapidement

#### Amélioration technique (invisible pour vous)

- Migration vers une nouvelle architecture interne pour gérer les actions
- Résolution de problèmes de communication avec le serveur
- Correction de bugs d'affichage dans le formulaire

#### Impact utilisateur

- Le formulaire d'ajout d'action fonctionne maintenant parfaitement avec tous les champs
- Plus d'erreur lors de l'ouverture du formulaire
- Les actions sont enregistrées plus rapidement
- Tout le reste continue de fonctionner normalement

### Mise à jour de la documentation

- **Documentation métier mise à jour**: Le document REGLES_METIER.md est maintenant conforme à l'implémentation réelle
- **Ajout de détails techniques**: Nouveaux formats de données documentés pour les développeurs
- **Clarification des concepts**: Les facteurs de complexité sont maintenant documentés
- **Correction des exemples**: Tous les exemples utilisent le bon format de code d'intervention (INT-YYYYMMDD-NNN)

---

## 2.1.4 - 2026-01-28

Stabilité: STABLE

### Optimisation de l'affichage des interventions

#### Ce qui a changé

- **Liste des interventions allégée**: Les fiches déjà imprimées et archivées ne sont plus chargées automatiquement
- **Chargement plus rapide**: La page se charge beaucoup plus vite car elle ne récupère que les interventions actives
- **Performance améliorée**: Moins de données à afficher = navigation plus fluide

#### Amélioration technique (invisible pour vous)

- Ajout d'un filtre `printed=false` au niveau de l'API pour exclure les interventions archivées
- Le tri et le filtrage se font maintenant côté serveur au lieu du navigateur
- Réduction de la quantité de données transférées du serveur vers votre appareil

#### Impact utilisateur

- La page "Interventions" s'ouvre instantanément, même avec un historique volumineux
- Vous ne voyez que les interventions qui nécessitent encore votre attention
- Les interventions déjà imprimées (donc traitées et archivées) ne polluent plus l'affichage
- Navigation et recherche beaucoup plus rapides

---

## 2.1.3 - 2026-01-28

Stabilité: STABLE

### Nettoyage et consolidation du code

#### Ce qui a été fait

- **Nettoyage du code interne**: Suppression de fonctionnalités non utilisées pour alléger l'application
- **Simplification de la structure**: Retrait de composants et de hooks obsolètes qui n'étaient plus nécessaires
- **Optimisation de la taille**: L'application est maintenant plus légère et plus rapide à charger

#### Amélioration technique (invisible pour vous)

- Suppression de 8 composants machines qui n'étaient plus utilisés depuis la version 2.1.0
- Retrait de 4 hooks inutilisés (gestion d'exports, filtres, statistiques et rafraîchissement automatique)
- Mise à jour de la documentation interne pour refléter la nouvelle architecture
- Allègement du menu de navigation

#### Impact utilisateur

- Application plus rapide au démarrage
- Moins de code = moins de risques de bugs
- Aucun changement visible dans l'interface : tout fonctionne comme avant, en mieux
- Préparation pour les futures évolutions avec une base de code plus propre

---

## 2.1.2 - 2026-01-27

Stabilité: STABLE

### Corrections d'affichage et optimisations

#### Ce qui a été corrigé

- **Historique des interventions**: Les changements de statut apparaissent maintenant dans la chronologie
- **Page État du service**: Se charge correctement sans message d'erreur
- **Affichage des données**: Les informations se chargent plus rapidement

#### Amélioration technique (invisible pour vous)

- Les détails d'une intervention se chargent en une seule fois (au lieu de deux chargements successifs)
- Suppression des doublons dans la façon de récupérer les informations
- Nettoyage du code inutilisé pour alléger l'application

#### Impact utilisateur

- Navigation plus fluide : cliquer sur une intervention affiche tout immédiatement
- Page "État du service" fonctionne sans erreur
- L'historique complet des statuts est visible dès l'ouverture d'une intervention
- Pas de ralentissement lors de la consultation des statistiques

---

## 2.1.1 - 2026-01-26

Stabilité: STABLE

### Corrections et consolidation

#### Ce qui a été corrigé

- **Page équipements**: Les interventions s'affichent maintenant correctement
- **Détails équipement**: Requêtes API optimisées, pas de boucles inutiles
- **Affichage tableau**: Utilisation cohérente des composants communs (en ligne avec le reste de l'app)
- **Gestion des erreurs**: Messages d'erreur API plus clairs

#### Amélioration technique (invisible pour vous)

- Restructuration des appels API pour plus de fiabilité
- Code nettoyé et simplifié (moins de lignes, plus clair)
- Meilleure cohérence dans la façon d'appeler l'API tunnel-backend

#### Impact utilisateur

- Navigation plus fluide entre la liste et le détail des équipements
- Pas de ralentissement lors du chargement d'un équipement
- Moins de risques d'erreur lors de la consultation des interventions

---

## 2.1.0 - 2026-01-25

Stabilité: STABLE

### Nouvelle page Équipements - Parc optimisé

#### Ce que vous pouvez faire maintenant

- Consulter la liste complète des équipements avec vue d'ensemble de leur santé (ok, maintenance, alerte, critique)
- Filtrer rapidement par code ou nom d'équipement
- Cliquer sur un équipement pour voir:
  - Toutes ses interventions (passées et actuelles)
  - Son parent et ses enfants (hiérarchie complète)
  - Ses statistiques d'interventions (par statut et priorité)
- Voir instantanément si un équipement a des problèmes via le badge santé coloré

#### Améliorations de performance

- Les pages se chargent beaucoup plus rapidement (cache local des équipements)
- Pas de ralentissements lors de la navigation entre équipements
- Les statuts reflètent EXACTEMENT votre configuration serveur (zéro données hardcodées)

#### Impact métier

- Les techniciens ont une vue claire de l'état du parc
- Moins de confusion sur les statuts (une seule source de vérité)
- Accès rapide à l'historique d'un équipement sans rechargement

#### Suppression

- Ancienne page Machines (remplacée par Équipements)
- Tous les composants machines associés

---

## 2.0.0 - 2026-01-25

Stabilité: BETA (architecture backend)

### Décisions prises au backend - Fiabilité accrue

#### Ce qui a changé pour vous

- Les statuts équipements (ok/maintenance/alerte/critique) sont maintenant calculés par le serveur
- Les statistiques d'interventions sont toujours à jour (générées automatiquement)
- Les statuts d'intervention proviennent de votre configuration serveur (pas hardcodés)

#### Avantage utilisateur

- Plus de synchronisation manuelle frontend/backend
- Affichage fiable et cohérent partout dans l'app
- Moins de bugs liés à des données désynchronisées

---

## 1.11.7 - 2026-01-22

Stabilité: STABLE

### Corrections Procurement

- Export CSV fonctionne correctement
- Interface nettoyée et plus rapide

## 1.11.6 - 2026-01-21

Stabilité: STABLE

### Demandes d'achat - Affichage unifié

- Les demandes d'achat s'affichent de manière cohérente partout (Procurement et détails interventions)
- Les numéros de paniers sont visibles sur toutes les demandes
- Chargement optimisé (1 requête au lieu de 116)

## 1.11.5 - 2026-01-21

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Détection fiable des lignes jumelles (même DA chez plusieurs fournisseurs)
- Badge jumelles affiche uniquement les lignes sélectionnées en conflit
- Validation bloquante si ligne jumelle déjà commandée (CLOSED/RECEIVED/ACK/CANCELLED)

### 🧱 Stabilisation / Dette technique

- Centralisation logique de détection des jumelles via `extractTwinLinesForLine()`
- Groupement par `purchase_request.id` comme clé de détection
- Filtrage strict sur `is_selected=true` pour éviter faux positifs
- Synchronisation badge/hook de validation pour cohérence affichage

### 🧩 Composants / Modules concernés

- src/components/purchase/orders/OrderLineTable/helpers.js (extractTwinLinesForLine)
- src/hooks/useTwinLinesValidation.js
- src/components/purchase/orders/TwinLinesValidationAlert/

### ⚠️ Points de vigilance

- Nécessite vidage cache PWA pour voir changements (service worker)
- Validation stricte : impossible de sélectionner si jumelle en statut fermé

## 1.11.4 - 2026-01-20

Stabilité : 🟡 en consolidation

### 🎯 Impact fonctionnel

- Les statuts de vos demandes d'achat sont toujours à jour

### 🧱 Stabilisation / Dette technique

- Dérivation automatique du statut depuis les commandes fournisseurs → suppression des incohérences
- Sécurisation des transitions de statut avec documentation lifecycle verrouillée
- Correction du calcul de statut multi-fournisseur → seules les lignes sélectionnées comptent

### 🧩 Composants / Modules concernés

- src/lib/purchasing/purchaseRequestStatusUtils.js (nouveau)
- src/lib/purchasing/orderReceptionUtils.js (nouveau)
- src/lib/purchasing/lineCalculationUtils.js (nouveau)
- src/pages/Procurement.jsx
- src/components/purchase/requests/purchaseRequestRow.helpers.jsx
- src/lib/api/adapters/directus/stock/datasource.ts
- src/lib/api/adapters/directus/stock/mapper.ts
- docs/features/SUPPLIER_ORDER_LIFECYCLE.md (nouveau)
- docs/tech/PURCHASE_REQUEST_STATUS_REFACTOR.md (nouveau)
- db/schema/migrations/20260120_add_trigger_update_purchase_on_order_received.sql (nouveau)

### ⚠️ Points de vigilance

- Le champ `purchase_request.status` en base sera progressivement déprécié au profit de la dérivation
- Handlers de changement de statut manuel (handleStatusChange) supprimés du code frontend
- La réception automatique via trigger DB nécessite PostgreSQL (testé en dev uniquement)

## 1.11.3 - 2026-01-20

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Le statut des paniers commandés peut être clôturé (dropdown déverrouillée en ORDERED/RECEIVED)

### 🧱 Stabilisation / Dette technique

- Verrouillage limité aux paniers clôturés (CLOSED), maintien du lock sur les lignes

### ⚠️ Points de vigilance

- Les lignes restent non éditables en statut ORDERED/RECEIVED (logique métier conservée)

## 1.11.2 - 2026-01-20

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Sélection des lignes de commande dans les paniers fournisseurs persistée correctement

### 🧱 Stabilisation / Dette technique

- Patch de sélection : fallback sur les lignes chargées localement lors du toggle

### ⚠️ Points de vigilance

- Vérifier le statut RECEIVED après sélection : au moins une ligne doit être cochée

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
