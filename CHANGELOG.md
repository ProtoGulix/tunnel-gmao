# Changelog

## [3.54.0] — 2026-07-24

### Admin — gestion de l'audit

- Nouvel onglet Admin → Audit → Règles : gestion des règles routine/sensible par entité et champ (auparavant codées en dur côté serveur)
- Nouvel onglet Admin → Audit → Raisons : création, modification et activation/désactivation des raisons affichées dans le picker de justification (audit)

### Détail d'intervention

- Le PDF affiché dans le détail d'une intervention se réinitialise correctement en changeant d'intervention (il restait affiché à tort)
- Corrigé une collision de paramètre d'URL entre l'onglet actif de la liste des interventions et celui du détail affiché en mode embarqué

## [3.53.0] — 2026-07-19

### Demandes d'achat — navigation et affichage

- La demande d'achat sélectionnée reste maintenant visible dans l'adresse de la page : possible de partager le lien ou d'utiliser le bouton précédent du navigateur pour y revenir directement
- Le détail d'une demande d'achat indique désormais, pour chaque panier fournisseur concurrent, celui qui a été retenu : une coche verte identifie la ligne choisie, les autres s'affichent grisées
- Suppression des colonnes « Délai » et « Reçu », devenues redondantes, dans le tableau des paniers fournisseurs d'une demande d'achat ; la colonne « Qté allouée » est renommée « Quantité »
- Le commentaire associé au statut d'une ligne de commande s'affiche désormais au survol, pour un tableau plus compact
- Chargement des compteurs par statut optimisé (une seule requête au lieu de deux)

## [3.52.0] — 2026-07-17

### Nouveautés — badge sur la version

- Un badge « Nouveau » apparaît désormais à côté du numéro de version en bas de la barre latérale lorsqu'une mise à jour contient des changements pas encore consultés
- Cliquer sur la version affiche le détail des nouveautés depuis votre dernière visite ; le badge disparaît une fois consulté

## [3.51.0] — 2026-07-14

### Fournisseurs — nouvel onglet « Références fournisseur »

- L'onglet Fournisseurs affiche désormais toutes les références fournisseur du catalogue dans un même tableau, avec un filtre pour ne voir que celles d'un fournisseur précis
- Le détail d'une référence sélectionnée montre la liaison complète : référence interne, fabricant et référence fabricant, conditions d'achat
- Nouveau bloc « Historique des prix » : prix moyen, minimum, maximum et dernier prix obtenu, calculés à partir des commandes déjà passées
- Le prix affiché sur une référence fournisseur n'est plus une valeur saisie à la main : il est désormais calculé automatiquement à partir de l'historique réel des commandes
- Accès rapide à la fiche complète d'un fournisseur depuis le détail d'une référence, sans quitter l'écran

### Stock — fiche pièce retravaillée

- Les références fabricant et leurs fournisseurs s'affichent maintenant dans des tableaux clairs, chacune avec sa propre section toujours visible (plus besoin de déplier)
- Ajout d'un fournisseur à une référence fabricant simplifié, avec la possibilité d'en lier plusieurs
- La création et la modification d'une pièce se font maintenant dans une fenêtre dédiée, y compris depuis la qualification d'une demande d'achat (formulaire unique et plus complet à la création : plusieurs références fabricant et fournisseurs possibles dès la création)
- Le bloc « Quantité en stock » indique clairement que le suivi des quantités n'est pas encore disponible, plutôt que d'afficher une valeur à zéro trompeuse ; les mentions « Rupture » / « Stock bas » ont été retirées des listes tant que cette fonctionnalité n'existe pas

### Achats — commandes fournisseur et sessions de qualification

- Nouveau composant de liste pour les commandes fournisseur, avec recherche
- Nouveaux écrans pour regrouper les demandes d'achat par session et faciliter leur traitement en lot
- Mise en évidence directe des demandes d'achat concernées par une action, depuis la page d'accueil
- Sauvegarde automatique lors de la négociation des lignes de commande fournisseur

### Interface — mise en page

- Ajustements de mise en page sur les écrans Interventions, Préventif, Achats et Stock pour un meilleur rendu sur différentes tailles d'écran

## [3.50.0] — 2026-07-08

### Interventions — Suppression d'une action

