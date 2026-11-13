# CLO-02. Web : boutons Terminé et Annuler sur la ligne de tâche

- Statut : faite, en attente de validation à l'écran (2026-11-13)
- Agent : frontend-dev
- Branche : feat/cloture-taches-coordination
- Dépend de : CLO-01, ADR 0015, ADR 0016
- Périmètre d'écriture : `web/src/components/tasks/`, `web/src/api/interventionTasks*`,
  `web/src/hooks/usePermissions*` si une permission manque, `CHANGELOG.md`. Exclus :
  backend, mobile, pages autres que l'onglet Tâches et la Coordination (elles utilisent
  déjà les composants partagés).

## Contexte

Les lignes de tâche (`TaskLine`, `TaskActionButtons`) servent à l'onglet Tâches et à la
page Coordination (ADR 0015). Ignorer existe au survol, avec `skip_reason`.

## Critères d'acceptation

- [x] RESP et ADMIN voient sur chaque tâche à faire ou en cours deux boutons directs,
      « Terminé » et « Annuler », sans dépendre du survol ; les autres rôles ne les
      voient pas (la vérification réelle reste au backend)
- [x] chaque bouton demande la raison (texte court obligatoire) avant l'envoi ;
      Terminé envoie `status: done`, `reason_code: OTHER`, `reason_text` ; Annuler
      envoie `status: skipped`, `skip_reason` et `reason_text` identiques
- [x] une erreur du backend s'affiche par `TaskErrorNotice`, sans détail brut
- [x] retour de relecture ADR 0015 : Supprimer n'est proposé que pour une tâche `todo`
      sans action (TaskLine.jsx, `useTaskRights`)
- [x] retour de relecture ADR 0015 : commentaire et constante du compte à rebours
      cohérents (TaskActionButtons.jsx)
- [x] test unitaire de la règle d'affichage par rôle et statut (taskUtils)
- [x] scripts/check.sh vert, aucune assertion existante modifiée
- [x] CHANGELOG « Non publié »

## Compte rendu final

frontend-dev (2026-11-13) :
- Nouveau `TaskCloseButtons` (Terminé, Annuler, saisie de raison obligatoire en ligne,
  Entrée valide, Échap ferme) affiché par `TaskLine` si `canCloseTask(status,
  isElevated)` ; `isElevated` de usePermissions = RESP et ADMIN, comme le backend.
- `canDeleteTask` : Supprimer seulement pour `todo` sans action. Compte à rebours :
  commentaire aligné sur la constante (5 s), constante inchangée.
- Tests : deux cas ajoutés dans taskUtils.test.js (11 tests web verts) ; aucune
  assertion existante modifiée. CHANGELOG, section Interventions.
- Contrôle de l'agent principal : diff --stat conforme, check.sh relancé vert.
- Questions ouvertes : « Ignorer » au survol double « Annuler » ; « Remettre à faire »
  d'une tâche done reste proposé (le backend accepte todo pour tous les rôles).
- NON VÉRIFIÉ : rendu à l'écran (largeur de ligne, téléphone), appel réel par rôle.
