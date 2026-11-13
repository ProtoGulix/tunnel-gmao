# CLO-03. Backend : motif d'audit exigé pour une clôture ou une annulation directe

- Statut : faite (2026-11-13)
- Agent : backend-dev
- Branche : feat/cloture-taches-coordination
- Dépend de : CLO-01, ADR 0016 (version réécrite)
- Périmètre d'écriture : `backend/api/intervention_tasks/`, `backend/api/errors/` et
  `backend/api/utils/audit.py` seulement si nécessaire pour renvoyer la demande de motif
  standard, `backend/tests/` (nouveaux tests ; modifier les tests de CLO-01 qui
  supposaient le texte obligatoire est permis et doit être justifié), `docs/api/endpoints/`.
  Exclus : `backend/db/`, alembic, `backend/api/audits/middleware.py`, fronts, CHANGELOG.

## Contexte

CLO-01 a codé une règle maison (texte obligatoire, `ensure_close_reason_text`) au lieu
du système de motifs. Les motifs TASK_DONE_UNRECORDED, TASK_HANDLED_ELSEWHERE,
TASK_NO_LONGER_NEEDED et TASK_DUPLICATE (catégorie user, entité task) sont dans la seed
et la base. Contrat front de la demande de motif : web/src/lib/api/auditGuard.js
(400, error_type ValidationError, detail « reason_code obligatoire pour cette
mutation », champ `audit` avec `reasons`).

## Critères d'acceptation

- [x] PATCH `done` ou `skipped` sans motif explicite (absent, donc ROUTINE injecté, ou
      motif de catégorie auto ou system) → 400 au format exact attendu par auditGuard.js,
      `audit.reasons` = motifs manual et user de l'entité task, non vide
- [x] avec un motif user ou manual de l'entité task → 200 ; OTHER sans texte refusé
      comme ailleurs ; un motif d'une autre entité refusé
- [x] `ensure_close_reason_text` retiré ; `done` reste réservé à RESP et ADMIN (403)
- [x] `skipped` avec motif explicite et sans `skip_reason` → 200, `skip_reason` = libellé
      du motif (et texte s'il existe) ; plus aucun 500 sur ce chemin
- [x] les autres champs (label, échéance, affectation) gardent leur comportement
- [x] la seed charge les quatre motifs sur une base neuve (test d'intégration)
- [x] scripts/check.sh et scripts/test-integration.sh verts

## Compte rendu final

backend-dev (2026-11-13) :
- `ensure_explicit_close_reason` remplace `ensure_close_reason_text` : done ou skipped
  direct sans motif manual ou user de l'entité task → `AuditReasonRequiredError` (400,
  même contrat que le middleware, champ `audit` avec les motifs) ; motif d'une autre
  entité refusé ; OTHER sans texte refusé. Les 403 passent avant.
- `skipped` : model_validator supprimé ; skip_reason facultatif avec motif explicite,
  rempli par « libellé » ou « libellé : texte ».
- `api/utils/audit.py` : `list_entity_reasons` et `build_picker_reasons` extraits,
  `get_audit_rules` inchangé ; le handler ValidationError transmet `audit`.
- Tests réécrits (contrat changé, liste des assertions dans le compte rendu de l'agent),
  dont le chargement des quatre motifs par la seed ; check.sh vert, 93 tests
  d'intégration verts, relancés par l'agent principal.
- Constats vérifiés par l'agent principal : le mobile force ROUTINE sur tout PATCH de
  tâche (Ignorer cassé, CLO-05) ; fn_audit_log_decision avale ses erreurs
  (docs/backlog/audit-erreurs-avalees.md).
