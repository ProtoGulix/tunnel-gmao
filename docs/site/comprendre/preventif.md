# Le préventif

Le préventif de Tunnel ne repose pas sur un calendrier fixe. Il repose sur un **plan** par
classe d'équipement, et sur une échéance qui **glisse** : elle repart de la dernière
réalisation.

![Le cycle du préventif : le plan et sa gamme, la génération une semaine avant l'échéance, la demande système, l'intervention et ses tâches, la clôture qui fait glisser l'échéance suivante](/schemas/cycle-preventif.svg)

## Le plan, la classe, la gamme

- Un **plan** est rattaché à une **classe** d'équipement. Il vaut pour **toutes les machines**
  de cette classe, pas pour une seule.
- Il se déclenche par une **périodicité en jours**, ou par un **seuil d'heures**.
- Sa **gamme** est la liste de ses étapes, obligatoires ou facultatives. Une gamme appartient
  à son plan : elle ne se partage pas entre plusieurs plans.
- À chaque occurrence, **chaque étape devient une tâche**, avec l'origine « plan ». Une étape
  obligatoire bloque la clôture de l'intervention tant qu'elle n'est pas réglée.

Les écrans sont décrits dans [Préventif](/responsable/preventif).

::: warning Plan par compteur d'heures
Tunnel ne relève pas le compteur réel des machines : il cumule le temps passé en
intervention, pas les heures de fonctionnement. Pour un plan par heures, l'échéancier affiche
« non calculé ». Cette page décrit donc la périodicité en jours.
:::

## L'occurrence

Une **occurrence** est un passage d'un plan sur une machine. Elle a une date prévue et une
demande d'intervention créée par le système, avec le type « préventif » suggéré.

| Statut | Sens |
| --- | --- |
| Générée | L'occurrence existe, sa demande attend d'être traitée. |
| En cours | La demande a été acceptée : l'intervention existe. |
| Terminée | L'intervention est fermée, la demande est clôturée. |
| Ignorée | L'occurrence est écartée, par la décision d'une personne. |

L'occurrence suit sa demande et son intervention :

- accepter la demande (ou la création automatique) la passe **en cours** ;
- clore l'intervention la passe **terminée** ;
- **rouvrir** l'intervention la repasse **en cours** ;
- **rejeter** la demande la passe **ignorée**.

Source : `backend/api/preventive_occurrences/cascade.py` et `repo.py`. Une occurrence
porte brièvement un statut « en attente » à sa création, avant que sa demande ne soit posée.

Quand le plan est en **création automatique**, l'intervention est créée sans validation de
votre part.

## L'échéancier glissant

L'échéance d'un plan sur une machine se calcule ainsi :

**référence + périodicité en jours = prochaine échéance.**

- La **référence** est la **date de clôture de la demande** de la dernière occurrence
  terminée. Sans date de clôture, c'est la date prévue de cette occurrence.
- **Sans historique**, l'échéance est aujourd'hui.
- Une occurrence ignorée parce que sa **demande a été rejetée** n'est pas une référence : le
  préventif n'a pas été fait, l'échéance reste celle d'avant.
- Si l'intervention est **rouverte** puis refermée, la nouvelle clôture devient la référence.

Conséquence : si vous faites un préventif en retard, les suivants repartent de sa clôture. Si
vous le faites en avance, ils repartent plus tôt.

Source : `schedule.py` et `_LAST_TERMINATED_LATERAL` dans
`backend/api/preventive_occurrences/`.

## Avance et retard

L'échéancier range chaque ligne dans un état :

- **en retard** : l'échéance est passée (le retard se compte en jours) ;
- **cette semaine** : l'échéance tombe dans la période de prévenance, de 7 jours par défaut ;
- **à venir** : l'échéance est plus lointaine ;
- **non calculé** : plan par compteur d'heures.

## La génération, une semaine avant

Une **tâche quotidienne** de l'API génère les occurrences. Dès que l'échéance entre dans la
prévenance de 7 jours, Tunnel crée l'occurrence, sa demande système et ses tâches. La date
prévue de l'occurrence est l'échéance, qui peut être dans le futur.

Règles à connaître :

- **une seule occurrence active** par plan et par machine : tant qu'une occurrence est en
  attente, générée ou en cours, Tunnel n'en crée pas une autre ;
- la tâche tourne une fois par jour, à 5 h par défaut (heure du serveur) ;
- elle est **active par défaut** dans une installation Docker Compose, **inactive** hors
  Compose tant qu'elle n'est pas activée ;
- ses écritures sont tracées comme des événements du système (voir
  [Audit et motifs](/comprendre/audit)).

Le bouton **Générer** de la page des occurrences lance la même génération à la main.

## Lancer en avance

Pour faire un préventif avant la semaine de prévenance, lancez-le **en avance** depuis la
fiche équipement (web seulement). Tunnel crée tout de suite l'occurrence et sa demande, avec
les mêmes règles que la génération. La date prévue reste l'**échéance théorique**, sauf si
elle est déjà passée (alors c'est aujourd'hui) : la fiche peut donc mesurer l'avance prise.

Le lancement en avance est refusé si une occurrence active existe déjà, et pour un plan par
heures. Voir [Préventif](/responsable/preventif#lancer-en-avance).

## Ignorer une occurrence

Ignorer, c'est décider de ne pas faire ce préventif à cette échéance. C'est une **décision**,
donc un **motif est obligatoire**, choisi dans la liste (voir
[Audit et motifs](/comprendre/audit)).

- Le bouton **Ignorer** de la page des occurrences ne s'applique qu'aux occurrences « en
  attente ».
- Pour écarter une occurrence déjà générée, **rejetez sa demande** : l'occurrence passe
  « ignorée ».

## Les notifications

La tâche quotidienne prévient tous les utilisateurs actifs, dans la cloche du menu :

- un **préventif en retard**, au lendemain de l'échéance puis à chaque intervalle de 7 jours
  tant que la situation dure ;
- une **intervention sans action** depuis 7 jours, relancée au même rythme. Une nouvelle
  action remet le compte à zéro.

Les notifications ne partent plus pour une occurrence close ni pour une intervention fermée.
L'intervalle est réglé par `REMINDER_INTERVAL_DAYS` (7 par défaut). Voir
[Notifications et compte](/technicien/notifications).

Sources : `backend/api/jobs/steps.py` et `backend/api/settings.py`.
