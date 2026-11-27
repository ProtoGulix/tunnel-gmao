# ACD-04. Guide : accueil direction

- Statut : faite (2026-11-27)
- Agent : principal
- Branche : feat/accueil-direction
- Dépend de : ACD-02, ACD-03
- Périmètre d'écriture : docs/site/responsable/accueil.md, captures concernées et scripts/captures.json, docs/endpoints si oubli, docs/ETAT.md, cette fiche.

## Critères d'acceptation

- [x] page « Accueil direction technique » réécrite pour la file (sections, actions, droits nécessaires)
- [x] captures reprises et relues ; scripts/check.sh vert ; npm run docs:build sans lien mort

## Compte rendu final

Page « Accueil direction technique » réécrite (tableau des sections, qualifier une demande,
préventif) et index du responsable aligné. Capture `web-direction-accueil` reprise sur une
démonstration jetable (CAPTURES_ONLY) et relue ; une capture haute temporaire a servi à
contrôler toute la file (manifeste restauré). Constaté à la relecture : la ligne de demande
n'avait pas sa description, ajoutée (QualifyRequestRow, hors périmètre de la fiche, petite
correction de l'agent principal). npm run docs:build vert, sans lien mort.

NON VÉRIFIÉ : Accepter, Rejeter (fenêtre de motif) et Lancer en avance cliqués à l'écran ;
la base de dev contient des données réelles, aucun essai d'écriture n'y a été fait.

Revue de la branche : APPROUVÉ AVEC RÉSERVES. Traitées : seuil du guide écrit comme
configurable, tri approché de « Sans action » commenté, eslint-disable expliqué. Au
backlog : index sur intervention_action.intervention_id et tri par inactivité côté API
(docs/backlog/index-intervention-action-intervention-id.md). Acceptée : plafond de 500
demandes à qualifier (maximum de l'API).
