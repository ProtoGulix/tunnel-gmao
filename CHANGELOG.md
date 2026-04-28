# Changelog

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
