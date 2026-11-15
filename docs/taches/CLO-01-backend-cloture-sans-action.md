# CLO-01. Backend : clôture d'une tâche sans action par RESP et ADMIN

- Statut : faite (2026-11-13)
- Agent : backend-dev, puis test-writer
- Branche : feat/cloture-taches-coordination
- Dépend de : ADR 0016
- Périmètre d'écriture : `backend/api/intervention_tasks/` (schemas, routes, validators,
  repo si nécessaire), `backend/tests/` (nouveaux tests seulement), `docs/endpoints/`
  pour la route touchée, `CHANGELOG.md` (« Non publié »). Exclus : `backend/db/`,
  `backend/alembic/`, `backend/api/audits/`, tout autre domaine, les fronts.

## Contexte

`InterventionTaskPatch.status` n'accepte que `todo|skipped` (schemas.py:52-62). Le
repo sait déjà écrire `closed_by` pour `done` (repo.py, `patch`). La règle d'audit
`task.status` est ROUTINE : sans `reason_code`, le middleware injecte ROUTINE.
`ensure_can_skip` (validators.py) montre le modèle de contrôle par rôle.

## Critères d'acceptation

- [x] `status` accepte `done` ; la docstring du schéma et de la route reflète l'ADR 0016
- [x] `done` par PATCH : RESP et ADMIN → 200 ; TECH et ACHETEUR → 403 ; MCP reste
      refusé en écriture (contrôle existant, vérifié par un test)
- [x] `done` par PATCH sans `reason_text` non vide (après trim) → 422 ou 400, message
      français clair, quel que soit le `reason_code`
- [x] `closed_by` = utilisateur du jeton ; l'entrée d'audit porte `reason_text` et
      `changed_by` (test d'intégration)
- [x] passage de `in_progress` (avec actions) à `done` par RESP : accepté
- [x] `skipped` inchangé (skip_reason obligatoire, étape obligatoire réservée)
- [x] intervention préventive : après clôture en `done` de ses tâches obligatoires,
      `check_intervention_closable` laisse fermer (test d'intégration)
- [x] recherche de tout code qui suppose « done implique une action » (stats, temps,
      tableau de bord) : constat dans le compte rendu, sans modification hors périmètre
- [x] scripts/check.sh et scripts/test-integration.sh verts, aucune assertion existante
      modifiée
- [x] CHANGELOG « Non publié »

## Compte rendu final

Étape 1, backend-dev (2026-11-13) :
- `ensure_can_close` (RESP, ADMIN, sinon 403) et `ensure_close_reason_text` (400 si
  vide après trim) dans validators.py, appelés par la route avant le repo ; le schéma
  accepte `done`. Le contrôle du texte n'est pas dans le schéma : une ValueError de
  `model_validator` répond 500 (bug préexistant reproduit par l'agent principal,
  docs/backlog/erreur-500-model-validator.md).
- Tests unitaires : backend/tests/test_task_cloture_sans_action.py (RESP et ADMIN 200
  avec closed_by du jeton, TECH et ACHETEUR 403, texte absent ou blanc 400 avec
  ROUTINE et OTHER, skipped inchangé). Aucune assertion existante modifiée.
- Doc : docs/api/endpoints/intervention-tasks.md (le chemin réel, pas docs/endpoints).
- « done implique une action » : aucun calcul ne le suppose ; une tâche close sans
  action affiche 0 action et 0 h. Logique de clôture d'occurrence préventive NON VÉRIFIÉE.
- Contrôle de l'agent principal : diff --stat conforme au périmètre, check.sh relancé
  vert, aucun processus laissé.

Étape 2, test-writer (2026-11-13) :
- backend/tests/integration/test_taches_cloture_integration.py, 9 tests : RESP avec
  OTHER et sans reason_code (ROUTINE), closed_by et audit en base ; TECH 403 ; clé MCP
  403 ; texte absent, vide ou blanc 400 ; in_progress avec action vers done 200 ;
  intervention préventive refusée (409 GAMME_INCOMPLETE) puis fermée (201) après
  clôture de sa tâche obligatoire. skipped déjà couvert (test_taches_ignorer_integration
  et tests unitaires de l'étape 1).
- Défaut préexistant trouvé : le repo écrit sa propre ligne d'audit par champ, avec
  reason_text codé à None, en plus du middleware ; la raison de la réunion manquait sur
  une ligne status_changed.

Correction et contrôle de l'agent principal :
- `_audit_task` transmet le reason_text de la mutation (repo.py). Assertion du test
  resserrée : toutes les lignes status_changed portent la raison et l'auteur. Le test
  échoue sans la correction (1 failed) et passe avec (87 passed).
- Double écriture de l'audit des tâches : docs/backlog/audit-taches-double-ecriture.md.
- test-integration.sh relancé par l'agent principal : 87 passed ; aucun conteneur restant.
- NON VÉRIFIÉ : ADMIN en done seulement en test unitaire ; clôture d'occurrence
  préventive (preventive_occurrence) quand ses tâches sont closes sans action.
