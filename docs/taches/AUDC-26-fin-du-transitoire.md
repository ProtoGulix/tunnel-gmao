# AUDC-26. Fin du transitoire de l'étape 1

- Statut : faite (2026-11-14)
- Agent : backend-dev
- Branche : refactor/audit-etape-2
- Dépend de : AUDC-22 à AUDC-25
- Périmètre d'écriture : `backend/api/*/schemas.py` des domaines interventions,
  intervention_requests, intervention_tasks, intervention_actions (et tout autre schéma
  qui utilise `injected_reason_code`), `backend/api/audits/events.py` (retrait de
  `injected_reason_code` s'il n'a plus d'usage), les validators et repos qui lisent
  encore `reason_code` du corps, tests, docs/api/endpoints concernés, CHANGELOG.
  Exclus : middleware (sauf retrait du champ `injected_reason_code` de l'AuditUnit si
  plus d'usage), migrations, fronts.

## Contexte

Étape 1 (AUDC-13) : le middleware ne réécrit plus le corps ; pour que les schémas qui
exigeaient `reason_code` continuent d'accepter un corps sans motif, un
`Field(default_factory=injected_reason_code, validate_default=True)` transitoire a été
posé sur 9 schémas. Depuis l'étape 2, le motif est validé et écrit par le middleware
seul : les repos ne doivent plus lire `reason_code` du corps. Reste aussi un motif codé
en dur : `transition_status(..., reason_code: str = "OTHER")`
(intervention_requests/repo.py:674), passé au validator de transition.

## Critères d'acceptation

- [x] plus aucun `default_factory=injected_reason_code` ; un schéma qui n'a plus besoin
      du motif ne le déclare plus, ou le garde facultatif s'il sert à un validator
      métier (ex. clôture de tâche, ADR 0016 : contrat AuditReasonRequiredError
      inchangé, tests de clôture et d'ignorer verts sans modification)
- [x] plus aucun motif par défaut codé en dur dans les repos et validators
      (`reason_code="OTHER"` de transition_status) ; le validator de transition lit le
      motif validé par le middleware (request.state) s'il en a besoin
- [x] un client qui envoie encore `reason_code` dans le corps continue de fonctionner
      (le middleware le lit) ; un corps sans motif sur une route routinière passe
- [x] grep : `injected_reason_code` absent du code d'api (hors retrait documenté)
- [x] check.sh vert, test-integration.sh vert ; CHANGELOG « Non publié »

## Compte rendu final

Fait : retrait de `injected_reason_code`, `ReasonCodeField` et du champ de l'AuditUnit ;
`reason_code` (et `reason_text` inutile) retirés des schémas des 4 domaines ; classe
`InterventionTaskDelete` supprimée (le middleware exige le motif) ; `transition_status`
prend `reason_code=None` et la route lit `request.state` ; `PATCH /intervention-tasks`
garde `reason_code` et `reason_text` facultatifs (clôture, ADR 0016), avec repli sur
request.state. Tests : tests/test_fin_transitoire.py (4) et
tests/integration/test_audc26_fin_transitoire_integration.py (5). Le test unitaire
`test_le_motif_injecte_est_lisible_par_les_schemas` (tests/test_audit_events.py) a été
supprimé avec la fonction qu'il testait. Contrat : un client qui envoie reason_code est
inchangé ; `reason_code` n'est plus un champ des schémas OpenAPI (le middleware le lit).
Une transition de demande n'a pas de règle routinière : sans motif, 400 (comme avant).

Contrôle de l'agent principal (2026-11-14) : un test retiré (test_le_motif_injecte_est_
lisible_par_les_schemas : la fonction testée est supprimée) ; aucune autre assertion
touchée ; check.sh vert (221 passed) ; test-integration.sh 222 passed.
