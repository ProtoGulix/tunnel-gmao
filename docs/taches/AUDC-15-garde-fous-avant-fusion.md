# AUDC-15. Garde-fous avant la fusion de l'étape 1

- Statut : faite (2026-11-13)
- Agent : backend-dev
- Branche : refactor/audit-centralise
- Dépend de : AUDC-11, ADR 0018 points 1 quater et 1 quinquies
- Périmètre d'écriture : backend/api/transaction.py (liste d'exclusions temporaires),
  les 5 `SET LOCAL app.skip_request_status_log` (intervention_requests/repo.py:848,
  1075, 1193 ; interventions/repo.py:875 ; preventive_occurrences/repo.py:764), tests.

## Contexte

Sous la transaction de requête, POST /preventive-occurrences/generate (un conflit
d'occurrence fait un rollback de flux normal) et POST /purchase-requests/import (une
ligne fautive) échouent désormais en 500 au lieu d'un succès partiel. Leur adaptation
est prévue à l'étape 2 (décisions de l'utilisateur : tout ou rien, valider puis
écrire). D'ici là, leur comportement actuel doit être conservé. Le SET LOCAL dure
jusqu'à la fin de la requête au lieu du commit du repo.

## Critères d'acceptation

- [x] liste explicite d'exclusions temporaires de la transaction de requête, avec la
      raison et la tâche de l'étape 2 qui les retirera ; test qui fige son contenu
      (generate et import seulement)
- [x] test : une génération avec un conflit d'occurrence et un import avec une ligne
      fautive gardent le comportement actuel
- [x] SET LOCAL remplacé par un réglage ciblé remis à sa valeur après l'instruction
      concernée ; test : dans une même requête, un changement de statut de demande
      après le passage concerné écrit bien sa ligne request_status_log
- [x] check.sh et test-integration.sh verts

## Compte rendu final

backend-dev (2026-11-13) : `_TEMPORARY_EXCLUSIONS` dans api/transaction.py (POST
/preventive-occurrences/generate, POST /purchase-requests/import), distincte des
exclusions d'auth, figée par test_transaction_exclusions.py. Context manager
`skip_request_status_log(cur)` (api/utils/status_log.py) à la place des 5 SET LOCAL :
set_config local posé puis remis à 'false' juste après le bloc ; repair_orphaned_requests
le pose à chaque tour. Tests d'intégration (test_audc_garde_fous_integration.py) :
génération avec conflit (200, generated=1, skipped_conflicts=1) ; import avec une ligne
en erreur SQL (created=2, errors=1) ; journal des statuts écrit après le passage qui
fait taire le trigger. Échec prouvé sans l'exclusion (500) et avec un réglage qui dure.
Le test d'import passe par une route jetable appelant le vrai repo, le multipart
réel étant cassé par l'audit actuel (AUDC-13 : à repasser en vrai multipart).
Agent principal : check.sh vert ; test-integration.sh 144 passed, 5 xfailed ; plus
aucun SET LOCAL dans api/ ; préfixe /api retiré par nginx avant FastAPI (rewrite),
exclusions donc valables derrière le proxy.
