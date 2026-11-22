# Coordination

La page **Coordination** sert à préparer et tenir la réunion de coordination : voir la
semaine, repérer les équipements qui chargent le service, confier les tâches et solder ce
qui doit l'être.

## L'écran en trois zones

Le titre affiche la semaine : « Planning de la semaine · 16 nov. – 20 nov. 2026 ». Les
boutons de l'en-tête sont :

- les flèches **‹** et **›** pour changer de semaine, et **Auj.** pour revenir à la
  semaine en cours ;
- **Nouvelle inter**, qui ouvre la fenêtre de création d'une intervention (voir
  [Interventions et tâches](/responsable/interventions-taches)).

### 1. Le planning de la semaine

Cinq colonnes, du lundi au vendredi. Chaque colonne montre les tâches dont l'**échéance**
tombe ce jour-là, terminées comprises. Une tâche affiche :

- le code de l'équipement ;
- les initiales de son garant ;
- son libellé ;
- le titre de son intervention.

Au-delà de six tâches dans une journée, la colonne indique « +N autres ». Une journée vide
affiche « Aucune tâche ». Le jour en cours est souligné.

Une tâche n'apparaît ici que si elle a une échéance : pensez à la renseigner quand vous
confiez la tâche.

### 2. Les équipements

À gauche, la liste des équipements, triée d'abord par santé (du plus dégradé au moins
dégradé), puis par charge. Une barre de couleur indique la santé. Deux badges signalent
la charge :

- **N iv** : le nombre d'interventions non fermées (ouvertes ou en attente) ;
- **N DI** : le nombre de demandes d'intervention « nouvelle ».

Cliquez sur un équipement pour le sélectionner. Un second clic sur lui-même le
désélectionne. Tant qu'aucun équipement n'est choisi, la zone de droite vous invite à en
« Sélectionner un équipement ».

### 3. Les interventions et les demandes de l'équipement

Deux onglets :

- **Interventions** : les interventions non fermées de l'équipement, y compris celles en
  « Attente pièces » ou « Attente production ». Chaque bloc montre le
  code, le titre, le type, puis le **statut** et la **priorité**, que vous modifiez d'un
  clic. Dessous, les tâches, avec les mêmes gestes que dans la fiche de l'intervention :
  affecter un garant, fixer une échéance, **Terminé** et **Annuler** avec motif, et
  « Ajouter une tâche… ». Les tâches sans échéance sont regroupées sous « Sans
  échéance ».
- **Demandes** : les demandes « nouvelle » de l'équipement, avec leur âge en jours (orange
  après 3 jours, rouge après 7), le demandeur, le service et la description. Le bouton
  **Créer inter** ouvre la fenêtre de création.

Quand rien ne correspond, l'écran dit « Aucune intervention ouverte » ou « Aucune demande
pour cet équipement ».

## Créer une intervention depuis une demande

Le bouton **Créer inter** d'une demande ouvre la fenêtre « Nouvelle intervention », qui
n'est pas pré-remplie : cherchez l'équipement, cliquez sur la demande dans « Demandes
ouvertes », puis complétez le formulaire. Les étapes sont détaillées dans
[Traiter les demandes](/responsable/demandes).

## Clore une tâche en réunion

Les boutons **Terminé** et **Annuler** de chaque tâche sont réservés au responsable et à
l'administrateur. Une fenêtre de motif s'ouvre toujours : voir
[Interventions et tâches](/responsable/interventions-taches#clore-ou-abandonner-une-tache-en-coordination)
pour les raisons proposées.

## À savoir

- Les statuts d'une intervention portent les mêmes noms partout, ici comme dans la fiche
  de l'intervention : « Ouvert », « Attente pièces », « Attente production » et « Fermé ».
- Si vous modifiez le statut ou la priorité ici et que l'API refuse, aucun message n'est
  affiché. Pour **clore** une intervention, utilisez de préférence sa fiche, qui montre
  les refus (par exemple les tâches obligatoires en attente).
