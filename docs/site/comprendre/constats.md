# Le constat

Après un arrêt, le technicien dit ce qui l'aurait évité. Ce retour terrain devient une
demande à trancher, ou reste une donnée d'analyse. La donnée aide à décider, elle ne décide
jamais.

![Le constat : à la clôture d'une intervention, le constat dit ce qui aurait évité l'arrêt ; si un levier coché génère une demande, une demande d'intervention est créée et le responsable l'accepte, la rejette ou la rattache à une idée ; sinon le constat reste une donnée d'analyse ; tous les constats alimentent l'onglet Constats du Bilan](/schemas/boucle-du-constat.svg)

## Quand

- **À la clôture**, obligatoire pour les types d'intervention qui l'exigent (case **Constat
  obligatoire** du référentiel ; curatif au départ). Aucune clôture sans constat, quel que
  soit le chemin.
- **Après la clôture**, tant que l'intervention n'est pas archivée.
- Une intervention accepte **plusieurs constats**, chacun avec son auteur.

## Le formulaire

Uniquement des choix, sans texte libre, pour une saisie courte et des chiffres exploitables :

- **Qu'est-ce qui aurait réduit ou évité cet arrêt ?** Plusieurs leviers possibles, chacun
  avec sa sous-question (fréquence, ancienneté du problème, domaines, paramètres).
- **Signal visible avant la panne ?**
- **Machine visée**, pré-remplie avec celle de l'intervention, et **parties concernées**.

## Demande ou pas

Chaque levier dit s'il crée une demande. Réglage au départ :

| Levier | Demande créée |
| --- | --- |
| Tâche de maintenance régulière | oui, type préconisé préventif (PRE) |
| Projet ou modification | oui, type préconisé projet (PRO) : une idée d'amélioration |
| Formation, Surveillance ou inspection, Autre | non |
| Rien ne l'aurait évité | non ; ce choix ne se combine avec aucun autre |

Un seul constat crée au plus une demande, sur la machine visée. Son type préconisé est celui
du premier levier typé coché. Le réglage se change dans le
[référentiel des constats](/administrateur/referentiels) ; il ne vaut que pour les constats
saisis ensuite.

## Ce que devient la demande

C'est une demande comme les autres, dans la même liste. Le responsable la tranche
([Traiter les demandes](/responsable/demandes#demande-issue-d-un-constat)) :

- **acceptée** : l'intervention est créée, avec le type préconisé ou un autre ;
- **rejetée**, avec un motif ;
- **rattachée** à une idée d'amélioration ouverte de la même machine : le constat garde le
  lien, la demande est rejetée en doublon.

## Corriger

Un constat ne s'écrase pas : une correction crée une version nouvelle, avec le motif
« Correction ».

- Avec demande : par l'auteur ou un responsable, tant que la demande est « nouvelle ».
- Sans demande : par l'auteur ou un responsable, tant que l'intervention n'est pas archivée.
  Si la nouvelle version coche un levier qui crée une demande, elle est créée.
- Une correction ne retire jamais une demande : le responsable la rejette s'il le faut.

## Ce qu'on en tire

Tous les constats, avec ou sans demande, alimentent l'onglet
[Constats du Bilan](/responsable/bilan#l-onglet-constats) : leviers, signal précurseur,
ancienneté du problème, devenir des demandes. Aucun chiffre par personne.
