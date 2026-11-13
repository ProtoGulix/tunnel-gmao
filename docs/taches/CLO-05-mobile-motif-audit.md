# CLO-05. Mobile : Ignorer passe par le choix de motif d'audit

- Statut : faite, en attente d'essai sur téléphone (2026-11-13)
- Agent : frontend-dev
- Branche : feat/cloture-taches-coordination
- Dépend de : CLO-03, ADR 0016, CLAUDE.md section 2.4
- Périmètre d'écriture : `mobile/src/` (api, composants des tâches, un composant de choix
  de motif si besoin), `mobile/CHANGELOG.md` s'il existe. Exclus : backend, web.

## Contexte

`mobile/src/api/tasks.js` force `reason_code: 'ROUTINE'` sur tout PATCH de tâche et le
mobile n'a pas de fenêtre de motif. Depuis CLO-03, un passage direct vers `skipped` (ou
`done`) sans motif explicite reçoit la demande de motif standard (400, champ `audit` avec
les motifs) : Ignorer est cassé sur le mobile.

## Critères d'acceptation

- [x] Ignorer sur le mobile propose les motifs reçus du backend (manual et user de task),
      exige le texte pour OTHER seulement, puis renvoie la requête avec le motif choisi ;
      plus de saisie de raison maison ni de ROUTINE forcé pour ce changement
- [x] les autres modifications de tâche (champs routiniers) gardent leur comportement
- [x] abandon du choix : tâche inchangée, pas de message d'erreur parasite
- [x] saisie en moins d'une minute, utilisable au doigt (CLAUDE.md section 2.2)
- [x] build mobile vert dans scripts/check.sh

## Compte rendu final

frontend-dev (2026-11-13) :
- `updateTask(taskId, updates, audit)` : ROUTINE retiré seulement pour un passage vers
  skipped ou done sans motif ; les autres modifications gardent ROUTINE.
- Ignorer envoie le statut seul ; sur la demande de motif, AuditReasonSheet (nouveau,
  feuille en bas d'écran) liste les motifs reçus, texte seulement pour OTHER ; abandon
  silencieux. Aucun autre passage direct vers done ou skipped dans le mobile.
- check.sh vert (build mobile). Pas de test de composant dans mobile/.
- Contrôle de l'agent principal : diff relu, périmètre conforme, tests relancés.
- NON VÉRIFIÉ : rendu et usage au doigt sur téléphone.
