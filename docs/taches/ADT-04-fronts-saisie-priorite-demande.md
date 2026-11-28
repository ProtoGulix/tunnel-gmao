# ADT-04. Fronts : saisir et changer l'urgence d'une demande

- Statut : fait
- Agent : frontend-dev
- Branche : feat/accueil-direction-a-trancher
- Dépend de : ADT-02
- Périmètre d'écriture : web/src (formulaires de demande, détail de demande, AcceptRequestDialog, api/intervention-requests.js), mobile/src (formulaire de demande), tests front, CHANGELOG.md, cette fiche. Exclu : accueil direction (ADT-05), backend.

## Critères d'acceptation

- [x] champ priorité facultatif (libellés de PRIORITY_CONFIG, jamais codés en dur) dans la fenêtre de demande spontanée et l'onglet Demandes du web, et dans le formulaire mobile
- [x] détail d'une demande ouverte : urgence affichée et modifiable si la permission est accordée (contrôle par le code de permission, pas par le rôle)
- [x] AcceptRequestDialog : priorité préremplie depuis la demande
- [x] saisie mobile en moins d'une minute inchangée (champ facultatif, valeur par défaut vide)
- [x] npm run lint et tests front verts (web et mobile) ; CHANGELOG

## Compte rendu

- Web : `priorite` à la création, `setInterventionRequestPriority`, option `sort` de la liste (api/intervention-requests.js). Champ Urgence (facultatif) dans RequestFormFields, donc fenêtre de demande spontanée et onglet Demandes. Détail : urgence affichée, modifiable si demande nouvelle ou en attente et permission `intervention-requests:set_request_priority`. AcceptRequestDialog préremplie. Règle pure et libellés : `lib/requestPriority.js` (testée).
- Mobile : champ Urgence facultatif (vide par défaut) dans DIForm.
- Non vérifié à l'écran : rendu des trois formulaires et du sélecteur du détail.