- Une action peut désormais être supprimée depuis le planning de la page d'accueil et depuis la vue détail d'intervention
- Confirmation inline avant suppression définitive
- Suppression bloquée si une demande d'achat liée à l'action a déjà été dispatchée (mutualisée dans un panier fournisseur) — le bouton est alors désactivé avec une explication au survol

### Interventions — Vue détail et liste en mode « master-detail »

- La page liste des interventions adopte un layout maître-détail avec recherche, et peut afficher le détail d'une intervention en mode intégré (embedded) sans changer de page
- Rafraîchissement des données plus fiable dans le détail d'intervention (hook `useInterventionDetail`)

### Demandes d'achat — Comparateur de paniers fournisseurs

- Nouvel onglet comparateur : sélection de deux paniers fournisseurs, mise en correspondance automatique des lignes par article, prix et délais éditables en ligne avec mise en évidence du meilleur choix en temps réel
- Création de tâche depuis la coordination : mise à jour immédiate de l'affichage sans recharger toute la liste

### Correctifs

- Stock : le bouton de création depuis l'onglet pièces fonctionne à nouveau correctement

---

## [3.49.1] — 2026-06-19

### Correctifs

- Le bouton d'annulation dans le formulaire de création de tâche s'affiche à nouveau correctement

---

## [3.49.0] — 2026-06-19

### Planning — Création d'intervention depuis le planning journalier

- La création d'une nouvelle intervention se fait maintenant sans quitter la vue planning : la colonne gauche passe en mode recherche d'équipement et affiche les demandes d'intervention ouvertes, pendant que le formulaire de création s'affiche à droite en temps réel
- Il est possible de sélectionner une DI existante depuis la liste ou d'en créer une à la volée directement dans le formulaire
- Après création, la recherche se recale automatiquement sur l'équipement de la nouvelle intervention pour retrouver les tâches immédiatement

### Demandes d'achat — Affichage des références pièces

- Les désignations, références fabricant et noms fabricant s'affichent correctement dans les formulaires de demande d'achat lors de la sélection d'une pièce du catalogue V4

### Correctifs

- Le détail d'une demande d'intervention dans le briefing affiche à nouveau l'intervention liée sans clignoter ni disparaître
- La création et la suppression de demandes d'achat depuis une action d'intervention fonctionnent correctement avec les pièces du catalogue V4

---

## [3.48.0] — 2026-06-17

### Stock — Correctif affichage liste pièces

- **`PartRow`** : la liste utilisait `part.manufacturer_refs` (champ absent de `PartListItem`) — remplacé par les champs plats `preferred_manufacturer_name`, `preferred_manufacturer_ref`, `preferred_label` retournés par l'endpoint `/parts`
- Les noms fabricant, références et désignations s'affichent correctement dans la liste

### Demandes d'achat — Import CSV

- **Nouvel assistant d'import CSV** (`CsvImportWizard`) pour créer des demandes d'achat en masse depuis un fichier CSV
- Détection automatique des colonnes (référence article, quantité, fournisseur, commentaire)
- Validation ligne par ligne avec aperçu des erreurs avant import
- Intégré dans la page Demandes d'achat

---

## [3.47.0] — 2026-06-16

### Demandes d'achat — Catalogue pièces V4

- **Formulaire DA** : la sélection d'article utilise désormais le catalogue V4 (`/parts`) avec références internes `P000xxx`, refs fabricant et stock en temps réel
- **Qualification** : l'édition d'une DA associe un `part_id` V4 (plus de `stock_item_id`)
- **Paniers fournisseurs** : les lignes de commande affichent les refs V4 (badge bleu monospace `P000xxx`) au lieu des refs legacy
- **Bannière dispatch** simplifiée — la confirmation est dans le bouton header (AlertDialog), la bannière n'affiche que le résultat
- **Erreurs de dispatch** détaillées : nom de l'article + message lisible, expandables au clic
- **Compteur dispatch** : polling automatique 30 secondes + rafraîchissement à la création de DA et au changement d'onglet

---

## [3.46.0] — 2026-06-15

### Demandes d'achat — Bouton dispatch dans l'en-tête de page

