# REM-02. API : motif exigé pour remettre une tâche à faire

- Statut : faite (2026-11-22)
- Agent : backend-dev (sonnet)
- Branche : feat/motif-remise-a-faire-rem02 (worktree depuis feat/motif-remise-a-faire)
- Dépend de : ADR 0042 ; REM-01 (motifs en base, développés en parallèle)
- Périmètre d'écriture : backend/api/intervention_tasks/ (routes, validators, repo, schemas),
  backend/tests/ (nouveaux tests unitaires et d'intégration), docs/api/endpoints (page des
  tâches), CHANGELOG.md. Exclus : migrations, seed, fronts, middleware d'audit sauf nécessité
  démontrée (à signaler).

## Contexte

ADR 0042. Précédents : clôture directe d'une tâche (`ensure_explicit_close_reason`,
intervention_tasks/validators.py) et réouverture d'une intervention (`ensure_reopen_reason`,
interventions/validators.py). Décision nommée : `record_audit_event` (api/audits/events.py),
déjà utilisé pour des types propres (par ex. `printed_fiche_changed` dans exports/repo.py) ;
la route est déclarée `audit("task", ...)` en mode diff : faire en sorte qu'une remise à faire
produise une seule ligne `task_reopened` et pas aussi une ligne `status_changed`.

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

- [x] done ou skipped vers todo : motif exigé pour tous les rôles ; todo vers todo, in_progress et retour automatique (suppression de la dernière action) inchangés
- [x] closed_by remis à NULL ; skip_reason effacé à la remise à faire
- [x] journal : une ligne `task_reopened` avec le motif et l'auteur du jeton, aucune ligne `status_changed` en double
- [x] tests unitaires (validator, calqués sur test_reouverture_validators.py) et d'intégration (sans motif 400 avec liste filtrée, motif hors liste refusé, OTHER sans texte refusé, TECH autorisé avec motif, closed_by effacé, ligne de journal)
- [x] docs/api/endpoints à jour ; CHANGELOG à jour ; scripts/check.sh vert

## Compte rendu final

Fait. `PATCH /intervention-tasks/{id}` avec `status: "todo"` sur une tâche `done` ou `skipped`
exige un motif `task_reopened` (validator `ensure_task_reopen_reason`, appelé par la route, même
forme que la clôture directe). Le repo efface `closed_by` et `skip_reason`.

Ligne unique `task_reopened` : le repo dépose l'événement avec `record_audit_event`, en lui
indiquant les champs qu'il remplace (`replaces_fields` : status, closed_by, skip_reason). Le
middleware d'audit ne code pas ces trois champs en `{champ}_changed`. Modification minimale du
middleware, démontrée nécessaire : en mode diff il aurait écrit trois lignes en plus
(`events.py` : `replaces_fields` et `replaced_fields`, `middleware.py` : saut dans `_write_diffs`).

Tests : unitaires (`test_task_remise_a_faire.py`, `test_audit_events.py`) verts, check.sh vert.
Intégration (`test_taches_remise_a_faire_integration.py`, 9 tests) collectés mais NON EXÉCUTÉS :
ils exigent les motifs de REM-01 et Docker. NON VÉRIFIÉ : une seule ligne de journal en vrai.
