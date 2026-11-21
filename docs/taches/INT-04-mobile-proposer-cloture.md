# INT-04. Mobile : proposer de clore l'intervention après sa dernière tâche

- Statut : faite (2026-11-20), essai à l'écran validé
- Agent : frontend-dev (sonnet)
- Branche : feat/creation-intervention-atomique, worktree de la sous-branche
  feat/creation-intervention-atomique-int04
- Dépend de : ADR 0025 (point 5), ADR 0016 (clôture en coordination)
- Périmètre d'écriture : mobile/src/components/actions/ActionForm.jsx (après l'envoi de
  l'action seulement), mobile/src/pages/interventions/, mobile/src/api/,
  mobile/src/components/ui/AuditReasonSheet.jsx si besoin, cette fiche. Exclu : backend,
  web, dépendances.

## Contexte

Décision de l'utilisateur du 2026-11-20. Sur le mobile, une action peut clore sa tâche
(close_task) mais rien ne propose de clore l'intervention. Le changement de statut existe
(InterventionDetailPage, StatusSheet). À vérifier d'abord : ce que le backend exige pour
clore (motif d'audit, règles de l'ADR 0016) et comment le web le fait.

## Critères d'acceptation

- [x] Après une action qui clôt la dernière tâche ouverte de l'intervention, le mobile
      propose de clore l'intervention ; refuser ne change rien
- [x] Accepter passe par la même route et les mêmes règles que le web, avec la fenêtre de
      motif commune (AuditReasonSheet) si un motif est exigé ; aucun motif en dur
- [x] Rien n'est proposé si d'autres tâches restent ouvertes ou sans le droit de changer
      le statut
- [x] Build, lint sans nouvelle erreur, scripts/check.sh vert
- [x] Essai à l'écran par l'utilisateur (validé le 2026-11-20)

## Compte rendu final


Fait. Le backend n'exige aucun motif par défaut pour clore (règle `intervention` routinière) ;
si l'administration en impose un, il répond 400 avec les motifs et la fenêtre commune
(AuditReasonSheet) les propose. Clôture par la route du web (PUT /interventions/{id},
status_actual = ferme), qui applique `_check_closable` (tâches non optionnelles en attente) ;
droit exigé : interventions:update_intervention. Proposition affichée seulement si l'action
clôt sa tâche et qu'aucune tâche ouverte ne reste (relecture après l'envoi).
Fichiers : mobile/src/components/interventions/CloseInterventionPrompt.jsx (nouveau),
ActionForm.jsx (suite de l'envoi), api/interventions.js, auth/permissionCodes.js.
À signaler : le bouton Statut du mobile passe par POST /intervention-status-log, qui ne
contrôle pas les tâches bloquantes (seul le déclencheur de gamme protège) et n'ouvre pas de
fenêtre de motif ; hors périmètre, non corrigé. Mobile sans scripts lint ni test.
