# Changelog

## [1.4.0] — 12 avril 2026

Unification des formulaires plein écran, composant `BottomBar`, sélecteur de service pour les demandes d'intervention, et normalisation de l'UI.

---

### Demandes d'intervention

- **Champ service** : `demandeur_service` (texte libre) remplacé par `service_id` (sélecteur via `GET /services`) dans `DIForm` et `DIInlineForm` (ActionForm)
- **`DIForm`** : refonte complète aux normes du pattern formulaire plein écran — overlay `fixed`, header avec icône, labels bold avec icône, `BottomBar` + `BottomBtn`, `useFormGuard`
- Affichage rétrocompatible : `service?.label ?? demandeur_service` dans `DICard`, `InterventionDetailPage`, `InterventionRequestsPage`

### Composants UI

- **`BottomBar` + `BottomBtn`** (`src/components/ui/BottomBar.jsx`) : barre d'action fixe en bas d'écran, 3 variantes (primary / secondary / danger), spinner intégré
- **`SheetPicker`** (`src/components/ui/SheetPicker.jsx`) : sélecteur générique via bottom-sheet réutilisable
- **`ListStatus`** (`src/components/ui/ListStatus.jsx`) : gestion unifiée des états loading / error / empty dans les listes
- **`ErrorBoundary`** : composant de garde d'erreur React

### Équipements

- Affichage du badge `statut` (couleur dynamique) dans la carte et la fiche détail
- Champ `parent` affiché dans le détail équipement

### Standards & architecture

- `CLAUDE.md` : documentation complète du pattern formulaire plein écran (variante A remplacement / variante B overlay), règles de labels, `BottomBar`, `useFormGuard`
- `BottomBar` adopté sur tous les formulaires et vues liste (`InterventionsScreen`, `StockPage`, `InterventionRequestsPage`)
- `PurchaseRequestForm` et `StockPage` enrichis (filtres famille/sous-famille, gestion paginée)

---

## [1.3.0] — 10 avril 2026

Ajout du module Équipements (liste, détail, recherche), refonte visuelle de la page d'accueil et de connexion, amélioration de la recherche dans la liste des interventions.

---

### Équipements (nouveau module)

- **`EquipementsPage`** : liste des équipements avec recherche par nom/code et pagination
- **Détail équipement** : statut de santé, interventions liées, affichage des badges de priorité
- **API** : fonctions `getEquipements` / `getEquipement` dans `src/api/equipements.js`
- **Hooks** : `useEquipements` (liste + recherche) et `useEquipementDetail` (fiche détail)
- **QR Code** : `QrCodePage` gère désormais la lecture d'un UUID pour rediriger vers la fiche équipement

### Interventions

- **Recherche en temps réel** dans `InterventionsScreen` : indicateur de frappe (typing indicator), debounce, mise à jour dynamique des résultats

### UI / Branding

- `LoginPage` : nouveau logo Tunnel et mise en page remaniée
- `HomePage` : refonte du branding et de la disposition
- `BottomNav` : styles mis à jour, icône et route équipements intégrées
- Assets de marque ajoutés : `Tunnel_Logo.png`, SVGs (`tunnel-logo-basic`, `tunnel-logo-light`, `sidebar-mark`)

### Navigation

- Nouvelles routes pour `EquipementsPage` (liste et détail)
- `StockPage` enrichi avec affichage des stocks et gestion d'état

---

## [1.2.0] — 8 avril 2026

Refonte du composant `ActionCard` avec navigation, unification du formulaire d'action en modal et page complète, et nettoyage des composants inutilisés.

---

### Planning

