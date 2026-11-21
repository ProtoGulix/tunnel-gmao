# Interventions et tâches

Une **demande** dit qu'il y a quelque chose à faire. Une **intervention** organise le travail.
Des **tâches** la découpent. Cette page décrit les statuts de chacune, et comment elles se
ferment ensemble.

![Cycle de vie d'une demande d'intervention et de l'intervention liée : la création de l'intervention accepte la demande, la clôture de l'intervention clôt la demande, la réouverture la remet à acceptée](/schemas/cycle-demande-intervention.svg)

## La demande d'intervention

Une demande a cinq statuts. Les passages permis sont fixés par l'API.

| Statut | Sens | Passages possibles |
| --- | --- | --- |
| Nouvelle | La demande vient d'arriver. | En attente, Acceptée, Rejetée |
| En attente | La demande est mise de côté. | Acceptée, Rejetée |
| Acceptée | Une intervention a été créée. | Clôturée |
| Rejetée | Refusée. | Aucun (statut final) |
| Clôturée | L'intervention liée est fermée. | Aucun (sauf réouverture, voir plus bas) |

Source : `ALLOWED_TRANSITIONS` dans `backend/api/intervention_requests/validators.py`.

Trois règles résument le cycle.

- **Accepter, c'est créer l'intervention.** Il n'y a pas d'intervention sans demande. Pour
  accepter, il faut un type d'intervention et un technicien. Voir
  [Traiter les demandes](/responsable/demandes).
- **Rejeter exige un motif**, choisi parmi les motifs de rejet. « Autre raison » demande un
  texte. Une demande rejetée ne change plus. Voir [Audit et motifs](/comprendre/audit).
- **Clôturer la demande se fait par l'intervention.** Tant que l'intervention est ouverte,
  l'API répond : « Clore l'intervention : elle clôturera la demande. »

## Le lien demande et intervention

- Une demande porte **au plus une intervention**. Une demande déjà liée ne peut pas être
  acceptée une seconde fois.
- Une intervention vient **toujours d'une demande**. Si vous créez une intervention sans choisir
  de demande, Tunnel crée la demande avec elle, dans la même opération : si l'une échoue,
  rien n'est écrit.
- Les deux se suivent : clôturer l'intervention clôture la demande, la rouvrir repasse la
  demande à « Acceptée ».

## L'intervention

Le statut d'une intervention vient d'un référentiel que l'administrateur peut ajuster. Dans la
configuration de départ, on trouve : Ouvert, Attente pièces, Attente production et Fermé. Un
seul statut a un sens fixe pour Tunnel : **Fermé**. Il verrouille l'intervention.

Une intervention fermée est **verrouillée** : plus aucune écriture sur elle, sur ses actions
ni sur ses tâches, sauf le changement de statut qui permet de la rouvrir.

### Clore

On clôt une intervention en changeant son statut vers « Fermé ». C'est la seule porte.

- Tant qu'une tâche **obligatoire** est « à faire » ou « en cours », l'API refuse :
  « Impossible de fermer : N tâche(s) non-optionnelle(s) en attente. » Les tâches facultatives
  ne bloquent pas.
- La demande liée se clôt dans la même opération, et laisse un événement du système.
- Un motif peut être demandé, selon les règles d'audit.

### Rouvrir

Changer le statut d'une intervention fermée vers un autre statut la rouvre. Un **motif est
toujours exigé** : « Clôturée par erreur », « Travail à reprendre » ou « Autre raison » dans la
configuration de départ. La réouverture a ces effets, dans la même transaction :

- la demande liée repasse « Acceptée » ;
- l'occurrence préventive liée, si elle était « terminée », repasse « en cours » ;
- le journal garde l'événement, avec l'auteur et le motif.

Voir [Clore ou rouvrir](/technicien/cloturer-rouvrir) et
[Interventions et tâches](/responsable/interventions-taches) pour les écrans.

### Supprimer

Une intervention ne se supprime pas si elle est fermée, ni si elle a des actions ou des
demandes d'achat liées. Un motif est demandé, et il faut choisir le sort de la demande
liée : la rouvrir pour la traiter autrement, ou la supprimer avec l'intervention.

## Les tâches

![Cycle de vie d'une tâche : à faire, en cours, terminée ou ignorée, avec ce qui déclenche chaque passage](/schemas/cycle-tache.svg)

Une tâche est un morceau de l'intervention. Elle porte :

- une **origine** : `plan` (une étape de gamme préventive), `resp` (un responsable) ou `tech`
  (un technicien) ;
- un caractère **obligatoire** ou **facultatif** ;
- un **garant** : la personne affectée, qui répond de sa finalisation. Ce n'est pas forcément
  celle qui fait le travail : les exécutants sont ceux qui saisissent des actions ;
- une échéance et un ordre.

Quatre statuts : **à faire**, **en cours**, **terminée**, **ignorée**.

| Passage | Ce qui le provoque |
| --- | --- |
| À faire vers En cours | Une action est liée à la tâche. |
| En cours ou À faire vers Terminée | Une action liée « termine la tâche ». |
| Terminée sans action | Un responsable ou un administrateur la déclare faite, avec un motif. |
| Vers Ignorée | Une personne l'abandonne, avec un motif, depuis la tâche ou en saisissant une action. Pour une étape obligatoire d'un plan, seuls le responsable et l'administrateur peuvent le faire. |
| Terminée ou Ignorée vers À faire | « Remettre à faire ». |

Une tâche déjà terminée ou ignorée n'accepte plus de nouvelle action : il faut d'abord la
remettre à faire.

Sources : `backend/api/intervention_actions/repo.py` (passage « en cours » et « terminée » par
une action), `backend/api/intervention_tasks/routes.py` et `validators.py` (passages directs
et rôles).

Autres règles :

- le badge de statut ne se modifie pas à la main : c'est l'action qui fait avancer la tâche.
  La **coordination** est l'exception : elle permet de clore une tâche sans action. Voir
  [Coordination](/responsable/coordination) ;
- une tâche terminée en coordination n'ajoute aucun temps : aucune action n'est créée à votre
  place, et l'auteur de la clôture est enregistré ;
- une tâche ne se supprime que si elle est « à faire », sans action liée, sur une intervention
  non fermée.
