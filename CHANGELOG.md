# Changelog

## [3.36.0] — 2026-05-18

### Journal d'audit

- **Traçabilité des décisions** : chaque modification sensible (changement de statut, d'affectation, validation…) déclenche une invite demandant à l'opérateur de saisir la raison de sa décision
- **Boîte de dialogue de confirmation** : avant d'appliquer toute action impactante, une fenêtre recense les raisons prédéfinies et permet d'en saisir une libre — l'action n'est validée qu'après confirmation explicite
- **Consultation des logs dans l'Admin** : un nouvel onglet *Audit* liste l'ensemble des événements enregistrés, filtrable par type de décision et avec pagination

### Interventions — alertes d'urgence

- **Badge d'urgence automatique** : si la date de prochaine échéance d'une intervention est dépassée ou très proche, un badge rouge *Urgent* apparaît dans les listes, le briefing et les volets de détail
- Aucune configuration requise : le calcul est entièrement automatique à partir des données existantes

### Briefing — volet Demandes d'Intervention

- **Volet détail dédié** : cliquer sur une demande d'intervention dans le Briefing ouvre un volet latéral complet avec toutes les informations de la demande, sans quitter la page

### Correctifs

- Comptage correct des tâches et demandes d'achat dans les tuiles du Briefing
- Lecture des équipements depuis toutes les sources dans le panneau jour du Planning

---

## [3.35.0] — 2026-05-11

### Briefing — nouvelle page dédiée

- **Page Briefing** accessible depuis le menu : liste des situations actives à gauche, volet de détail à droite
- **Volet détail intervention** : en-tête complèt (code, statut, priorité, type, machine, actions, temps, DAs en attente), tableau des tâches avec réordonnancement ↑↓
- **Édition inline des tâches** depuis le volet Briefing : échéance (clic sur la date → champ calendrier) et technicien assigné (clic sur l'avatar → sélecteur) — sauvegarde immédiate via PATCH
- **Demandes d'intervention** affichées dans leur propre section du Briefing, avec volet détail DI cléquable
- **Ajout de tâche** inline directement depuis le volet détail, sans quitter la page

### Accueil (HomeSplit) — améliorations

- **Édition inline des tâches** dans le volet Tâches : échéance et affectation modifiables en un clic
- **Modal saisie d'action** : depuis n'importe quelle tâche du volet Tâches, bouton "Logger du temps" ouvre la modal avec l'intervention présélectionnée
- **Demande d'achat depuis le planning** : bouton DA dans le panneau jour du calendrier, sans naviguer vers une intervention

### Stock — refonte interface

- **Layout master-détail** : liste filtrée à gauche (familles, recherche, pagination), fiche détail à droite — même modèle que la page Fournisseurs
- **Onglet Modèles de pièces** et **onglet Familles** intégrés dans la page Stock
- Composant `MasterDetailLayout` partagé entre Stock, Fournisseurs et Fabricants

### Planning — panneau jour

- **ActionForm refactorisé** : logique de soumission isolée dans `useActionSubmit`, panneau jour découpé en colonnes gauche/droite pour une meilleure lisibilité
- **Demande d'achat spontanée** depuis la colonne gauche du panneau jour, sans sélectionner une intervention

---

## [3.34.0] — 2026-05-06

### Accueil — tableau de bord split Planning / Briefing

- **Nouvelle page d'accueil** en deux volets côte à côte : Planning à gauche, Briefing à droite
- **Volet Planning** : vue semaine avec sélecteur de technicien, interventions planifiées, création d'action directe depuis le panneau jour
- **Volet Briefing** : résumé opérationnel en temps réel — demandes d'intervention en attente, interventions ouvertes, tâches assignées avec leurs statuts
- **Badges de situation** (`SituationBadges`) sur chaque item du briefing pour identifier rapidement l'état (urgent, en retard, en cours…)
- **Barre de progression des tâches** (`TaskProgressLine`) sur chaque intervention du briefing : avancement des tâches d'un coup d'œil
- **Bouton "Demande d'achat"** en en-tête de l'accueil : création d'une demande d'achat spontanée sans avoir à naviguer dans une intervention

---

## [3.33.1] — 2026-05-04

### Correctif — insensibilité à la casse des rôles utilisateur

Les rôles sont stockés en minuscule en base de données (`admin`, `resp`, `tech`, `ope`) alors que les comparaisons attendaient des majuscules, provoquant des refus d'accès ou des affichages incorrects.

- **`RequireRole`** — `user.role` normalisé en majuscule avant comparaison (accès route `/admin`)
- **`menuConfig.getMenuItems`** — `userRole` normalisé en majuscule pour le filtrage du menu
- **`AdminUsersTable`** — badge couleur et libellé du rôle utilisent `role_code?.toUpperCase()`
- **`AdminUserConfirmModals`** — filtre d'exclusion du rôle actuel et affichage normalisés en majuscule
- **`useAdminUsers`** — `filterRole` envoyé en minuscule à l'API pour correspondre aux valeurs BDD
- **`TasksTab` (intervention)** — `canSkipObligatory` utilise `user.role.toUpperCase()`
- **`GammeProgressBlock`** — `canSkipObligatory` utilise `user.role.toUpperCase()`

---

## [3.33.0] — 2026-05-04

### Administration — matrice de permissions, clés API, référentiel Actions

- **Matrice rôles × permissions** : tableau complet `AdminRolePermissionsMatrix` — toutes les permissions visibles d'un coup avec une colonne par rôle ; toggle par cellule avec log d'audit
- **Clés API machine-to-machine** : création, activation/désactivation, révocation dans `AdminSecurityApiKeys` — le secret est affiché une seule fois à la création
- **Synchronisation catalogue d'endpoints** : bouton "Sync Endpoints" dans l'onglet Rôles pour mettre à jour le catalogue depuis les routes backend
- **Référentiel Actions** : consultation et ajout de sous-catégories inline dans `AdminRefActionsSection`
- **Tableau utilisateurs** : filtres par rôle et par statut, actions rapides (modifier, changer rôle, activer/désactiver, reset mot de passe) dans `AdminUsersTable`
- **Bouton "Réparer les DIs"** dans l'onglet Demandes d'Intervention → `POST /intervention-requests/repair`
- **Formulaires de création de tâche** convertis de modal en inline dans les 3 contextes : onglet Tâches d'intervention, page globale des tâches, `ActionTaskSection` (planning)
- **Sélecteur de technicien pilote** dans le formulaire de création d'intervention : `fetchActiveUsers` chargé via `useEffect` dans `ActionFormContext` et `InterventionSelector`

---

## [3.31.0] — 2026-04-28

### Interventions fermées — verrouillage complet

- Calcul de `isLocked` sur la page détail d'intervention (`ferme` ou `cancelled`)
- Dropdown statut et priorité désactivés et grisés quand l'intervention est verrouillée
- Onglet Actions : bouton "+ Action" masqué, formulaire d'édition et formulaire DA inaccessibles
- Onglet Tâches : bouton "Nouvelle tâche" masqué, boutons "Ignorer" désactivés
- Onglet Achats : boutons Modifier / Supprimer masqués sur les DA
- Onglet Fiche : bouton "Marquer comme imprimée" masqué

### Messages d'erreur — normalisation

- `extractApiErrorMessage` partagé sur tous les formulaires et hooks : extrait `response.data.detail` > `errors[0].message` > `message` > fallback
- `ErrorState` robuste : accepte `string | object | Error`, ne crash plus sur les objets Axios bruts
- Les messages d'erreur FastAPI (ex : "Tâche déjà clôturée — impossible de la skipper") s'affichent maintenant avec leur texte exact

---

## [3.30.0] — 2026-04-27

### Tâches — nouveau module

- **`TasksPage`** : nouvelle page de liste des tâches avec filtrage (statut, intervention) et regroupement
- **`TasksTab`** : onglet Tâches intégré dans la fiche intervention
- **`TaskCreateInlineForm`** : formulaire de création rapide depuis `ActionForm`
- **`TaskDetail`** : fiche de détail/édition d'une tâche (statut, `skip_reason`, commentaire)
- **Badge sidebar** : compteur de tâches non assignées alimenté par le sommaire tableau de bord (`unassigned_tasks_count`)
- **`ActionForm`** : sélection et création de tâches inline, gestion du statut et du motif de saut
- **`useTasks`** : hook centralisé pour l'état et les appels API des tâches
- Nouveau endpoint API : `/tasks` mappé dans `src/api/tasks.js`
- Dashboard summary polled pour `unassigned_tasks_count` → badge dynamique dans `SidebarMenuItem`

### Nettoyage

- Suppression de la liaison `gamme_step_validations` dans l'intégration API des tâches — remplacée par le modèle de tâches dédié

---

## [3.28.0] — 2026-04-15

### Planning — panneau jour inline

- Le clic sur un jour du planning ouvre désormais un panneau latéral directement sous la grille, sans popup flottante — l'équipement, les interventions et le formulaire d'action sont accessibles en deux colonnes sans quitter la vue
- La recherche d'équipement affiche maintenant les compteurs **"inter. ouvertes"** et **"DI en attente"** pour identifier rapidement la criticité avant de sélectionner
- Les sélecteurs de type d'action et de facteur de complexité se chargent correctement dans ce nouveau contexte

### Clôture d'intervention à l'enregistrement d'une action

- Après validation d'une action, une confirmation apparaît : **"L'intervention est-elle terminée ?"**
- Deux choix : clôturer l'intervention immédiatement, ou la laisser ouverte pour continuer à y ajouter des actions
- Si des étapes de gamme sont encore en attente, la clôture est bloquée et un message explicatif est affiché
- Ce mécanisme ne s'active pas si l'intervention est déjà fermée

### Fiche équipement — données de maintenance préventive

- Nouvel onglet **Préventif** sur chaque fiche équipement : plans de maintenance actifs avec leur périodicité, prochaine occurrence planifiée, et résumé des occurrences (en attente, générées, passées)
- Les **demandes d'intervention ouvertes** liées à l'équipement sont maintenant visibles dans l'onglet Informations, avec leur statut, description et date de création

---

## [3.27.0] — 2026-04-13

### Gamme de maintenance & étapes préventives

- **Bandeau de progression gamme** : remplacement du bloc complet `GammeProgressBlock` dans l'onglet Actions par un bandeau compact (barre de progression + compteur + badge statut), cohérent avec le style des autres bandeaux informatifs
- **Étapes validées dans les action cards** : affichage des étapes gamme validées/ignorées directement dans chaque `ActionItemCard`, sous les demandes d'achat liées (même pattern visuel)
- **Sélection des étapes dans ActionForm** : lors de la création d'une action depuis le planning libre, si l'intervention sélectionnée possède un plan de maintenance, les étapes en attente se chargent automatiquement et peuvent être cochées pour validation simultanée
- **Chargement dynamique des steps** : `ActionForm` détecte `plan_id` sur l'intervention sélectionnée et charge les étapes sans passer par le composant parent

### ActionForm — composant unifié

- **Prop `showContext`** : nouvelle prop (défaut `true`) qui masque la section sélecteur équipement/intervention quand l'intervention est déjà fixée par le contexte — élimine deux champs verrouillés visuellement inutiles
- **Unification planning / détail** : `ActionsTab`, `ActionItemCard` et `InterventionPlanningTab` utilisent désormais le même `ActionForm` avec `showContext=false` quand `interventionId` est connu
- **Correction boucle infinie** : correction d'un `Maximum update depth exceeded` sur les checkboxes d'étapes gamme causé par `onClick + stopPropagation` sur un `Checkbox` Radix UI contrôlé — remplacé par un `<label>` natif englobant

### API & mapping

- **`gammeStepValidations`** mappé dans `mapActionResponse` (`actions.js`) et dans le mapper de liste (`interventions.js`) — disponible dès le chargement initial sans requête supplémentaire
- **Robustesse champ backend** : lecture de `gamme_step_validations || gamme_steps` pour absorber l'incohérence de nommage entre les deux endpoints

### Nettoyage de code

- Suppression de `TimelineItem.jsx` — composant mort remplacé depuis longtemps par `TimelineItemRenderer`
- Suppression du dossier `src/components/layout/layout/` — 7 fichiers dupliqués avec imports vers des paths obsolètes
- Fusion des imports `@radix-ui/themes` dupliqués dans `ActionItemCard`
- `InterventionPlanningTab` simplifié : suppression du chargement redondant des steps gamme, délégué à `ActionForm`

---

## [3.26.0] — formulaire acceptation demande, sélecteur service

- Formulaire d'acceptation des demandes d'intervention avec sélecteur de service
- Gestion du flow de création intervention depuis une demande système

## [3.25.0] — création équipements, statut, onglet URL, correction navigation

- Formulaire de création d'équipement (`EquipementCreateForm`) intégré dans `EquipementTable`
- Gestion du statut équipement et filtrage par classe
- Navigation par onglet persistée dans l'URL

## [3.24.1]

- Correction mineure sur la gestion des actions

## [3.24.0]

- Formulaire d'action avec validation manuelle du temps passé
- Plage horaire (action_start / action_end) comme alternative à time_spent

## [3.23.0]

- Onglet Planning avec vue semaine, filtre technicien, création d'action directe
- Sélecteur d'intervention par équipement avec flow de création inline
