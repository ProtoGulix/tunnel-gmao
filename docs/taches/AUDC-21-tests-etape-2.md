# AUDC-21. Tests qui échouent de l'étape 2 (interventions, demandes, tâches, actions)

- Statut : faite (2026-11-14)
- Agent : test-writer
- Branche : refactor/audit-etape-2
- Dépend de : ADR 0018, ADR 0019
- Périmètre d'écriture : `backend/tests/` seulement (unitaires et `tests/integration/`).
  Exclus : tout code de production, fronts, docs.

## Contexte

Tests écrits avant le code d'AUDC-22 et AUDC-23, marqués `xfail(strict=True,
reason="AUDC-22")` ou `"AUDC-23"` : ils doivent échouer aujourd'hui pour la bonne raison.
Les tests de préventif et d'achats (AUDC-24, AUDC-25) viendront dans une fiche à part.
Modèles : tests/integration/test_audc_middleware_integration.py,
test_audc_socle_integration.py, tests/test_audit_coverage.py.

## Critères d'acceptation

- [x] AUDC-22 : `POST /interventions` sans `request_id` → 400 (ou 422), rien écrit
- [x] AUDC-22 : DELETE d'une intervention liée sans issue → 400, rien écrit ; issue
      « rouvrir » → intervention supprimée, demande « nouvelle » sans lien, une ligne
      request_status_log, lignes `deleted` (intervention) et événement d'audit
      (demande) avec le motif de la requête ; issue « cascade » → les deux supprimées,
      deux lignes `deleted` ; échec d'une partie → tout annulé ; intervention ancienne
      sans demande → supprimée sans issue
- [x] AUDC-22 : fermeture d'intervention dont la cascade échoue → 500, intervention
      toujours ouverte (tout ou rien)
- [x] AUDC-22 : routes interventions et demandes de l'étape 2 déclarées (test de
      couverture : plus dans les exclusions) ; plus aucun appel à fn_audit_log_decision
      dans api/intervention_requests/repo.py (test qui lit le source ou mock)
- [x] AUDC-23 : PATCH/DELETE de tâche, POST/PATCH/DELETE d'action, POST du journal de
      statut audités par le middleware seul : une ligne par changement, pas de doublon
      (aujourd'hui repo + middleware) ; action qui ferme des tâches → un événement par
      tâche, motif de la requête ou motif system, auteur du jeton ; plus aucun appel à
      fn_audit_log_decision dans les repos de tâches et d'actions ; plus de TASK_STATUS
      codé en dur
- [x] chaque nouveau test échoue aujourd'hui (xfail strict) ; check.sh vert ;
      test-integration.sh vert (xfail compris)

## Compte rendu final

test-writer (2026-11-14) : tests/test_audit_etape2.py (20 xfail : routes déclarées,
sources sans fn_audit_log_decision, ROUTINE ni TASK_STATUS en dur, _AUDITED_BY_REPO),
tests/integration/etape2_helpers.py, test_audc22_interventions_demandes_integration.py,
test_audc23_taches_actions_journal_integration.py (11 xfail rejoués en --runxfail : échec
pour la bonne raison). Passent déjà, gardés comme garde-fous : POST /interventions sans
request_id refusé, suppression d'une intervention sans demande, fermeture dont la
cascade échoue (500, tout annulé, acquis de l'étape 1), création de tâche, PATCH et
DELETE de tâche et d'action sans doublon, journal de statut.
Constats de l'agent : POST /intervention-requests/{id}/transition vers « acceptee »
répond 500 (KeyError machine_id, repo.py:947 : get_by_id ne renvoie pas machine_id) ;
un RAISE EXCEPTION SQL par défaut (P0001) remonte en 400 avec son texte brut.
Agent principal : aucun code de production touché ; check.sh vert (190 passed,
20 xfailed) ; test-integration.sh 180 passed, 11 xfailed (après correction des deux
échecs d'AUDC-28).
