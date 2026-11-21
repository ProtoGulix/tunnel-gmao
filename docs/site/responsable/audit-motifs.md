# Audit et motifs

Tunnel enregistre ce qui s'est réellement passé, et qui l'a fait. Une trace qu'on peut
falsifier ne vaut rien. C'est pourquoi une décision qui sort du travail normal demande un
**motif**.

![Onglet Audit du Bilan : décisions hors travail normal et modifications automatiques](/captures/web-direction-bilan-audit.webp)

## Travail normal et décision

Dans le **travail normal**, les actions des techniciens racontent le travail : temps passé,
nature, complexité. Rien de plus n'est demandé.

Une **décision** est un changement qui ne vient pas d'une action : clôturer, rouvrir,
ignorer une tâche, rejeter une demande, supprimer. Pour ces changements, Tunnel veut savoir
**pourquoi**. Le motif s'ajoute à l'auteur et à la date, toujours enregistrés.

L'auteur est celui qui est connecté. Un champ « au nom de » (par exemple le technicien
d'une action) est une information libre, jamais une preuve d'identité.

## La fenêtre de motif

Quand un motif est demandé, une fenêtre s'ouvre, la même partout dans Tunnel. Elle se
nomme « Raison de la modification » (ou « Raison de la suppression ») et dit : « Cette
action nécessite une raison d'audit. »

1. Choisissez une **Raison** dans la liste.
2. Ajoutez une **Précision**. Elle est facultative, sauf avec « Autre raison » : le texte
   est alors obligatoire.
3. Cliquez sur **Confirmer**.

Si vous fermez la fenêtre ou cliquez sur **Annuler**, rien n'est modifié.

Les raisons proposées dépendent de la décision : on ne vous propose pas « Doublon » pour
terminer une tâche. Si la liste est vide, l'écran dit : « Aucun motif disponible pour cette
décision. Un administrateur doit en ajouter. »

## Quand un motif est-il demandé ?

C'est une **règle d'audit** qui décide, par type d'élément et parfois par champ. Une règle
est soit **routinière**, soit **sensible** :

- **routinière** : le changement est enregistré avec un motif par défaut, sans rien vous
  demander ;
- **sensible** : la fenêtre de motif s'ouvre.

Dans la configuration de départ :

| Décision | Motif |
| --- | --- |
| Clore une tâche (Terminé) ou l'abandonner (Annuler, Ignorer) | Toujours demandé |
| Rouvrir une intervention fermée | Toujours demandé |
| Ignorer une occurrence préventive | Toujours demandé |
| Supprimer (tâche, intervention, demande), désactiver un plan | Toujours demandé |
| Changer l'affectation ou l'échéance d'une tâche | Demandé |
| Rejeter une demande | Selon la règle (routinière au départ) |
| Clore une intervention | Selon la règle (routinière au départ) |
| Créer une demande, une intervention, une action | Jamais : routinier |

Les cas « Toujours demandé » ne dépendent pas de la configuration : le serveur refuse la
décision sans motif. Les autres peuvent être changés par l'administrateur.

## Un motif manque ?

Les motifs et les règles se gèrent dans **Administration**, onglet **Audit**, sous-onglets
**Règles** et **Raisons**. Vous pouvez les consulter ; seul l'**administrateur** les
modifie. Il n'y a pas de motif codé en dur : si une raison manque, demandez à
l'administrateur de l'ajouter.

## Le journal

Le **Journal d'audit** se trouve dans **Administration**, onglet **Audit**, sous-onglet
**Journal**. Il est en lecture seule et se met à jour avec le bouton **Actualiser**.

Chaque ligne donne :

| Colonne | Contenu |
| --- | --- |
| Date & heure | Quand. |
| Entité | Intervention, Demande DI, Demande DA, Tâche, Action ou Équipement, avec un identifiant court. |
| Décision | Par exemple « Statut modifié », « Affectation modifiée », « Échéance modifiée », « Créé », « Supprimé ». |
| Modification | L'ancienne et la nouvelle valeur. |
| Raison | Le motif choisi. |
| Précision | Le texte saisi (survolez-le pour le lire en entier). |
| Par | Les initiales de l'auteur (survolez-les pour le nom complet). |

Les filtres sont **Entité**, **Type de décision**, **Raison**, **Du** et **Au**. Cliquez sur
**Filtrer** pour les appliquer, sur **Réinitialiser** pour les retirer. Le journal affiche
les modifications des utilisateurs, pas les événements du système.

Le journal ne peut être **ni modifié ni effacé par l'application** : les tables de journal
n'acceptent que l'ajout.

## Les événements du système

Quand une décision en entraîne d'autres, Tunnel les enregistre aussi. Par exemple, rouvrir
une intervention repasse la demande liée « acceptée » et rouvre l'occurrence préventive :
chacun de ces effets laisse son propre événement, attribué à l'auteur de la requête.

Les traitements automatiques, comme la génération quotidienne du préventif, sont tracés
avec le motif « SYSTEM_SCHEDULE » et sans auteur humain. Le [Bilan](/responsable/bilan)
compte ces événements dans « Modifications automatiques ».

## Lire l'audit dans le Bilan

L'onglet **Audit** du [Bilan du service](/responsable/bilan) résume tout cela en chiffres
d'équipe : tâches sans garant, tâches faites sans action du garant, tâches partagées,
décisions hors travail normal (par type et motif), part des modifications automatiques.
Aucun chiffre n'est donné par personne.
