# INT-05. Web : un seul composant de création, celui de l'accueil

- Statut : faite (2026-11-20), essai à l'écran validé
- Agent : frontend-dev (sonnet)
- Branche : feat/creation-intervention-atomique, worktree de la sous-branche
  feat/creation-intervention-atomique-int05
- Dépend de : INT-01, INT-02, ADR 0025 (point 4 révisé)
- Périmètre d'écriture : web/src/components/planning/, web/src/components/interventions/,
  web/src/pages/interventions/InterventionCreatePage.jsx, web/src/pages/coordination/
  (appel de la fenêtre seulement), web/src/hooks/interventions/, web/src/api/interventions.js,
  composants partagés nouveaux, tests front, cette fiche. Exclu : backend, mobile,
  dépendances.

## Contexte

Essai à l'écran du 2026-11-20 : la page « Nouvelle intervention » diffère de l'accueil et
bloque sans demande choisie (« Le titre est obligatoire » : elle réutilise
InterventionCreateForm sans la partie demande). Décision de l'utilisateur : le formulaire de
l'accueil est la référence ; la page de création utilise le même composant, comportement
identique ; plus de tâches à la création ; nettoyer le code ensuite.

## Critères d'acceptation

- [ ] Un composant de création unique, tiré de l'accueil (choix de l'équipement, demandes
      ouvertes de l'équipement, demande choisie ou saisie, date de prise en charge,
      technicien, type, priorité) ; l'accueil le garde à l'identique
- [ ] La page de création et la fenêtre de Coordination l'utilisent ; mêmes règles et mêmes
      messages qu'à l'accueil ; seule la suite après création peut différer (accueil :
      saisie de l'action ; page : fiche de l'intervention ; Coordination : comportement
      actuel après création)
- [ ] Plus de saisie de tâches à la création
- [ ] Code mort retiré (ancien formulaire de la page, hook ou parties de la fenêtre devenus
      inutiles), vérifié par grep des imports
- [ ] Build, lint sans nouvelle erreur, npm test, scripts/check.sh vert
- [x] Essai à l'écran par l'utilisateur (validé le 2026-11-20)

## Compte rendu final

Fait : le formulaire de l'accueil est extrait dans components/planning/InterventionCreationPanel.jsx
(déplacé de DayContextRightColumn, comportement inchangé) ; nouveau composant autonome
components/planning/InterventionCreator.jsx (équipement, demandes ouvertes à gauche, formulaire à
droite). La page de création (navigation vers la fiche) et la fenêtre de Coordination (mêmes
callbacks) l'utilisent. Supprimé : ancien formulaire de la fenêtre (onglets DI existante / nouvelle,
tâches), usage de useInterventionCreate par la page (le hook reste utilisé par DIRightPanel), champ
tasks de createIntervention (api/interventions.js). Build OK, lint 505 -> 502 problèmes, npm test
52 OK, check.sh vert.
Différences restantes : l'accueil garde sa disposition en deux colonnes liées au planning ; la
page et la fenêtre empilent le même couple. Le technicien n'est plus prérempli (comme l'accueil) ;
demandeur obligatoire (comme l'accueil) ; plus de mode « DI parmi toutes les ouvertes » : on part
de l'équipement.

Suite : le Briefing (DIRightPanel) crée via InterventionCreationPanel avec demande et équipement
fixés (suite inchangée : navigation vers la fiche puis rafraîchissement) ; useInterventionCreate
supprimé ; InterventionCreatorRight et InterventionCreatorFlow supprimés d'InterventionSelector
(imports et helper associés compris) ; commentaires corrigés. Technicien non prérempli partout.
Lint 502 -> 498, build, npm test 52 et check.sh verts.

Suite de l'essai à l'écran (2026-11-20) : la page de création est remplacée par la fenêtre
de création, ouverte depuis le bouton « Nouvelle intervention » de la liste ; page et route
/intervention/new supprimées (décision de l'utilisateur).
