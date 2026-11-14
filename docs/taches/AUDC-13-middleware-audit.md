# AUDC-13. Middleware d'audit sur le socle

- Statut : faite (2026-11-13)
- Agent : backend-dev
- Branche : refactor/audit-centralise
- Dépend de : AUDC-11, AUDC-12
- Périmètre d'écriture : `backend/api/audits/`, `backend/api/utils/audit.py`, tests.
  Exclus : repos et routes métier (étape 2), fronts.

## Critères d'acceptation

- [x] pour les routes déclarées : écriture dans la transaction de la requête ; création
      (`created`, id créé), suppression (motif validé, `deleted` avec état avant), champs
      réellement modifiés seulement (état avant lu aussi pour POST de sous-ressource)
- [x] événements d'audit déposés par un repo (objet partagé par référence) : motif
      validé, écrits dans la même transaction
- [x] plus de réécriture de `request._body` ; motif injecté transmis par l'état de la
      requête ; multipart intact
- [x] routes non encore déclarées : comportement actuel conservé
- [x] tests AUDC-10 correspondants passent sans xfail ; check.sh et test-integration.sh verts

## Compte rendu final

backend-dev (2026-11-13) : middleware réécrit (route résolue par route.matches,
déclaration lue ; created avec id déposé, champs réellement modifiés seulement, état
avant lu aussi pour POST ; DELETE avec motif explicite toujours exigé ; corps multipart
jamais lu, plus de réécriture de request._body ; motif posé sur request.state ; plus
aucun except qui avale). api/audits/events.py : `record_audit_event(...)` (reason_code
obligatoire si is_system ; erreur hors requête qui modifie). Routes non déclarées :
logique historique gardée. Transitoire jusqu'à l'étape 2 : `Field(default_factory=
injected_reason_code, validate_default=True)` sur 9 schémas qui exigent reason_code
(le corps n'est plus réécrit). Routes déclarées : POST /interventions, DELETE
/interventions/{id}, POST /supplier-orders/{id}/export/csv, POST
/intervention-requests/{id}/transition (doublon status_transitioned du repo gardé
jusqu'à l'étape 2). Tests : test_audit_events.py (5), test_audc_middleware_integration.py
(10) ; test d'import d'AUDC-15 repassé en vrai multipart (seule assertion : 201).
Agent principal : test existant test_status_log_audit.py inversé
(`..._fait_echouer_la_requete`, 500 attendu au lieu de 201 : ADR 0018 remplace la règle
« la panne d'audit ne casse pas la réponse » de l'ADR 0017) ; 5 marqueurs xfail
AUDC-13 retirés ; check.sh vert ; test-integration.sh 159 passed, aucun xfail.
À vérifier à l'écran : suppression d'une intervention depuis le web (DELETE sans corps
→ fenêtre de motif → rejeu ; en-tête Content-Type du rejeu NON VÉRIFIÉ).
Questions pour l'étape 2 : motif system générique ? génération sans utilisateur.
