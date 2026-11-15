# CLO-06. Backend : motifs proposés selon le bouton (decision_types)

- Statut : faite (2026-11-13)
- Agent : backend-dev
- Branche : feat/cloture-taches-coordination
- Dépend de : CLO-03, ADR 0016 (point 2 et 4 mis à jour)
- Périmètre d'écriture : `backend/api/intervention_tasks/`, `backend/api/utils/audit.py`,
  `backend/tests/` (tests CLO), `docs/api/endpoints/intervention-tasks.md`. Exclus :
  `backend/db/` (données déjà faites par l'agent principal), alembic, fronts, CHANGELOG.

## Contexte

Retour de l'utilisateur : la demande de motif pour Terminé listait treize motifs, dont
ceux de planning et de priorité. Données posées le 2026-11-13 (seed et base de dev) :
decision_types {task_done} pour TASK_DONE_UNRECORDED, {task_done,task_skipped} pour
TASK_HANDLED_ELSEWHERE et OTHER, {task_skipped} pour TASK_NO_LONGER_NEEDED et
TASK_DUPLICATE ; LEGACY_STATUS_CHANGE désactivé.

## Critères d'acceptation

- [x] done direct : la demande de motif ne liste que les motifs actifs task dont
      decision_types contient task_done ; skipped direct : task_skipped ; NULL exclu
- [x] un motif hors de cette liste est refusé (400), même s'il est valide pour task
- [x] tests unitaires et d'intégration (dont la liste exacte attendue sur une base neuve)
- [x] scripts/check.sh et scripts/test-integration.sh verts

## Compte rendu final

backend-dev (2026-11-13) :
- `ensure_explicit_close_reason(..., target_status)` filtre en Python sur decision_types
  (task_done, task_skipped ; NULL exclu) la liste proposée et les motifs acceptés ; ordre :
  motif inconnu 400, motif auto ou system demande de motif filtrée, motif hors liste 400.
- Débordement de périmètre accepté par l'agent principal : backend/api/audits/repo.py,
  une colonne decision_types ajoutée au SELECT de get_all_reasons (lecture seule,
  nécessaire au filtre ; /audit/reasons inchangé, AuditReasonOut ne l'expose pas).
- Tests adaptés (assertions listées dans le compte rendu de l'agent : motifs simulés
  avec decision_types, listes exactes par bouton) ; nouveaux tests : listes exactes sur
  base neuve, LEGACY_STATUS_CHANGE inactif, motifs hors liste refusés.
- Contrôle de l'agent principal : check.sh vert, test-integration.sh 97 passed,
  aucun conteneur restant.
