# 0015. Tâches : une seule présentation, des composants partagés

- Statut : accepté
- Date : 2026-10-11

## Contexte

Les tâches d'une intervention s'affichent à deux endroits du front web, avec deux
présentations différentes :

- l'onglet Tâches du détail d'intervention (`TasksTab`) : liste simple, statut en
  badge à droite, bouton « Ignorer » réservé aux étapes de gamme, création par un
  formulaire ;
- la page Coordination : lignes avec barre de couleur, statut en badge à gauche,
  boutons d'action au survol, affectation et échéance modifiables sur place, création
  par une ligne « + Ajouter une tâche… ».

Les deux écrans n'emploient pas non plus les mêmes libellés de statut (« En attente,
Validée » d'un côté, « À faire, Terminé » de l'autre). L'utilisateur demande que
l'onglet reprenne la présentation de la Coordination.

L'analyse a relevé trois défauts dans les composants de la Coordination :

1. Le badge de statut bascule « À faire » ↔ « En cours » par un PATCH, mais l'API
   n'accepte que `todo` et `skipped` (une tâche ne passe « En cours » ou « Terminé »
   que par une action). Le clic échoue toujours, sans message.
2. Toutes les erreurs d'enregistrement sont avalées sans rien afficher.
3. Le bouton « Ignorer » est proposé à tous les rôles, y compris pour une étape
   obligatoire de gamme. Le backend refuse désormais ce cas aux rôles autres que
   RESP et ADMIN (correctif du 2026-10-11).

## Décision

1. Les composants de ligne de tâche vivent dans `components/tasks/` et servent aux
   deux écrans :
   - `TaskStatusBadge` : statut affiché, sans clic ;
   - `TaskAssignCell` : affectation modifiable sur place (initiales) ;
   - `TaskDueDateCell` : échéance modifiable sur place ;
   - `TaskActionButtons` et `GhostCreateRow`, qui existent déjà.

   La page Coordination importe ces composants au lieu de les définir.
2. L'onglet Tâches garde en haut la barre de progression de la gamme et l'alerte
   « étapes obligatoires en attente ». Chaque tâche est une ligne `GroupCard.Row`
   comme dans la Coordination : barre de couleur selon le statut, statut, libellé
   barré une fois terminé ou ignoré, boutons d'action au survol, affectation et
   échéance. La création passe par `GhostCreateRow`.
3. Le badge d'origine (Gamme, Resp, Tech) et la date de validation ne sont plus
   affichés dans l'onglet. Le badge « Optionnelle » reste affiché sur la ligne, dans
   les deux écrans.
4. Les libellés de statut viennent de `config/taskConfig.js` pour tout le front :
   À faire, En cours, Terminé, Ignoré.
5. Droits, dans les deux écrans :
   - « Ignorer » n'est proposé pour une étape de gamme obligatoire qu'à RESP et ADMIN
     (`canSkipObligatory`), en miroir du contrôle backend qui fait foi ;
   - sans la permission de modifier les tâches, ou sur une intervention fermée, les
     lignes sont en lecture seule ;
   - la ligne de création n'apparaît qu'avec la permission de créer une tâche.
6. Un échec d'enregistrement (statut, affectation, échéance, suppression) affiche le
   message renvoyé par l'API au lieu d'être ignoré.

## Alternatives écartées

1. **Garder deux présentations.** Les deux écrans divergent déjà (libellés, droits,
   gestion d'erreurs) et chaque correction devrait être faite deux fois.
2. **Conserver le clic « À faire » ↔ « En cours » en ouvrant le PATCH à
   `in_progress`.** Cela contredirait la règle du backend selon laquelle une tâche
   n'avance que par une action (philosophie : l'action est l'unité de travail réel).
3. **Lire les rôles autorisés à ignorer dans la matrice de permissions (ADR 0007).**
   Plus souple, mais demande une nouvelle permission et une migration. La liste
   RESP, ADMIN reste en dur, identique au front et au backend, en attendant le
   chantier RBAC.

## Conséquences

- Une seule présentation des tâches à maintenir, et des libellés identiques partout.
- Dans l'onglet, un technicien ne voit plus le formulaire de création complet : la
  ligne fantôme propose libellé, affectation et échéance.
- Le volet Tâches de l'accueil (`TasksPane`) garde ses propres cellules, copies des
  mêmes : leur remplacement par les composants partagés est noté au backlog.
