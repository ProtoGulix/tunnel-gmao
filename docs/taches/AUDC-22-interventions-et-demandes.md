# AUDC-22. Interventions et demandes sous l'audit centralisé

- Statut : faite (2026-11-14)
- Agent : backend-dev
- Branche : refactor/audit-etape-2
- Dépend de : AUDC-21, ADR 0019
- Périmètre d'écriture : `backend/api/interventions/`, `backend/api/intervention_requests/`,
  `backend/api/audits/exclusions.py`, `backend/api/audits/declaration.py` (usages),
  tests (retrait des xfail AUDC-22 seulement), `docs/endpoints/` des deux domaines.
  Exclus : middleware (sauf accord), fronts, autres domaines, migrations.

## Contexte

ADR 0019 : intervention toujours issue d'une demande, suppression avec issue
(rouvrir / cascade). ADR 0018 : le middleware seul écrit l'audit ; le repo dépose des
événements (`api/audits/events.py`, `record_audit_event`). À retirer :
`_audit_request` (intervention_requests/repo.py:145, appels 644, 891, 1226), ROUTINE en
dur (1237). Cascade de fermeture `on_intervention_closed` (intervention_requests/repo.py:1029)
qui ne doit plus avaler d'erreur.

## Critères d'acceptation

- [ ] tests AUDC-22 passent sans xfail ; aucune assertion existante affaiblie
- [ ] POST /interventions exige request_id (schéma et validator)
- [ ] DELETE /interventions/{id} : paramètre d'issue (`request_outcome` = reopen | delete,
      nom à garder court et documenté), refus explicite sans issue si demande liée
- [ ] routes de l'étape 2 des deux domaines déclarées, exclusions retirées ; inventaire
      régénéré (`python -m scripts.audit_routes`)
- [ ] mutations du système (cascade, repair) : événements is_system avec le motif
      system SYSTEM_CASCADE (AUDC-28), auteur du jeton
- [ ] POST /intervention-requests/{id}/transition vers « acceptee » ne répond plus 500
      (KeyError machine_id, intervention_requests/repo.py:947, relevé AUDC-21) : test
      qui échoue d'abord, puis correctif
- [ ] check.sh vert, test-integration.sh vert ; CHANGELOG « Non publié »

## Compte rendu final

backend-dev (2026-11-14) : routes des deux domaines déclarées, exclusions retirées, repo des
demandes sans écriture d'audit (événements du système SYSTEM_CASCADE pour la cascade, la
réparation et la clôture par trigger du journal de statut), suppression d'intervention avec
`request_outcome` (reopen | delete), request_id obligatoire (schéma), KeyError machine_id
corrigé (test de régression ajouté). check.sh vert (198 passed, 12 xfailed).
Intégration : 187 passed, 2 failed, 3 xfailed. Deux tests existants à trancher, non modifiés :
`test_issue_rouvrir_supprime_l_intervention...` (colonne `changed_at` inexistante, la colonne
est `date` ; le test passe une fois la colonne corrigée) et
`test_audit_qui_echoue_dans_le_repo_annule_la_creation` (attend une erreur d'audit écrite par
le repo des demandes : obsolète depuis l'ADR 0018). Retrait de l'argument `audit_user_id` dans
l'appel de `test_audc_garde_fous_integration` (le paramètre n'existe plus).

Contrôle de l'agent principal (2026-11-14) : diff conforme au périmètre, sauf
intervention_status_log/repo.py (trace de la clôture faite par le trigger, nécessaire au
test de cascade, accepté) et l'appel de transition_status d'un test de garde-fou (argument
supprimé du repo, pas d'assertion touchée). Corrigé : l'auteur de la ligne
request_status_log d'une réouverture est l'utilisateur du jeton (NULL avant, assertion
ajoutée) ; colonne `date` au lieu de `changed_at` dans un test d'AUDC-21 ; test obsolète
test_audit_qui_echoue_dans_le_repo_annule_la_creation réécrit pour l'audit du middleware
(panne d'audit → 500, aucune demande). Boucle d'attente laissée par l'agent arrêtée par
l'agent principal. check.sh vert (198 passed, 12 xfailed) ; test-integration.sh 189
passed, 3 xfailed (AUDC-23). Changements de decision_type à montrer à l'utilisateur
avant la fusion.

decision_type des demandes validés par l'utilisateur le 2026-11-14 (AUDC-plan, décision 7).
