# REG-01. Indicateurs de règle dans l'API et capacités de l'utilisateur

- Statut : faite (2026-11-20, contrôlée par l'agent principal, reviewer APPROUVÉ, essai à l'écran validé)
- Agent : backend-dev
- Branche : refactor/regles-depuis-l-api (worktree ../wt-reg-01)
- Dépend de : ADR 0030
- Périmètre d'écriture : backend/api/ (interventions, intervention_actions,
  intervention_tasks, auth/routes.py et schémas liés), backend/tests/, docs/api/endpoints/
  (domaines touchés), CHANGELOG.md, cette fiche. Exclu : alembic, schema.sql, fronts.

## Contexte

Voir ADR 0030. Règles existantes : clôture `CLOSED_STATUS_CODE` (api/constants.py), suppression
d'action (intervention_actions/repo.py vers 990-1011, `NON_DISPATCHED_PR_STATUSES`),
suppression de tâche (intervention_tasks/repo.py vers 433-455), rôles
`SKIP_OBLIGATORY_ROLES` et `CLOSE_WITHOUT_ACTION_ROLES` (intervention_tasks/validators.py).

## Critères d'acceptation

- [x] `is_locked` sur chaque intervention renvoyée (liste, détail, objets imbriqués qui
      portent le statut si c'est simple) ; une seule fonction de décision.
- [x] `can_delete` sur chaque action renvoyée, calculé par la fonction qui sert au refus
      de suppression.
- [x] `can_delete` sur chaque tâche renvoyée ; suppression refusée (400, message clair) si la
      tâche n'est pas « todo », a une action, ou si l'intervention est verrouillée.
- [x] `GET /auth/me` : `capabilities: {skip_obligatory_step: bool,
      close_task_without_action: bool}` depuis les listes du validator.
- [x] Tests : chaque indicateur vrai et faux ; refus de suppression d'une tâche « done »
      sans action ; capacités pour RESP, TECH et ADMIN.
- [x] Docs des endpoints à jour ; scripts/check.sh vert ; test-integration.sh vert
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Fait. Règles uniques : `is_intervention_locked` (interventions/validators.py, sert aussi aux
trois `_ensure_intervention_editable`), `has_dispatched_pr` et `can_delete_action`
(intervention_actions/validators.py, sert à `delete`), `task_delete_blocker` (message de refus
et indicateur) et `task_capabilities` (intervention_tasks/validators.py). `can_delete` des
tâches posé dans `_map_task` (`intervention_status` ajouté aux requêtes de tâches), et en
Python pour les tâches JSON de la liste des interventions.

Champs portés : `is_locked` par `GET /interventions` (liste), `GET /interventions/{id}`,
`intervention` imbriquée de `GET /intervention-actions` (liste) et de `GET /intervention-actions/{id}`
(détail), items de `GET /intervention-tasks`. `can_delete` (action) par `GET /intervention-actions`,
`GET /intervention-actions/{id}`, `GET /interventions/{id}` (actions), `GET /interventions/{id}/actions`.
`can_delete` (tâche) par `GET /intervention-tasks`, `/{id}`, tâches de `GET /interventions` avec
`include_tasks`, `GET /interventions/{id}`, tâches imbriquées dans les actions. `capabilities` par
`GET /auth/me`. Non couverts : statut d'intervention imbriqué dans les demandes d'achat et les
équipements.

Tests : tests/test_regles_indicateurs.py (unitaires), tests/integration/test_reg01_indicateurs_integration.py.
Aucun test existant modifié ni affaibli.
