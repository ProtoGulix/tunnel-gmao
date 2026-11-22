# REM-03. Fronts : motif à la remise à faire

- Statut : faite (2026-11-22)
- Agent : frontend-dev (sonnet)
- Branche : feat/motif-remise-a-faire-rem03 (worktree depuis feat/motif-remise-a-faire)
- Dépend de : ADR 0042 ; REM-02 (contrat ci-dessous, développé en parallèle)
- Périmètre d'écriture : mobile/src/components/ (TaskStatusButtons et la feuille de motif),
  mobile/src/api/tasks.js si besoin, web/src/config/interventionTypes.js (libellé de décision),
  web/src/lib/api/auditEntity.js (type de décision si utile au filtre), web/src/components/tasks/
  seulement si le mécanisme commun ne suffit pas (à justifier), tests node, CHANGELOG.md.
  Exclus : backend, docs/site.

## Contexte

ADR 0042. Web : la remise à faire passe par TaskActionButtons (mode live) ; le 400 du mécanisme
d'audit ouvre déjà la fenêtre de motif commune (auditGuard). Mobile : TaskStatusButtons.jsx
gère sa feuille de motif pour « Annuler » seulement (titre fixe, rejoue toujours `skipped`) ;
« Remettre à faire » n'en gère aucune. Précédent mobile : « Pourquoi rouvrir cette
intervention ? » (InterventionDetailPage.jsx).

## Contrat commun (REM-01 à REM-03)

- Décision : `task_reopened`. Motifs : `TASK_CLOSED_BY_MISTAKE` « Clôturée par erreur »,
  `TASK_REWORK` « Travail à reprendre » (catégorie user, entité task, decision_types
  {task_reopened}) ; `OTHER` reçoit aussi `task_reopened` dans ses decision_types.
- API : `PATCH /intervention-tasks/{id}` avec `status: "todo"` sur une tâche `done` ou `skipped`
  sans motif valide : 400 au format du mécanisme d'audit (`AuditReasonRequiredError`, liste des
  motifs filtrée sur `task_reopened`), comme la clôture directe (`ensure_explicit_close_reason`).
  Avec motif : 200, `closed_by` remis à NULL, une ligne d'audit de décision `task_reopened`
  portant le motif (et non `status_changed`).
- Journal web : libellé « Tâche remise à faire ».
- Textes sobres (CLAUDE.md 8.7).

## Critères d'acceptation

- [x] mobile : « Remettre à faire » sur une tâche terminée ou annulée ouvre la feuille de motif (titre court : « Pourquoi remettre à faire ? »), motifs de l'API, rejoue `todo` avec le motif ; « Annuler » inchangé ; annuler la feuille ne change rien
- [x] web : « Remettre à faire » ouvre la fenêtre de motif commune (vérifier, corriger seulement si besoin) ; libellé de journal « Tâche remise à faire » pour `task_reopened`
- [x] message d'erreur de l'API affiché tel quel
- [x] eslint web sans nouvelle erreur ; builds web et mobile ; scripts/check.sh vert ; CHANGELOG à jour

## Compte rendu final

TaskStatusButtons (mobile) : la feuille de motif est générique, le statut demandé (todo ou
skipped) est mémorisé et rejoué avec le motif ; titre « Pourquoi remettre à faire ? ». Web : le
mécanisme commun (auditGuard) suffit, seul le libellé `task_reopened` est ajouté. Tests à l'écran
et contre le backend REM-02 non faits.
