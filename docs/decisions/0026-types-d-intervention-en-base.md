# 0026. Les types d'intervention vivent en base

- Statut : accepté (2026-11-20, décisions de l'utilisateur)
- Date : 2026-11-20
- Affine : docs/backlog/referentiel-types-statuts-en-base.md (partie types)

## Contexte

Les 8 types d'intervention (CUR, PRE, REA, BAT, PRO, COF, PIL, MES) sont écrits en dur
dans `backend/api/constants.py` et dans `web/src/config/interventionTypes.js` (une
trentaine de fichiers web l'importent), plus `mobile/src/config/badges.js`. La table
`intervention_type` (code, label, color, is_active) existe mais est vide en base de dev ;
seul l'écran Administration → Référentiel la lit.

Constat de l'utilisateur du 2026-11-20 : beaucoup d'interventions classées « Curatif » sont
en fait des projets ou d'autres types. Le type est prérempli à CUR à la création et rien
n'explique les types. Base de dev : 434 interventions, toutes sur les 8 codes ; 49 demandes
suggèrent PRE, les autres aucun type.

Décisions de l'utilisateur du 2026-11-20 : le type est vide et obligatoire à la création,
chaque type porte une description courte affichée dans le sélecteur, et les types vivent en
base, pas dans le code.

## Décision

1. `intervention_type` est la seule source des types. Migration 0020 : colonne
   `description`, les 8 types remplis (libellé, couleur, description) sans rien écraser
   d'existant, mêmes instructions dans les données de départ.
2. Clés étrangères `intervention.type_inter` et `intervention_request.suggested_type_inter`
   vers `intervention_type.code` : un type inconnu est refusé par la base. Le code d'un type
   est figé (il entre dans le code des interventions) ; un type ne se supprime pas une fois
   utilisé, il se désactive.
3. Backend : `GET /interventions/types` lit la table (actifs seulement par défaut) et
   renvoie la description ; validations, filtres, exports et santé des équipements lisent la
   table ; les constantes de types disparaissent. Un type désactivé reste lisible pour
   l'historique mais n'est plus accepté pour une nouvelle intervention, sauf s'il est le
   type suggéré par la demande liée : une demande ne devient pas inacceptable parce que son
   type a été désactivé (décision de l'utilisateur du 2026-11-20, à l'essai à l'écran).
4. Fronts : ils lisent les types depuis l'API, plus de copie en dur. À la création, le type
   est vide et obligatoire, avec la description sous chaque type ; le type suggéré par une
   demande la préremplit toujours (verrouillé pour une demande système).
5. Administration : le libellé, la couleur, la description et l'état actif se modifient ;
   le code non.

## Alternatives écartées

- Garder les constantes et y ajouter les descriptions : deux copies à tenir alignées, et
  l'écran d'administration continue de modifier une table que personne ne lit.
- Une table sans clé étrangère : rien n'empêcherait un type inconnu en base.

## Conséquences

- Les statuts d'intervention, l'autre moitié de la fiche de backlog, restent à faire.
- Changement de schéma et d'API (champ `description` ajouté, liste lue en base), accepté par
  l'utilisateur le 2026-11-20 ; migration à jouer en dev puis en production avec accord.
- Les fronts chargent les types au démarrage ; un échec de chargement doit rester lisible
  (code brut affiché plutôt qu'un écran cassé).
