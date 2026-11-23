# CST-04. Mobile : constat à la clôture

- Statut : faite
- Agent : frontend-dev (sonnet)
- Branche : feat/constat-intervention-cst04 (worktree depuis feat/constat-intervention)
- Dépend de : CST-02
- Périmètre d'écriture : mobile/src/, CHANGELOG.md. Exclus : backend, web.

## Contexte

ADR 0043, contrat dans CST-01. Fenêtre de clôture : mobile/src/components/interventions/CloseInterventionPrompt.jsx
(montée dans ActionForm.jsx et InterventionDetailPage.jsx). Conventions : docs/guides/conventions-mobile.md.
Terrain first : saisie en moins d'une minute, uniquement des cases.

## Critères d'acceptation

- [ ] clôture d'une intervention dont le type exige un constat : formulaire avant la
      confirmation, choix lus de l'API, sous-questions selon les choix, machine pré-remplie
- [ ] ajout d'un constat sur une intervention non archivée
- [ ] refus de l'API affiché sobrement, sans message brut
- [ ] build vert ; essai à l'écran par l'utilisateur
- [ ] CHANGELOG à jour

## Compte rendu final

Fait. Clôture : `CloseInterventionPrompt` lit l'intervention, les types (`constat_required`) et ses constats ;
si le constat est exigé et absent, `ConstatForm` s'affiche avant la confirmation. Ajout hors clôture : bouton
« Constat » dans la barre de la fiche (droit `constats:create_constat`, masqué si archivée). Questions et choix
lus de l'API, sous-questions selon les choix cochés, machine de l'intervention modifiable. Refus de l'API :
message de `detail`, sans brut. Aucune règle dupliquée (seul « au moins un choix » grise l'envoi).
Pas de test automatisé mobile dans le dépôt ; check.sh vert (build mobile inclus). Essai à l'écran à faire.