- **Bouton "Dispatcher (N)"** déplacé depuis le bandeau de la liste vers le header de page — visible en permanence quel que soit le filtre actif sur les demandes
- **Compteur temps réel** : le nombre de demandes prêtes à dispatcher est lu directement depuis l'endpoint `/purchase-requests/facets`, sans dépendre du filtre courant ni de la fenêtre de date des statistiques
- **Dialog de confirmation** intégré dans le bouton header avec le détail du nombre de demandes concernées
- **Résultat du dispatch** affiché en bannière au-dessus des onglets après l'opération

### Interface — Colonne liste des demandes d'achat

- **Titre redondant supprimé** dans la colonne liste (le titre de l'onglet suffit)
- **Compteur et recherche** désormais sur la même ligne : `N lignes` aligné à droite du champ de recherche
- **Marge** ajoutée entre la zone de recherche et les filtres pour aérer l'interface

---

## [3.45.1] — 2026-06-15

### Correctifs — Page Coordination

- **Statut et priorité intervention** : la modification inline (statut + niveau d'urgence) depuis le détail équipement ne déclenchait pas la requête API — causé par un conflit entre les props `open` et `defaultOpen` sur le composant `Select` de Radix UI qui bloquait l'événement de sélection
- **Priorité en double** : le badge priorité n'apparaît plus en double dans l'en-tête de l'intervention (le `GroupCard` l'affichait automatiquement en plus du sélecteur inline)
- **Mise à jour sans rechargement** : après modification du statut ou de la priorité, la liste se met à jour immédiatement sans spinner de rechargement

---

## [3.45.0] — 2026-06-14

### Page Coordination

Nouvelle page dédiée à la coordination opérationnelle, accessible depuis le menu principal.

- **Planning semaine** : vue en 5 colonnes (lun.–ven.) affichant les tâches planifiées avec navigation par semaine
- **Panel équipements** : liste de tous les équipements triée par état de santé, avec compteurs d'interventions ouvertes et de demandes en attente
- **Détail par équipement** : sélectionner un équipement affiche ses interventions actives avec leurs tâches (statut, assignation, date d'échéance éditables inline) et ses demandes d'intervention ouvertes
- Actions inline directement depuis la page : changement de statut tâche, assignation technicien, date d'échéance, statut et priorité intervention, création de tâche

---

## [3.44.1] — 2026-06-09

### Amélioration interne — aucun impact visible

Cette version consolide la base de code sans modifier le comportement de l'application.

- **Performance** : les requêtes réseau annulées proprement quand on navigue rapidement entre pages — plus de réponses qui arrivent en retard et écrasent l'affichage en cours
- **Stabilité du menu** : la configuration du menu est désormais centralisée en un seul endroit, ce qui élimine le risque qu'une page disparaisse silencieusement du menu suite à un fichier mal nommé
- **Cohérence des statuts DI** : les couleurs et libellés des statuts de demandes d'intervention sont désormais chargés depuis l'API au lieu d'être codés en dur — ils suivront automatiquement les évolutions backend
- **Nettoyage** : suppression de 20 fichiers inutilisés qui s'étaient accumulés sans être branchés sur aucune fonctionnalité

---

## [3.44.0] — 2026-06-07

### Briefing — tuile d'intervention synthétisée

- **Résumé des tâches** : la liste détaillée des tâches dans la colonne gauche du Briefing est remplacée par une ligne de synthèse (comptage par statut : en cours, à faire, faits, ignorés)
- **Tâches en retard mises en valeur** : si une ou plusieurs tâches ont dépassé leur date d'échéance, la bande passe sur fond rouge avec un badge `⚠ N en retard` bien visible
- **Empty state** : quand une intervention n'a aucune tâche associée, un message *"Aucune tâche"* est affiché à la place

### Vue détail intervention — tâches groupées par statut

- Les tâches dans `IvBody` sont désormais regroupées visuellement par statut (en cours, à faire, terminées) avec une interface plus lisible

### Demandes d'achat — bandeau contexte

- Une bannière contextuelle s'affiche en haut du formulaire de demande d'achat pour rappeler l'intervention ou la DI de rattachement
- Refactorisation du modal `SpontaneousPurchaseRequestModal` pour plus de clarté

### Badge environnement

- Le logo affiche un badge coloré selon l'environnement (`dev`, `staging`, `prod`)
- Le titre de la page (`<title>`) inclut désormais le préfixe d'environnement
- Ajout de `VITE_ALLOWED_HOSTS` dans la configuration Vite pour sécuriser les accès en développement réseau

### Correctifs

- **Briefing** : l'`InterventionCard` s'affiche correctement quand une DI a une intervention liée via les données de liste

---

## [3.43.0] — 2026-06-04

Stabilité : **en consolidation**

### Impact fonctionnel

- **Profil utilisateur** : il est désormais possible de modifier ses informations personnelles et de changer son mot de passe directement depuis l'application
- **Tâches terminées protégées** : la date d'échéance et le responsable d'une tâche terminée ne peuvent plus être modifiés accidentellement
- **Création d'intervention depuis une demande** : le formulaire affiche le résumé de la demande liée, et l'intervention est automatiquement classée en statut « Routine »
- **Demandes d'achat** : le champ « demandeur » est désormais pré-rempli avec le nom de l'utilisateur connecté ; correction d'un dysfonctionnement lors de la mise à jour d'une demande

### Composants / Modules concernés

- Profil utilisateur
- Tâches
- Interventions — Création depuis une demande d'intervention
- Demandes d'achat

### Points de vigilance

- Le profil utilisateur est un nouveau module : surveiller les remontées sur la gestion des mots de passe

---

## [3.42.0] — 2026-05-29

### Page détail équipement — vue consolidée

- **DI et interventions visibles** : la page détail d'un équipement affiche désormais les demandes d'intervention et les interventions dans les mêmes composants que le Briefing (`BriefingPage`)
- **Navigation maintenue** : cliquer sur un élément dans la vue équipement reste sur `/equipements/:id` — plus de redirection vers `/briefing`
- **Toutes les interventions** : les interventions terminées, annulées et archivées sont incluses dans la liste (filtre de statut exhaustif)

### Journal d'audit — interception native

- **Config audit depuis l'endpoint** : l'intercepteur lit maintenant le champ `audit` directement dans la réponse d'erreur 400/422 du backend — plus besoin d'un GET préalable pour connaître les règles
- **Retry silencieux immédiat** : si le backend renvoie `silent: true` dans l'erreur, la requête est relancée automatiquement avec `default_reason_code` sans aucune interaction, même au premier appel
- **Suppression des pré-chauffs** : les requêtes fictives `limit: 1` dans les formulaires de création ont été supprimées

### Briefing — améliorations

- Refonte de `DIRightPanel` et `IvHeader` avec chaînage visuel (`ChainIcon`) et sélection de priorité
- Nouveau composant `IvHeaderBlocks` pour une mise en page modulaire des en-têtes d'intervention
- Badge d'échéance de tâche (`TaskDueBadge`) avec refactorisation de `TaskRow`
- `MachineTitle` enrichi avec support des données de situation et rendu conditionnel
- URLs dynamiques dans `BriefingPage` pour une navigation cohérente

---

## [3.40.0] — 2026-05-22

### Correctifs

- **Briefing** : simplification de la logique de récupération des tâches dans `BriefingTile` — les tâches s'affichent désormais de manière plus fiable

---

## [3.39.0] — 2026-05-22

### Correctifs

- Mise à jour de l'endpoint `fetchPurchaseRequests` pour retourner les données depuis le bon chemin
- Correction de la gestion des réponses API pour retourner les données directement

---

## [3.38.0] — 2026-05-22

### Correctifs

- Affichage de l'unité dans les lignes de commande fournisseur : utilisation de `stock_item_unit` pour cohérence
- Refactorisation de la gestion des réponses API et amélioration des prop types pour les composants stock
- Suppression de la fonction `fetchSupplierOrderTransitions` inutilisée dans le hook détail commande fournisseur

---

## [3.37.0] — 2026-05-18

### Journal d'audit — comportement intelligent

- **Opérations de routine sans interruption** : la création d'une action, la gestion des tâches et des demandes d'intervention n'interrompent plus l'opérateur pour demander une raison — elles sont enregistrées automatiquement sous la catégorie *Routine*
- **Raisons adaptées au contexte** : pour les opérations qui nécessitent toujours une raison explicite (modification d'une intervention, validation d'une demande d'achat), la liste des choix disponibles est désormais chargée instantanément depuis les données déjà reçues, sans requête supplémentaire
- **Correctif** : dans de rares cas, la création d'une action avec des tâches associées pouvait échouer silencieusement — ce problème est résolu

---

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
