# 0031. Types d'intervention permis par classe d'équipement

- Statut : accepté (2026-11-20, décisions de l'utilisateur)
- Date : 2026-11-20
- Prolonge : ADR 0026 (types d'intervention en base)

## Contexte

Demande de l'utilisateur du 2026-11-20 (docs/backlog/types-intervention-par-equipement.md) :
ne proposer que les types qui ont un sens pour l'équipement choisi (pas de BAT sur un
équipement immatériel comme SUPP). Base de dev, lecture seule : 73 classes d'équipement,
17 équipements sur 352 sans classe, dont SUPP ; 14 interventions sur SUPP dont 3 CUR et
1 PRO, signe du même défaut de classement que celui qui a motivé l'ADR 0026.

## Décision

1. **La règle vit sur la classe d'équipement** : une table de liaison
   `equipement_class_intervention_type (equipement_class_id, intervention_type_code)`,
   clé primaire sur le couple, clés étrangères vers `equipement_class` et
   `intervention_type(code)` (migration 0023).
2. **Liste des types permis** : une classe sans ligne permet tous les types ; une classe
   avec des lignes ne permet que ceux-là. Un équipement sans classe permet tous les types.
   Un équipement immatériel comme SUPP reçoit une classe (par exemple « Immatériel ») depuis
   l'administration : aucune donnée n'est créée par la migration.
3. **Le backend vérifie** à la création d'une intervention et quand son type ou son
   équipement change (400, message qui liste les types permis). Une intervention existante
   dont le type n'est plus permis reste lisible et modifiable tant que ni son type ni son
   équipement ne changent (même logique que le type désactivé, ADR 0026).
4. **Le type de l'équipement l'emporte sur le type suggéré** par une demande : un type
   suggéré non permis n'est ni imposé ni pré-rempli ; le technicien choisit parmi les types
   permis. Un type suggéré permis garde le comportement de l'ADR 0026 (imposé, cadenassé).
5. **L'API donne la liste** : la lecture des types accepte un équipement
   (`machine_id`) et ne renvoie alors que les types permis ; l'administration d'une classe
   lit et remplace sa liste de types permis, sous le droit qui protège déjà la
   modification des classes, avec la trace d'audit habituelle.
6. **Le préventif est toujours permis pour ses propres interventions** (décision de l'agent
   principal du 2026-11-20, relevée pendant TPE-02) : une intervention issue d'un plan
   préventif (acceptation automatique ou acceptation d'une demande préventive) peut être
   de type PRE même si la classe ne le liste pas. Un plan préventif est une configuration
   délibérée ; sans cette exemption, une classe sans PRE ferait échouer toute la
   génération quotidienne (tout ou rien). Une intervention PRE manuelle, sans plan, suit la
   règle commune.
7. **Fronts** : le sélecteur de type du web et du mobile lit la liste filtrée par
   l'équipement choisi et se recharge quand l'équipement change ; le web ajoute la liste
   des types permis à l'administration des classes.

## Alternatives écartées

- Règle par équipement : réglage machine par machine, 352 équipements à entretenir.
- Liste des types interdits : moins lisible (« tout sauf ») et un type ajouté plus tard
  serait permis partout sans décision.
- Type suggéré prioritaire : laisserait passer exactement le classement que la règle veut
  empêcher.

## Conséquences

- Migration 0023 et changement d'API acceptés par l'utilisateur le 2026-11-20 (jouer la
  migration en dev demande son accord).
- Sans réglage des classes, rien ne change : la règle ne s'applique qu'aux classes que
  l'administration remplit.
