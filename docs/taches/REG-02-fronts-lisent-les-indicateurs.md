# REG-02. Web et mobile lisent les indicateurs et capacités de l'API

- Statut : faite (2026-11-20, contrôlée par l'agent principal, reviewer APPROUVÉ, essai à l'écran validé)
- Agent : frontend-dev
- Branche : refactor/regles-depuis-l-api (worktree ../wt-reg-02, après REG-01)
- Dépend de : ADR 0030, REG-01
- Périmètre d'écriture : web/src, mobile/src, CHANGELOG.md, cette fiche, et
  docs/backlog/regles-metier-recopiees-dans-les-fronts.md (marquer traité). Exclu : backend.

## Contexte

Copies relevées dans docs/backlog/regles-metier-recopiees-dans-les-fronts.md : statut
« cancelled » (web, 6 endroits), `NON_DISPATCHED_PR_STATUSES` (web/src/lib/utils/actionUtils.js),
`ELEVATED_ROLES` / `canSkipObligatory` (web/src/auth/usePermissions.js), `canSkipTask`,
`canCloseTask`, `canDeleteTask` (web/src/components/tasks/taskUtils.js et usages), et leurs
équivalents mobile s'il y en a.

## Critères d'acceptation

- [x] « cancelled » ne figure plus comme statut d'intervention ; le verrouillage vient de
      `is_locked`.
- [x] Suppression d'une action et d'une tâche selon `can_delete` ; ignorer une étape
      obligatoire et clore sans action selon `capabilities` de /auth/me.
- [x] Champ absent : action masquée.
- [x] Tests front existants adaptés sans affaiblir (taskUtils.test.js) ; build web et mobile
      verts ; scripts/check.sh vert
- [x] Backlog marqué traité (restent : accès aux pages par rôle, hors périmètre ADR 0030)
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Fait : web et mobile lisent `is_locked`, `can_delete` et `capabilities` ; mappers web
(`isLocked`, `canDelete`) ; `canDeleteAction`, `canDeleteTask`, `canCloseTask` et
`usePermissions` (`canSkipObligatory`, `canCloseWithoutAction`) sans rôle ni statut recopié ;
`ELEVATED_ROLES`, `isElevated`, `NON_DISPATCHED_PR_STATUSES` et « cancelled » supprimés
(requêtes de liste comprises). Champ absent : verrouillé ou masqué.

Comparaisons de statut gardées : mobile InterventionDetailPage (`ferme` : clôture par la
mise à jour, réouverture avec motif, chemins imposés par le backend) ; web
`canCloseTask` (`todo`/`in_progress` : choisit les tâches concernées) ; `canSkipTask`
(`origin === 'plan' && !optional` : définit quelle étape est obligatoire, la capacité dit
qui peut l'ignorer) ; mobile EquipementsPage (`ferme`) et web `isInterventionOpen`
(interventionUtils.jsx, ancienne forme `status_actual.id`) : pas d'`is_locked` sur ces données.
Libellés et couleurs « cancelled » laissés dans web/config et mobile/config/badges.js
(affichage d'alias, pas de décision).

Tests : `npm test` web 55 verts (taskUtils et deleteInterventionRules adaptés, mêmes
comportements, nouvelles entrées) ; builds web et mobile verts ; scripts/check.sh vert.
Non vérifié : rendu à l'écran.
