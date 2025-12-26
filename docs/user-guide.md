# Guide d'Utilisation - Tunnel GMAO

Guide complet pour utiliser Tunnel GMAO au quotidien.

## Vue d'ensemble

Tunnel GMAO est organisé en 5 sections principales :
1. **Tableau de bord** : Vue d'ensemble de l'activité
2. **Machines** : Gestion du parc machines
3. **Demandes** : Demandes d'intervention
4. **Interventions** : Planification et suivi des interventions
5. **Achats** : Gestion des achats et demandes d'achat

## Tableau de bord

Le tableau de bord offre une vue synthétique de l'activité :

### Interventions en retard
Affiche le nombre d'interventions planifiées mais non réalisées dont la date prévue est dépassée. Cliquez sur "Voir les retards" pour obtenir la liste détaillée.

### Demandes en attente
Nombre de demandes d'intervention qui n'ont pas encore été traitées ou planifiées.

### Machines actives
Nombre total de machines en service dans votre parc.

### Analyse du temps
Répartition du temps passé par type d'intervention (corrective, préventive, etc.).

## Gestion des Machines

### Ajouter une machine

1. Cliquez sur "Machines" dans le menu
2. Cliquez sur "+ Ajouter une machine"
3. Remplissez les informations :
   - **Nom** : Nom de la machine (obligatoire)
   - **Référence** : Référence ou numéro de série
   - **Emplacement** : Localisation dans l'atelier
   - **Date d'installation** : Date de mise en service
   - **Notes** : Informations complémentaires

### Consulter les machines

La liste des machines affiche :
- Nom de la machine
- Référence
- Emplacement
- Statut (active, en maintenance, hors service)
- Notes éventuelles

## Demandes d'Intervention

### Créer une demande

1. Cliquez sur "Demandes" dans le menu
2. Cliquez sur "+ Nouvelle demande"
3. Remplissez les informations :
   - **Titre** : Description courte du problème (obligatoire)
   - **Machine** : Sélectionnez la machine concernée
   - **Priorité** : Basse, Normale, Haute, ou Urgente
   - **Description** : Détails du problème
   - **Demandeur** : Personne ayant signalé le problème

### Priorités

- **Basse** : Problème mineur, non bloquant
- **Normale** : Problème standard
- **Haute** : Problème important, à traiter rapidement
- **Urgente** : Problème critique, production arrêtée

### Statuts des demandes

- **pending** : En attente de traitement
- **in_progress** : Intervention planifiée ou en cours
- **completed** : Intervention réalisée
- **cancelled** : Demande annulée

## Interventions

### Créer une intervention

1. Cliquez sur "Interventions" dans le menu
2. Cliquez sur "+ Nouvelle intervention"
3. Remplissez les informations :
   - **Titre** : Objet de l'intervention (obligatoire)
   - **Machine** : Machine concernée
   - **Type** : Corrective, Préventive, ou Amélioration
   - **Date prévue** : Date et heure de l'intervention
   - **Assigné à** : Technicien responsable
   - **Description** : Détails de l'intervention

### Types d'intervention

- **Corrective** : Réparation suite à une panne
- **Préventive** : Maintenance préventive planifiée
- **Amélioration** : Modification ou amélioration d'une machine

### Statuts des interventions

- **planned** : Planifiée, pas encore commencée
- **in_progress** : En cours de réalisation
- **completed** : Terminée
- **cancelled** : Annulée

### Enregistrer le temps passé

Lors de la réalisation d'une intervention :
1. Notez l'heure de début (start_time)
2. Notez l'heure de fin (end_time)
3. Le système calcule automatiquement la durée

Ces données sont utilisées pour l'analyse du temps dans le tableau de bord.

### Suivi des retards

Les interventions sont considérées en retard si :
- Leur statut est "planned" ou "in_progress"
- ET leur date prévue est dépassée

Ces interventions apparaissent dans le tableau de bord avec un indicateur visuel.

## Achats

### Créer une demande d'achat

1. Cliquez sur "Achats" dans le menu
2. Cliquez sur "+ Nouvelle demande d'achat"
3. Remplissez les informations :
   - **Article** : Nom de la pièce ou du matériel (obligatoire)
   - **Quantité** : Nombre d'unités nécessaires
   - **Prix unitaire** : Prix par unité
   - **Fournisseur** : Nom du fournisseur
   - **Machine** : Machine concernée (optionnel)
   - **Description** : Détails complémentaires

### Statuts des achats

- **requested** : Demande créée, en attente de validation
- **ordered** : Commande passée
- **received** : Matériel reçu
- **cancelled** : Demande annulée

### Liaison avec les interventions

Les achats peuvent être liés à une intervention spécifique pour faciliter le suivi des coûts et de la disponibilité des pièces.

## Bonnes Pratiques

### Organisation des demandes

1. **Créez une demande dès qu'un problème est signalé**
   - Permet de ne rien oublier
   - Assure la traçabilité

2. **Définissez la bonne priorité**
   - Urgente : production arrêtée
   - Haute : risque d'arrêt imminent
   - Normale : problème sans impact immédiat
   - Basse : amélioration, confort

### Planification des interventions

1. **Planifiez les interventions préventives**
   - Consultez les recommandations constructeur
   - Créez des interventions récurrentes

2. **Groupez les interventions**
   - Optimisez les déplacements
   - Regroupez les interventions par zone

### Suivi du temps

1. **Enregistrez systématiquement les temps**
   - Permet l'analyse des performances
   - Aide à identifier les machines problématiques

2. **Utilisez les bons types d'intervention**
   - Facilite l'analyse du temps passé
   - Permet d'optimiser la maintenance préventive

### Gestion des achats

1. **Liez les achats aux interventions**
   - Facilite le suivi des coûts
   - Permet l'analyse financière

2. **Mettez à jour les statuts**
   - Permet de suivre les commandes en cours
   - Évite les commandes en double

## Analyse et Rapports

### Analyse du temps

Le tableau de bord affiche :
- Temps total par type d'intervention
- Nombre d'interventions par type
- Temps moyen par type

Cette analyse permet :
- D'optimiser l'organisation
- D'identifier les besoins en formation
- De justifier les investissements en préventif

### Suivi des retards

Les interventions en retard sont un indicateur clé :
- Trop de retards = planification insuffisante
- Retards récurrents sur une machine = problème chronique
- Retards sur préventif = risque de pannes

## Astuces

### Raccourcis

- Cliquez directement sur les compteurs du tableau de bord pour voir les détails
- Utilisez les onglets pour naviguer rapidement

### Organisation

- Créez des conventions de nommage pour les machines
- Utilisez les notes pour documenter les particularités
- Maintenez les informations à jour régulièrement

## Support

Pour toute question :
- Consultez la [documentation technique](architecture.md)
- Ouvrez une [issue sur GitHub](https://github.com/ProtoGulix/tunnel-gmao/issues)
