# AUDC-22b. Suites d'AUDC-22 : préventif, création à l'acceptation, /repair

- Statut : faite (2026-11-14)
- Agent : backend-dev
- Branche : refactor/audit-etape-2
- Dépend de : AUDC-22, AUDC-23 ; décisions de l'utilisateur du 2026-11-14 (AUDC-plan,
  décision 7)
- Périmètre d'écriture : `backend/api/interventions/`, `backend/api/intervention_requests/`,
  tests (nouveaux tests ; aucune assertion existante modifiée), `docs/api/endpoints/` des
  deux domaines, CHANGELOG. Exclus : socle d'audit (sauf usage de `events_only`), autres
  domaines, fronts, migrations.

## Contexte

Décisions de l'utilisateur après AUDC-22 : une demande liée à une occurrence préventive
(preventive_occurrence.di_id, aucune clé étrangère) ne se supprime pas en cascade avec son
intervention ; sa réouverture remet l'occurrence à « generated ». L'intervention créée en
acceptant une demande reçoit sa ligne `created`. /repair passe en `events_only`.

## Critères d'acceptation

- [x] DELETE /interventions/{id}?request_outcome=delete sur une demande liée à une
      occurrence → 400 explicite, rien supprimé (test qui échoue d'abord)
- [x] request_outcome=reopen sur une demande liée à une occurrence → occurrence
      « generated », événement d'audit du système sur l'occurrence (entité
      preventive_occurrence, is_system, SYSTEM_CASCADE : conséquence de la décision),
      demande « nouvelle » sans lien (test qui échoue d'abord)
- [x] acceptation d'une demande (transition « acceptee ») → une ligne `created` pour
      l'intervention créée, motif résolu par la règle d'audit de l'entité intervention
      (jamais codé en dur), auteur du jeton (test qui échoue d'abord)
- [x] POST /intervention-requests/repair déclaré `audit("request", events_only=True)`,
      contournement d'AUDC-22 retiré
- [x] check.sh vert, test-integration.sh vert ; CHANGELOG « Non publié »

## Compte rendu final

backend-dev (2026-11-14) : tests écrits d'abord (backend/tests/integration/
test_audc22b_suites_integration.py, 4 tests, tous en échec pour la bonne raison avant le
code), puis :
- suppression d'intervention : `request_outcome=delete` sur une demande liée à une occurrence
  (`preventive_occurrence.di_id`) → 400, rien supprimé (contrôle dans
  `InterventionRepository.delete`, avant le DELETE) ;
- `reopen` : l'occurrence repasse à `generated` (`intervention_id` NULL, `di_id` conservé) ;
- acceptation : `_record_intervention_created` dépose la ligne `created` de l'intervention,
  motif = `default_reason_code` de `resolve_reason_code("intervention", [])`, erreur
  explicite si aucune règle routinière ; auteur = jeton (via le middleware) ;
- `POST /intervention-requests/repair` : `audit("request", events_only=True)`.

decision_type nouveaux dans audit_log :
- `preventive_occurrence` / `status_changed` (is_system, SYSTEM_CASCADE) : réouverture ;
- `intervention` / `created` à l'acceptation d'une demande (motif de la règle d'audit,
  ROUTINE en base de test ; new_value = ligne de l'intervention sans id ni horodatages).

Docs : docs/api/endpoints/interventions.md et intervention-requests.md ; CHANGELOG.

Test indirect : un premier jet de mon test créait un plan préventif sans classe, ce qui a fait
échouer test_generation_avec_conflit_garde_le_succes_partiel (le plan faisait une erreur de
chargement de machines) ; corrigé dans mon test (plan avec classe sans machine).

Contrôle de l'agent principal (2026-11-14) : diff conforme au périmètre, aucune
assertion existante modifiée ; check.sh vert (211 passed) ; test-integration.sh 196
passed. Question remontée à l'utilisateur : réouverture d'une demande dont l'occurrence
est « completed » (remise à « generated » comme les autres).
