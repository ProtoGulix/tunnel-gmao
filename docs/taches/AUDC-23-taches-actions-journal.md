# AUDC-23. Tâches, actions et journal de statut sous l'audit centralisé

- Statut : faite (2026-11-14)
- Agent : backend-dev
- Branche : refactor/audit-etape-2
- Dépend de : AUDC-21
- Périmètre d'écriture : `backend/api/intervention_tasks/`, `backend/api/intervention_actions/`,
  `backend/api/intervention_status_log/`, `backend/api/audits/middleware.py` (retrait de
  `_AUDITED_BY_REPO` seulement), `backend/api/audits/exclusions.py`, tests (retrait des
  xfail AUDC-23 seulement). Exclus : autres domaines, fronts, migrations.

## Contexte

À retirer : `_audit_task` (intervention_tasks/repo.py:18, appels 380, 520, 576),
`_audit_task_from_action` (intervention_actions/repo.py:19, TASK_STATUS en dur ligne 39,
appels 753-977), `_AUDITED_BY_REPO` (audits/middleware.py:72). Les tâches fermées par une
action deviennent des événements déposés par le repo. Le contrat de clôture de l'ADR 0016
(AuditReasonRequiredError, motifs filtrés par decision_types) ne change pas.
Avant de changer les decision_type écrits, l'agent principal montre les différences à
l'utilisateur : l'agent les liste dans son compte rendu (avant / après), sans trancher.

## Critères d'acceptation

- [x] tests AUDC-23 passent sans xfail ; tests ADR 0016 (clôture, ignorer) toujours verts
- [x] plus aucun appel à fn_audit_log_decision dans ces trois domaines
- [x] routes déclarées, exclusions retirées, inventaire régénéré
- [x] liste des decision_type avant / après dans le compte rendu
- [x] check.sh vert, test-integration.sh vert ; CHANGELOG « Non publié »

## Compte rendu final

backend-dev (2026-11-14) : `_audit_task`, `_audit_task_from_action` (TASK_STATUS) et
`_AUDITED_BY_REPO` retirés ; les six routes déclarées (tâches : POST created / PATCH et
DELETE par id ; actions idem ; journal de statut : `events_only`), exclusions retirées,
inventaire régénéré. Auteur = jeton partout ; l'argument `user_id` des repos d'actions et
`deleted_by`/`reason_code` du repo des tâches disparaissent.

decision_type écrits dans audit_log (entité, avant -> après) :
- POST /intervention-tasks : task `created` -> inchangé (new_value = ligne brute de la table,
  plus l'objet assigned_to résolu ni `status` forcé à la main).
- PATCH /intervention-tasks/{id} : `{champ}_changed` (status, label, skip_reason,
  assigned_to, due_date, sort_order, closed_by) -> inchangé ; assigned_to passe d'un objet
  {id, initials, nom} à l'UUID brut ; closed_by change de ligne seulement si la valeur
  change (diff de colonne, comme avant) ; motif et reason_text = ceux de la requête.
- DELETE /intervention-tasks/{id} : `deleted` -> inchangé ; old_value passe de
  {label, status} à la ligne complète de la tâche.
- POST /intervention-actions : action, rien d'explicite (ligne `created` seulement via le
  middleware, qui n'avait pas d'id) -> `created` (action) ; par tâche liée, task `updated`
  (`triggered_by_action`) : motif TASK_STATUS, is_system true -> motif SYSTEM_CASCADE,
  is_system true.
- PATCH /intervention-actions/{id} : `{champ}_changed` -> inchangé ; mêmes événements task
  `updated` (SYSTEM_CASCADE au lieu de TASK_STATUS).
- DELETE /intervention-actions/{id} : aucun motif exigé, ligne éventuelle `deleted` ->
  `deleted` avec motif explicite obligatoire (400 sans motif).
- POST /intervention-status-log : intervention `status_changed` (écrit par la route) ->
  `status_changed` (événement déposé, même motif routinier, même auteur) ; le trigger de
  fermeture de la demande ajoute `status_transitioned` (request, SYSTEM_CASCADE, AUDC-22).

Contrôle : check.sh vert (210 passed, 192 skipped), test-integration.sh 192 passed.
Tests existants touchés : `tests/test_status_log_audit.py` (mini-app de test : le
middleware d'audit réel est monté, l'ancien test patchait `resolve_reason_code` de la route ;
assertions inchangées).

Écart au périmètre, à valider : `audit(..., events_only=True)` ajouté à
`api/audits/declaration.py` et au middleware (3 lignes) : le journal de statut n'a ni id de
chemin ni création d'entité auditée ; sans cela, `created_id` aurait ajouté une ligne
`created` parasite (le test existant du journal exige une seule ligne).

Contrôle de l'agent principal (2026-11-14) : écart de périmètre accepté (mode
`events_only` dans declaration.py et le middleware, pour une route sans entité propre ;
sert aussi /intervention-requests/repair, décision 4 de l'utilisateur). Montage de
tests/test_status_log_audit.py adapté au middleware réel, assertions inchangées
(git diff -w). Aucun fn_audit_log_decision, TASK_STATUS ni ROUTINE dans le code des
quatre domaines. check.sh vert (210 passed) ; test-integration.sh 192 passed.

decision_type des tâches et actions présentés à l'utilisateur le 2026-11-14 (inchangés sauf contenu de old_value/new_value ; motif TASK_STATUS devenu SYSTEM_CASCADE) ; aucune objection.
