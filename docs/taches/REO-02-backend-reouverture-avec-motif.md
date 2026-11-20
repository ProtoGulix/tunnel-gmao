# REO-02. Backend : rouvrir exige un motif et rouvre la demande

- Statut : faite
- Agent : backend-dev
- Branche : fix/statuts-hors-travail-normal
- Dépend de : ADR 0028, REO-01
- Périmètre d'écriture : backend/api/interventions/, backend/api/intervention_status_log/,
  backend/api/intervention_requests/ (réouverture de la demande liée), backend/tests/,
  docs/api/endpoints/. Exclu : migrations, fronts.

## Contexte

ADR 0028 points 1, 2 et 4. Modèle du motif exigé : ensure_explicit_close_reason dans
backend/api/intervention_tasks/validators.py (AuditReasonRequiredError avec les motifs
filtrés par décision). Voir comment la route PUT de la clôture de tâche obtient reason_code,
reason_text et les motifs de l'entité. Trace système de la demande : modèle de
_record_system_closure / watch_trigger_closure (intervention_requests/repo.py). Le journal
de statut refuse déjà l'entrée dans « ferme » (validate_not_closing) : ajouter le refus de
la sortie.

## Critères d'acceptation

- [x] Test : PUT qui sort de « ferme » sans motif explicite (ROUTINE injecté) → 400 motif
      requis, avec seulement les motifs de la décision intervention_reopened ; intervention
      toujours fermée
- [x] Test : avec INTERVENTION_REWORK → 200, intervention rouverte, audit_log porte le motif,
      demande liée repassée « acceptee » avec un événement SYSTEM_CASCADE au nom du jeton
- [x] Test : OTHER sans texte → 400 ; un motif d'une autre décision → 400
- [x] Test : journal de statut depuis « ferme » → 400, rien ne change
- [x] Un changement de statut hors « ferme » (ouvert → attente_pieces) reste routinier
- [x] Reclore après réouverture reclôture la demande (trace système)
- [x] Doc des endpoints à jour ; scripts/check.sh et scripts/test-integration.sh verts

## Compte rendu

Fait : motif explicite vérifié dans la route PUT (`ensure_reopen_reason`, validators.py des
interventions, motifs de l'entité intervention filtrés par `intervention_reopened`) ; le
journal de statut refuse la sortie de « ferme » ; réouverture de la demande liée dans
`_write_update`, sur le même curseur et le même commit que l'UPDATE de l'intervention (si l'un
échoue, rien n'est écrit), événement SYSTEM_CASCADE déposé dans l'unité d'audit de la requête
(écrit par le middleware avec l'auteur du jeton). La reclôture passe par le chemin existant
(trigger + watch_trigger_closure). Tests : tests/integration/test_reouverture_integration.py.
Docs : interventions.md, intervention-status-log.md.
