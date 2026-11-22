# PRIO-03. Web : `normal` seul, codes de statut réels, libellés uniques

- Statut : faite (2026-11-21), essai à l'écran validé (2026-11-22)
- Agent : frontend-dev
- Branche : feat/priorites-et-statuts (depuis develop, ADR 0008)
- Dépend de : ADR 0039 ; parallèle possible avec PRIO-01 et PRIO-02
- Périmètre d'écriture : web/src/. Exclu : backend/, mobile/.

## Contexte

Relevé du 2026-11-21 (vérifié dans le code par l'agent principal pour la Coordination) :
`normale` écrit ou comparé dans useBriefingData.js, InterventionCreationPanel.jsx,
TaskSearchColumn.jsx, InterventionSelector.jsx, DIBriefingItem.jsx, InterventionCard.tsx,
useInterventionCard.ts, InterventionRequestDetail.jsx, config/interventionTypes.js,
api/interventions.js ; traductions `normale`→`normal` dans IvHeader.tsx, IvHeaderBlocks.tsx.
Codes de statut inexistants (`en_cours`) : CoordinationPage.jsx:548,593,
useBriefingData.js:285,325, api/planning.js:37,57, api/interventions.js:53,
InterventionSelector.jsx:24. Deux tables de libellés de statut dans
config/interventionTypes.js (STATUS_CONFIG « Ouvert », STATE_COLORS « En cours ») ; tâche
`skipped` libellée « Ignoré » ou « Ignorée » selon l'écran.

## Critères d'acceptation

- [x] Plus aucun `normale` dans web/src (grep vide), une seule table de libellés de priorité.
- [x] Plus aucun code de statut hors `ouvert`, `attente_pieces`, `attente_prod`, `ferme`
      dans les filtres et sélecteurs (grep de `en_cours`, `en_attente`, `cancelled` vide ou
      justifié) ; la Coordination charge `ouvert,attente_pieces,attente_prod`.
- [x] Une seule table de libellés de statut d'intervention : `ouvert` « Ouvert » partout.
- [x] Tâche `skipped` : « Annulée » partout (bouton « Annuler » inchangé).
- [x] Tests front existants verts (npm test dans web/), build sans erreur.
- [x] scripts/check.sh vert.
- [x] CHANGELOG (« Non publié ») à jour.

## Compte rendu final

Fait (frontend-dev, sonnet) : 24 fichiers de web/src ; `normal` seul, une table de libellés
de priorité (PRIORITY_CONFIG) et de statut (STATUS_CONFIG, entrée `cancelled` retirée) ;
Coordination, briefing, planning et sélecteurs sur les quatre codes réels ; tâche
`skipped` « Annulée ». npm test 88/88, build et check.sh verts, aucune commande en échec.
Restes justifiés des greps : `en_cours` d'achat, `en_attente` des demandes et des achats.

Compléments de l'agent principal (décisions de l'utilisateur du 2026-11-21) : bouton
« Annuler » (au lieu de « Ignorer ») pour annuler une tâche, étape de gamme annulée
« Annulée », tâche terminée « Terminée » partout ; tests et build verts.

NON VÉRIFIÉ à l'écran : Coordination avec les interventions en attente, sélecteurs du
briefing (« Fermé », « Attente production »), badges des tâches.

Complément du 2026-11-22 (décision de l'utilisateur) : tâche pas commencée « À faire » partout ; étapes de gamme « À faire » et « Terminée », carte d'action qui lit la table unique STEP_STATUS_LABELS ; 88 tests et build verts.
