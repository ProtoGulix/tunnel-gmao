# AUD-05. Audit écrit par les repos : auteur réel, erreur qui annule la mutation

- Statut : faite (2026-11-13)
- Agent : backend-dev
- Branche : fix/audit-integrite
- Dépend de : AUD-02, AUD-03, ADR 0017 point 3
- Périmètre d'écriture : `backend/api/intervention_requests/` (repo, routes),
  `backend/api/intervention_actions/` (repo, routes), `backend/api/intervention_tasks/repo.py`
  et routes si besoin de transmettre l'auteur ; dans `backend/tests/` : les helpers qui
  choisissent un motif (sans changer d'assertion), l'attente de révision alembic de
  `test_bootstrap_integration.py`, de nouveaux tests. Exclus : middleware, migrations,
  fronts, CHANGELOG, marqueurs xfail (l'agent principal les gère).

## Contexte

Avec la migration 0006, fn_audit_log_decision lève ses erreurs. Trois repos l'appellent
dans la transaction de la mutation : `_audit_request` (sans SAVEPOINT, sans auteur,
motif OTHER codé en dur sans texte à la création : aucune des 181 créations de demande
de la base de dev n'a de ligne d'audit), `_audit_task_from_action` (sans SAVEPOINT) et
`_audit_task` (SAVEPOINT, erreur avalée). État constaté par l'agent principal le
2026-11-13 : 27 échecs et 14 erreurs en intégration (17 « PURCHASE_RECEIVED réservée »
venant des helpers de test qui prennent le premier motif actif, des `KeyError: 'id'` en
cascade, la révision alembic attendue 0005).

## Critères d'acceptation

- [x] les trois appelants reçoivent l'auteur réel (request.state.user_id via la route)
      et n'avalent plus l'erreur : un audit qui échoue annule toute la mutation
      (ADR 0017 point 3) ; plus de motif codé en dur à la création d'une demande (motif
      de la requête, ROUTINE injecté par le middleware si routinier)
- [x] test d'intégration : création de demande → une ligne d'audit « created » avec
      changed_by = l'utilisateur du jeton
- [x] test d'intégration : un échec d'audit dans le repo annule la mutation (rien en base)
- [x] helpers de test : motif choisi explicitement (pas « le premier actif »), assertions
      inchangées ; attente de révision mise à jour pour 0006, justifiée
- [x] scripts/check.sh vert ; scripts/test-integration.sh --runxfail : seul le test
      AUD-04 échoue encore
- [x] l'agent est le seul à lancer test-integration.sh pendant sa tâche

## Compte rendu final

backend-dev (2026-11-13) : `_audit_request`, `_audit_task_from_action`, `_audit_task`
sans try/except ni SAVEPOINT : un audit qui échoue annule la mutation. Auteur transmis
par les routes depuis request.state.user_id (actions add et update, transition de
demande, /repair). Création de demande : motif de la requête (ROUTINE injecté), plus de
OTHER codé en dur. /repair utilisait le motif « SYSTEM », inexistant (échec silencieux
depuis toujours) : ROUTINE au nom de l'utilisateur. Nouveau fichier
test_audit_repos_integration.py (création auditée avec changed_by du jeton, ROUTINE
injecté, échec d'audit qui annule la création). Helpers de test : RAISON = "ROUTINE"
au lieu du premier motif actif, assertions inchangées ; révision attendue 0006.
Contrôle de l'agent principal : check.sh complet vert ; test-integration.sh --runxfail
104 passed, 1 failed (AUD-04, attendu) ; seule assertion modifiée : révision alembic ;
created_by vérifié issu du jeton (routes.py:140).
Échec avant correctif des nouveaux tests : non rejoué ; cohérent avec la base de dev
(0 ligne « created » pour 181 demandes).
