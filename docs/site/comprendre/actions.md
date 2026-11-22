# Les actions

L'action est **l'unité de travail réel** de Tunnel. Une intervention organise le travail ;
c'est l'action qui dit ce qui a été fait, par qui, en combien de temps et avec quelle
difficulté. Le temps, la complexité et les pièces ne se saisissent pas sur l'intervention.

![Une action au centre : ce qu'elle contient (temps, nature, complexité, technicien déclaré), ce qui la lie (tâches, intervention) et ce qu'elle alimente (historique de l'équipement, bilan, demandes d'achat)](/schemas/anatomie-action.svg)

## Ce que contient une action

| Élément | Règle |
| --- | --- |
| Intervention | Obligatoire. L'action appartient à une intervention. |
| Tâche | Au moins une tâche de cette intervention. Une action sans tâche est refusée. |
| Technicien | Obligatoire : le technicien **déclaré**. |
| Nature du travail | Une **sous-catégorie**, rattachée à une **catégorie** (voir plus bas). |
| Temps passé | En heures, par pas d'un quart d'heure, minimum 0,25 h. |
| Complexité | Un score entier de 1 à 10, saisi par le technicien. |
| Facteur de complexité | Obligatoire seulement si le score dépasse 5. |
| Description | Une note, facultative côté API. |
| Heures de début et de fin | Facultatives. Sans temps saisi, la base calcule la durée depuis ces heures. |

Sources : `InterventionActionIn` (`backend/api/intervention_actions/schemas.py`) et
`InterventionActionValidator` (`backend/api/intervention_actions/validators.py`).

### Le temps

Le temps est un multiple de 0,25 h : 0,25, 0,5, 0,75, 1,0, et ainsi de suite. Une valeur
inférieure à 0,25 h ou qui n'est pas un multiple de 0,25 est refusée. Sur le mobile, la
durée se calcule depuis les heures de début et de fin, arrondie au quart d'heure (voir
[Saisir une action](/technicien/saisir-une-action)).

### La nature du travail

La nature se choisit en deux niveaux : une catégorie, puis une sous-catégorie. Ce sont des
référentiels que le responsable ou l'administrateur gère. Dans la configuration de départ,
les catégories sont : Dépannage ; Fabrication / Modification ; Préventif / Vérification ;
Support / Coordination ; Bâtiment / Travaux / Aménagement ; Documentation / Schéma.

### La complexité et son facteur

Le technicien note la difficulté de 1 à 10. Tunnel ne la calcule pas. **Au-delà de 5**, il
faut choisir un **facteur de complexité** dans une liste : ce qui explique la difficulté.
Sans facteur, l'action est refusée. Un facteur doit exister dans le référentiel.

## Technicien déclaré, auteur réel

Une action a deux notions de « qui » :

- le **technicien déclaré** est celui que vous indiquez : celui qui a fait le travail. C'est
  une donnée libre. On peut saisir une action pour un collègue ;
- l'**auteur réel** est la personne connectée au moment de l'enregistrement. Il est pris du
  jeton de connexion, jamais d'un champ du formulaire, et il est écrit dans le journal
  d'audit.

Le champ « au nom de » n'est jamais une preuve d'identité. Voir
[Audit et motifs](/comprendre/audit).

## Le lien aux tâches

Une action est liée à une ou plusieurs tâches de son intervention. Ce lien fait avancer la
tâche :

- lier une action à une tâche « à faire » la passe **en cours** ;
- cocher « cette action termine la tâche » la passe **terminée** ;
- l'action peut aussi **annuler** une tâche, avec la raison, sous réserve des droits.

Une tâche déjà terminée ou annulée n'accepte plus d'action. Voir
[Interventions et tâches](/comprendre/interventions-taches).

## Quand le travail réel ne passe pas par une action

Un responsable ou un administrateur peut déclarer une tâche faite sans action, en
coordination, avec un motif. Dans ce cas, **aucun temps n'est ajouté** : Tunnel ne crée
jamais d'action à votre place.

## Ce qu'une action alimente

- **L'historique de l'équipement.** La fiche équipement montre l'état et l'évolution : chiffres
  clés, graphiques mensuels, répartition par type d'intervention, par catégorie d'action et
  par facteur de complexité. Voir [Équipements](/responsable/equipements).
- **Le bilan du service.** Les heures par type d'intervention, la charge, la fragmentation
  et le temps de pilotage se calculent à partir des actions. Aucun chiffre n'est donné par
  personne. Voir [Bilan du service](/responsable/bilan).
- **Les demandes d'achat.** Une demande d'achat peut naître d'une action, quand une pièce
  manque : elle reste liée à cette action. Voir [Achats](/comprendre/achats).

## Supprimer une action

Une action ne se supprime pas si l'intervention est fermée, ni si une demande d'achat liée
est déjà répartie dans un panier. Si elle était la dernière action d'une tâche « en cours »,
cette tâche repasse « à faire ».
