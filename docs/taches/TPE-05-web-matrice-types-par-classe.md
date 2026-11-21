# TPE-05. Web : réglage des types permis en matrice dans la liste des classes

- Statut : faite (2026-11-20, contrôlée par l'agent principal, reviewer APPROUVÉ, essai à l'écran validé)
- Agent : frontend-dev
- Branche : feat/types-par-equipement (worktree ../wt-tpe-05)
- Dépend de : ADR 0031, TPE-03
- Périmètre d'écriture : web/src (administration des classes), CHANGELOG.md, cette fiche.
  Exclu : backend, mobile.

## Contexte

Essai à l'écran du 2026-11-20 : l'utilisateur veut régler les types permis comme les
permissions des rôles (AdminRolePermissionsMatrix) : dans le tableau des classes, une colonne
par type d'intervention, une case par ligne, et la couleur de chaque type. Les cases
ajoutées par TPE-03 dans la fenêtre « Modifier la classe » deviennent un doublon.

## Critères d'acceptation

- [x] Tableau des classes (AdminRefEquipementClassesSection) : une colonne par type actif,
      en-tête avec la pastille de couleur et le code du type (libellé en infobulle), une case
      par ligne ; même composant et même façon d'enregistrer que la matrice des permissions
      (enregistrement à chaque clic par `PUT /equipement-class/{id}/intervention-types`,
      indicateur pendant l'envoi, retour à l'état précédent et message en cas d'erreur).
- [x] Une classe sans type coché se lit « tous permis » sans ambiguïté (mention discrète sur
      la ligne) ; légende courte au-dessus du tableau : « Aucune case cochée : tous les types
      sont permis ».
- [x] Cases non modifiables sans le droit `replaceClassInterventionTypes` (lecture seule).
- [x] Les cases de la fenêtre « Modifier la classe » sont retirées (un seul endroit de réglage).
- [x] Le tableau reste lisible avec 8 types (colonnes étroites, code, défilement horizontal
      si besoin), Code et Libellé gardés, Description réduite ou en infobulle si la largeur
      manque.
- [x] Build web vert, `npm test` vert, scripts/check.sh vert
- [x] CHANGELOG (« Non publié ») : l'entrée TPE-03 mise à jour

## Compte rendu final


Fait : tableau des classes en matrice (colonnes par type actif via classTypeColumns.jsx,
pastille Badge colorée + code, libellé en infobulle ; Switch par case, enregistrement à chaque
clic par onSaveTypes, Spinner pendant l'envoi, liste mise à jour seulement après réponse donc
retour à l'état précédent et message d'erreur en cas d'échec). Mention « tous permis » sur la
ligne sans case cochée et légende au-dessus. Lecture seule sans le droit. Cases retirées de la
fenêtre de modification. Description tronquée avec infobulle, défilement horizontal.
Vérifications : build, npm test (56), check.sh verts. Rendu à l'écran NON VÉRIFIÉ.

Correction après essai à l'écran (2026-11-20) : le conteneur à défilement horizontal ajouté autour du tableau empêchait l'en-tête collant de DataTable ; retiré, l'en-tête reste visible au défilement.