- **ActionCard cliquable** : les cartes d'action dans le planning sont désormais des liens vers la page de détail de l'intervention
- **Variante contextuelle** (`variant="planning"` / `variant="detail"`) : `ActionCard` adapte son contenu selon le contexte d'affichage
  - Vue planning : affiche le code et le titre de l'intervention, résumé compact (horaires, temps, compteur DA)
  - Vue détail : masque le code/titre (déjà dans l'en-tête), affiche une ligne méta (date · horaires · technicien · temps) et le détail de chaque DA
- Correction de l'affichage du code et du titre de l'intervention dans le planning (support des champs plats de l'API)
- Suppression du tiret `—` affiché à tort quand aucune plage horaire n'est définie

### Interventions

- **`ActionForm` unifié** : le formulaire de création d'action supporte désormais un prop `mode` (`'modal'` | `'page'`) :
  - `modal` : superposition plein écran (comportement précédent)
  - `page` : remplit toute la page, bouton retour `ChevronLeft`, padding bas sécurisé
- En mode page, l'intervention par défaut (`defaultIntervention`) dérive automatiquement l'équipement et le verrouille
- Suppression de la valeur par défaut de la complexité (champ vide au départ)
- `AddActionPage` simplifié : wrapper léger autour de `ActionForm mode="page"`

### Nettoyage

- Suppression de `src/pages/planning/ActionForm.jsx` (re-export devenu inutile)
- Suppression de `src/components/achats/DAForm.jsx` (composant non utilisé)

---

## [1.1.1] — 18 mars 2026

Mise à jour des dépendances de build et ajout de la configuration Docker pour le déploiement en production.

---

### Infrastructure

- Ajout du `Dockerfile` multi-stage (build Node 20 → serve Nginx 1.27)
- Ajout du `docker-compose.yml` mono-service, port lié à `127.0.0.1` (derrière tunnel Cloudflare)
- Configuration Nginx pour SPA React : fallback `index.html`, compression gzip, cache long sur les assets Vite
- Ajout du `.dockerignore`

### Dépendances

- `vite` mis à jour vers la dernière version stable
- `vite-plugin-pwa` mis à jour vers la dernière version stable

---

## [1.1.0] — 18 mars 2026

Amélioration du détail des interventions, statuts dynamiques et intégration des demandes d'achat dans le planning.

---

### Planning

- Bouton **+ DA** sur chaque action du planning avec badge coloré indiquant le nombre de demandes d'achat et leur état d'avancement
- Ouverture du formulaire de création de DA directement depuis le planning

---

### Interventions

- **Statuts dynamiques** : les statuts disponibles et leurs couleurs sont désormais chargés depuis le serveur (plus de valeurs codées en dur)
- Correction de l'affichage du statut actuel dans l'en-tête (visible même sans couleur définie)
- Section **Demande liée** dans le détail d'une intervention :
  - Affiche la DI d'origine avec code, statut coloré, demandeur, service et description
  - Empty state explicite si l'intervention a été créée manuellement (sans DI associée)

---

## [1.0.0] — 18 mars 2026

Première version de l'application mobile Tunnel. Cette version couvre les besoins du terrain : suivi des interventions, saisie des actions et gestion des demandes d'achat.

---

### Accueil

- Page d'accueil avec indicateur de santé du serveur en temps réel
- Accès rapide aux sections principales (Interventions, Planning, Achats)

---

### Planning

- Vue semaine du planning avec navigation par jour
- Saisie d'une action depuis le planning : date, plage horaire, type, description, complexité
- Création en cascade depuis le formulaire d'action :
  - Création d'une DI (demande d'intervention) si aucune n'existe
  - Création d'une intervention liée à la DI
- Sélection de l'équipement avec recherche et indicateur de santé machine
- Champs pré-remplis et verrouillés quand le contexte est déjà connu (équipement, intervention)
- Durée calculée automatiquement à partir de la plage horaire

---

### Interventions

- Liste des interventions avec filtres et recherche
- Détail d'une intervention : statut, actions réalisées, statistiques (heures, DA, nombre d'actions)
- Changement de statut depuis le détail (Prendre en charge, Mettre en attente, Marquer résolu, Clôturer)
- Ajout d'une action directement depuis le détail de l'intervention
- Affichage des demandes d'achat rattachées à chaque action avec leur statut en temps réel

---

### Demandes d'achat (DA)

- Création d'une DA depuis n'importe où : page Achats, détail d'intervention, ou depuis une action
- Recherche d'articles dans le catalogue stock (référence, nom, niveau de stock, emplacement)
- Mode **demande spéciale** si l'article n'est pas dans le catalogue (saisie libre)
- Sélection de l'urgence (Normal / Élevée / Critique) et de l'unité
- Liaison automatique à une action quand créée depuis le détail d'une intervention
- Liste des DA avec statuts dérivés (À qualifier, À dispatcher, Commandé, Reçu, etc.)

---

### Interface générale

- Application mobile-first (optimisée pour utilisation sur smartphone en atelier)
- Navigation par onglets en bas d'écran
- Sélecteurs sous forme de tiroirs (bottom-sheet) sur toute l'application
- Confirmation avant de quitter un formulaire avec des données saisies
- Recherche avec debounce et états d'attente explicites (chargement, aucun résultat)
