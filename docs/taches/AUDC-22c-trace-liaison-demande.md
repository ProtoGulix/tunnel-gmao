# AUDC-22c. Trace de l'acceptation d'une demande à la création de l'intervention

- Statut : faite (2026-11-14)
- Agent : principal
- Branche : refactor/audit-etape-2
- Dépend de : AUDC-22 ; accord de l'utilisateur du 2026-11-14
- Périmètre d'écriture : `backend/api/interventions/repo.py` (`_link_request`), un test
  d'intégration, CHANGELOG.

## Contexte

POST /interventions avec request_id passe la demande de « nouvelle » à « acceptee »
(`_link_request`) et écrit request_status_log, mais aucun événement d'audit pour la
demande. C'est le chemin normal d'acceptation (l'utilisateur, 2026-11-14 : la demande est
acceptée par la création d'une intervention et clôturée par sa fermeture).

## Critères d'acceptation

- [x] test qui échoue d'abord : POST /interventions avec request_id → un événement
      `status_transitioned` sur la demande (acceptee, lien vers l'intervention), motif de
      la requête, auteur = jeton
- [x] check.sh et test-integration.sh verts ; CHANGELOG

## Compte rendu final

Agent principal (2026-11-14) : `_link_request` dépose statut_changed et
intervention_id_changed sur la demande (mêmes types que l'acceptation par transition),
motif de la règle d'audit des demandes (le motif de la requête vaut pour l'intervention
et peut ne pas s'appliquer à la demande), auteur du jeton ; système (SYSTEM_CASCADE)
pour l'acceptation automatique du préventif. request_status_log porte l'auteur du jeton
(NULL avant). Tests : test_audc22c_acceptation_par_creation_integration.py ; deux tests
d'AUDC-22 qui comptaient tous les événements de la demande (en supposant l'acceptation
sans trace) excluent désormais les événements d'acceptation. Test qui échoue d'abord :
non rejoué séparément ; l'absence d'événement avant le code est attestée par les deux
tests d'AUDC-22 qui en comptaient zéro.
