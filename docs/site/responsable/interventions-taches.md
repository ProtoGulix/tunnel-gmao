# Interventions et tâches

Une intervention est le chantier de maintenance sur un équipement. Elle se découpe en
tâches. Le travail réel est saisi par les techniciens sous forme d'actions ; vous, vous
créez, confiez, clôturez et rouvrez.

![Page Interventions : la liste à gauche, le détail d'une intervention à droite](/captures/web-direction-interventions.webp)

## La page Interventions

Ouvrez **Interventions**. L'onglet « Interventions » est en deux parties.

- **La liste**, à gauche, avec une recherche et des groupes : **À faire**, **Bloqué**,
  **Projets**, **À archiver**, ou **Tout**. Le nombre d'interventions de chaque groupe est
  entre parenthèses.
- **Le détail**, à droite, avec en en-tête l'équipement, le code, le titre, le **Statut**,
  la **Priorité**, le type et un lien vers la demande liée. Les onglets sont **Actions**,
  **Tâches**, **Achats**, **Demande** (si une demande est liée), **Résumé**, **Fiche** et
  **Historique**.

Le menu « ⋯ » de l'en-tête propose « Demander le pointage », « Copier le code » et
« Supprimer ».

Le bouton **Exporter les fiches fermées** (en haut de la page) ouvre une fenêtre pour
imprimer ou télécharger les fiches d'une période : 100 fiches au maximum, rangées par
équipement puis par date de fermeture. Vous pouvez imprimer en PDF ou télécharger en ZIP,
puis **marquer ces fiches comme imprimées**.

## Créer une intervention

Cliquez sur **Nouvelle intervention**. La fenêtre est la même depuis la page
Interventions et depuis la [Coordination](/responsable/coordination).

1. Cherchez l'équipement.
2. **Choisissez une demande** dans la liste « Demandes ouvertes » de l'équipement, ou
   saisissez le demandeur, le service (facultatif) et la description.
3. Indiquez la **date de prise en charge**, le **technicien pilote**, le **type** et la
   **priorité**. Le type, le technicien et la date sont obligatoires.
4. Cliquez sur **Enregistrer**.

Si vous avez saisi une nouvelle demande, la demande et l'intervention sont créées ensemble :
si l'une échoue, rien n'est écrit. Cette demande est « directe » et **ne notifie
personne**. Les tâches s'ajoutent ensuite, dans l'onglet **Tâches**.

Les types proposés dépendent de la classe de l'équipement : une classe sans réglage accepte
tous les types.

## Les tâches

L'onglet **Tâches** affiche une ligne par tâche :

- le **statut** : À faire, En cours, Terminé ou Ignoré ;
- le libellé, avec le badge « Optionnelle » pour une tâche facultative ;
- les boutons **Terminé** et **Annuler** (voir plus bas) ;
- le **garant** : un rond avec les initiales de la personne, ou « + » si personne n'est
  affecté ;
- l'**échéance**.

Une tâche vient d'un responsable, d'un technicien ou d'une étape de gamme préventive. Pour
une intervention préventive, une barre « Gamme : X / Y terminée(s) » montre l'avancement et
signale les étapes obligatoires en attente.

### Ajouter une tâche

Cliquez sur la ligne « Ajouter une tâche… », saisissez le libellé, choisissez
éventuellement la personne affectée et la date, puis cliquez sur **Créer**.

### Affecter un garant

Le **garant** est la personne affectée à la tâche : elle répond de sa finalisation. Cliquez
sur son rond d'initiales (ou sur « + »), puis choisissez une personne dans la liste, ou
« Non assigné ».

Un garant n'est pas forcément celui qui fait le travail. Les **exécutants** sont ceux qui
saisissent des actions sur la tâche. Le [Bilan](/responsable/bilan) mesure l'écart, sans
nommer personne.

::: info Motif demandé
Dans la configuration de départ, changer l'affectation ou l'échéance d'une tâche ouvre la
fenêtre « Raison de la modification ». C'est une règle d'audit : l'administrateur peut la
changer. Voir [Audit et motifs](/responsable/audit-motifs).
:::

### Quand une tâche avance

Une tâche passe « En cours » puis « Terminé » quand un technicien saisit une action et la
lie à la tâche. Le badge de statut ne se modifie pas à la main.

### Clore ou abandonner une tâche en coordination

En réunion de coordination, vous constatez qu'une tâche est faite sans qu'aucune action
n'ait été saisie, ou qu'elle n'a plus lieu d'être. Les boutons **Terminé** et **Annuler**
sont réservés au responsable et à l'administrateur. Ils apparaissent sur les tâches « à
faire » ou « en cours ».

1. Cliquez sur **Terminé** (travail fait) ou **Annuler** (tâche abandonnée).
2. La fenêtre de motif s'ouvre **toujours**. Choisissez une raison.
3. Cliquez sur **Confirmer**. Si vous fermez la fenêtre sans choisir, la tâche reste telle
   quelle.

Les raisons proposées dans la configuration de départ :

| Bouton | Raisons |
| --- | --- |
| Terminé | Réalisée sans action saisie ; Traitée dans une autre intervention ; Autre raison |
| Annuler | Plus nécessaire ; Doublon ; Traitée dans une autre intervention ; Autre raison |

« Annuler » met la tâche au statut **Ignoré**. Avec « Autre raison », la **Précision** est
obligatoire. Une tâche clôturée ainsi n'ajoute aucun temps : aucune action n'est créée
à votre place. L'auteur de la clôture est enregistré.

Une icône « Ignorer » apparaît aussi au survol d'une tâche : elle fait la même chose
qu'« Annuler ». Ignorer une **étape obligatoire** d'un plan préventif est réservé au
responsable et à l'administrateur. Des icônes permettent de « Remettre à faire » une tâche
terminée ou d'« Annuler l'exclusion » d'une tâche ignorée.

### Supprimer une tâche

La corbeille n'est active que pour une tâche « à faire » sans action liée, sur une
intervention non fermée. Un compte à rebours de 5 secondes laisse le temps d'annuler. Un
motif est demandé.

## Clore une intervention

Dans l'en-tête du détail, ouvrez la liste **Statut** et choisissez **Terminée**. Les
statuts proposés sont : En cours, Attente pièces, Attente prod. et Terminée.

- **Les tâches obligatoires doivent être réglées.** Tant qu'une tâche non facultative est
  « à faire » ou « en cours », l'API refuse : « Impossible de fermer : N tâche(s)
  non-optionnelle(s) en attente. ». Réglez-les, ou clôturez-les en coordination (voir
  plus haut).
- **Un motif peut être demandé**, selon les règles d'audit.
- La **demande liée se clôture avec l'intervention**.
- Une intervention fermée est **verrouillée** : plus aucune écriture sur elle, ses actions
  ou ses tâches, sauf le changement de statut qui permet de la rouvrir (avec un motif).

Dans le formulaire d'action du web, la question « L'intervention est-elle terminée ? »
propose aussi « Oui, clôturer » ou « Non, laisser ouverte ». Elle passe par les mêmes
contrôles.

## Rouvrir une intervention

Sur une intervention fermée, changez le **Statut** pour un autre statut. La fenêtre de
motif s'ouvre **toujours**, avec trois raisons dans la configuration de départ :

- Clôturée par erreur ;
- Travail à reprendre ;
- Autre raison (la **Précision** est alors obligatoire).

La réouverture a trois effets, dans la même opération :

- la demande liée repasse « acceptée » ;
- l'occurrence préventive liée, si elle était « Clôturée », repasse « En cours » ;
- l'événement est inscrit dans le journal, avec votre nom et le motif.

Pour le préventif, la prochaine échéance repart de la nouvelle clôture (voir
[Préventif](/responsable/preventif)).

## Supprimer une intervention

Le menu « ⋯ » propose « Supprimer ». Il est grisé, avec une explication, si l'intervention
est fermée ou si elle a des actions ou des achats. Un motif est demandé. Si une demande est
liée, vous choisissez son sort : **Rouvrir la demande** ou **Supprimer aussi la demande**.
Pour une demande venue du préventif, seule la réouverture est possible.
