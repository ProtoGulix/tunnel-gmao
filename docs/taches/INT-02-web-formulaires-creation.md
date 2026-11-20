# INT-02. Web : les trois formulaires de création sur la route unique

- Statut : faite (2026-11-20), essai à l'écran validé
- Agent : frontend-dev (sonnet)
- Branche : feat/creation-intervention-atomique, worktree de la sous-branche
  feat/creation-intervention-atomique-int02
- Dépend de : INT-01 (contrat d'API), ADR 0025
- Périmètre d'écriture : web/src/components/interventions/InterventionCreateModal.jsx,
  web/src/hooks/interventions/useInterventionCreate.js,
  web/src/components/planning/DayContextRightColumn.jsx, web/src/api/ (interventions),
  tests front éventuels, cette fiche. Exclu : backend, mobile, dépendances.

## Contexte

La fenêtre de création (InterventionCreateModal) est la référence (décision de
l'utilisateur du 2026-11-20) : demande existante ou nouvelle, demandeur saisi sinon nom
du technicien, service, tâches à la création.

## Critères d'acceptation

- [x] Les trois formulaires font un seul appel `POST /interventions` (request_id ou
      request, tasks) ; plus d'appel à /intervention-requests ni /intervention-tasks à la
      création ; plus de `origine` envoyé ; GET inutile du planning retiré
- [x] Page de création et planning alignés sur la fenêtre : même règle de demandeur,
      même envoi de reported_by
- [x] Erreur de l'API affichée sans rien créer ; un nouvel essai ne crée pas de doublon
- [x] Build, lint sans nouvelle erreur, npm test, scripts/check.sh vert
- [x] Essai à l'écran par l'utilisateur (validé le 2026-11-20)

## Compte rendu final

Fait. `createIntervention` (web/src/api/interventions.js) accepte `request` (nouvelle demande) ou
`requestId`, et `tasks` (libellés), et envoie un seul `POST /interventions`. Les trois
formulaires l'utilisent ; plus d'appel à /intervention-requests ni /intervention-tasks à la
création, plus de GET de la demande dans le planning, plus de `origine`. Règle commune (celle de
la fenêtre) : demandeur saisi, sinon nom du technicien, sinon « Système » (repli ultime, conservé
car la fenêtre l'utilise) ; `reported_by` = demandeur (demande existante : son demandeur). Un
échec ne crée rien et aucun id de demande n'est gardé en état local : un nouvel essai ne crée pas
de doublon. Écart visible : la fenêtre envoie désormais `reported_by` (avant : absent).
Lint 505 problèmes avant et après, build et npm test (52) verts.
