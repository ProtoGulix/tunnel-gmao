# PREV-10. Clic d'une notification qui n'ouvre rien, jours de retard mis en évidence

- Statut : faite (2026-11-18), essai à l'écran validé
- Agent : frontend-dev (sonnet)
- Branche : fix/notifications-et-retards (depuis develop, ADR 0008), worktree d'une
  sous-branche fix/notifications-et-retards-prev10
- Dépend de : PREV-06, PREV-07 (fusionnés dans develop)
- Périmètre d'écriture : web/src/pages/interventions/InterventionsListPage.jsx,
  web/src/components/preventive/, web/src/components/equipements/tabs/EquipementPreventifTab.jsx,
  web/src/config/preventiveConfig.js (et son test), mobile/src/pages/preventive/,
  tests web éventuels, CHANGELOG.md (« Non publié »), cette fiche. Exclu : backend.

## Contexte

Essai de l'utilisateur du 2026-11-18 : sur le web, cliquer une notification n'ouvre rien.
Cause probable relevée par l'agent principal : `InterventionsListPage` initialise
l'intervention et la demande sélectionnées depuis l'URL (`?tab=…&id=…`) dans un
initialiseur de `useState`, sans resynchronisation : déjà sur /interventions, une
navigation vers une autre `id` (notification, lien) change l'URL sans ouvrir l'élément.
Demande de l'utilisateur : les jours de retard mis en évidence dans l'échéancier web, la
liste « Préventif à faire » du mobile et l'onglet Préventif de la fiche équipement.

## Critères d'acceptation

- [x] Déjà sur /interventions (n'importe quel onglet), cliquer une notification ou un
      lien vers `/interventions?id=X` ouvre l'intervention X ; vers
      `/interventions?tab=demandes&id=Y` bascule sur l'onglet demandes et ouvre la demande
      Y ; fermer le panneau puis rouvrir par l'URL fonctionne ; aucune boucle de rendu
- [x] La correction est faite dans la page (synchronisation URL → sélection), pas par un
      contournement dans la cloche
- [x] Jours de retard : pastille rouge bien visible « +N j » (même composant ou même
      configuration partagée) sur chaque ligne en retard de l'échéancier web et de
      l'onglet Préventif d'une fiche équipement ; même mise en évidence (grande, rouge)
      dans la liste « Préventif à faire » du mobile. Valeur lue dans `days_overdue` de
      l'API, aucun calcul côté client
- [x] Essai à l'écran par l'utilisateur (validé le 2026-11-18)
- [x] scripts/check.sh vert ; CHANGELOG (« Non publié », « Corrigé » et « Modifié ») à jour

## Compte rendu final

Cause confirmée : état local initialisé une seule fois depuis l'URL. La page dérive
maintenant la sélection de `searchParams` (onglet et `id`), sans état local ni
resynchronisation, donc sans boucle ; fermer vide l'`id`. Pastille partagée
`OverdueBadge` (« +N j », `overdueBadgeLabel` dans preventiveConfig, testé) dans
l'échéancier et l'onglet Préventif équipement ; pastille rouge grande dans la liste mobile.
Pas de test de composant (aucun outillage React en test). À essayer à l'écran : notification
intervention et demande depuis /interventions, fermeture puis réouverture, pastilles web
et mobile.
