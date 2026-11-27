# Préventif

Le préventif de Tunnel repose sur des **plans**. Un plan est rattaché à une **classe**
d'équipement et vaut pour toutes les machines de cette classe. Il porte une **gamme** :
la liste des étapes à faire à chaque passage.

![Échéancier du préventif : en retard, cette semaine, à venir](/captures/web-direction-preventif-echeancier.webp)

La page **Préventif** a deux onglets : **Plans** et **Échéancier**.

## Les plans

![Un plan préventif : rattaché à une classe, il vaut pour chaque machine de la classe ; il porte un déclencheur, le mode Auto ou Manuel et une gamme ; chaque occurrence crée une tâche par étape](/schemas/plan-preventif.svg)

L'onglet **Plans** liste les plans à gauche (recherche, interrupteur « Actifs
seulement ») et affiche le détail à droite.

Chaque ligne donne le code, le libellé, le déclencheur (par exemple « Périodicité 90j »)
et le nombre d'étapes. Le détail montre la classe, le déclencheur, la mention **Auto** ou
**Manuel**, et deux onglets : **Gamme** et **Occurrences**.

![Onglet Occurrences d'un plan : machine, échéance, statut, demande et intervention de chaque occurrence](/captures/web-direction-plan-occurrences.webp)

Une **occurrence** est un passage du plan sur une machine. Son statut suit sa demande et
son intervention :

![Statuts d'une occurrence : Générée avec sa demande, En cours quand la demande est acceptée ou en plan Auto, Clôturée à la clôture de l'intervention, de nouveau En cours à la réouverture, Ignorée si la demande est rejetée](/schemas/statuts-occurrence.svg)

![Onglet Plans : liste des plans préventifs à gauche, gamme du plan choisi à droite](/captures/web-direction-preventif-plans.webp)

### Créer un plan

Cliquez sur **Nouveau**, puis renseignez :

1. le **Code** : majuscules, chiffres et tirets bas. Il ne change plus ensuite ;
2. le **Libellé** ;
3. la **Classe d'équipement** ;
4. le **Type de déclencheur** : « Périodicité (jours) » avec le nombre de jours, ou
   « Compteur d'heures » avec un seuil en heures ;
5. **Création automatique** : « Créer l'intervention automatiquement sans validation
   RESP ».

Cliquez sur **Créer le plan**. **Modifier** ouvre le même formulaire.

![Formulaire Nouveau plan préventif rempli : code, libellé, classe, périodicité de 90 jours, création automatique](/captures/web-direction-plan-creation.webp)

::: warning Plan par compteur d'heures
Tunnel ne relève pas le compteur réel des machines. Il cumule le temps passé en
intervention, pas les heures de fonctionnement. L'échéance d'un plan par heures reste donc
« non calculée » dans l'échéancier.
:::

### La gamme

L'onglet **Gamme** liste les étapes du plan. Chaque étape devient une **tâche** à chaque
occurrence. Une gamme appartient à son plan : elle ne se partage pas entre plusieurs plans.

- Ajoutez une étape dans la ligne « Nouvelle étape… ». Cochez **Optionnelle** pour une
  étape facultative, puis cliquez sur « + ».
- Les flèches changent l'ordre, la corbeille retire une étape.
- Cliquez sur **Enregistrer** pour valider.

![Onglet Gamme : les étapes avec flèches et corbeille, et une nouvelle étape optionnelle en cours de saisie](/captures/web-direction-plan-gamme.webp)

Une étape **obligatoire** bloque la clôture de l'intervention tant qu'elle n'est pas faite.
Seuls le responsable et l'administrateur peuvent l'ignorer.

### Désactiver et réactiver un plan

**Désactiver** demande une confirmation (« Les occurrences futures ne seront plus
générées. »), puis ouvre la fenêtre de motif. Un plan désactivé porte le badge **Inactif**.
**Réactiver** le remet en service. L'interrupteur « Actifs seulement » masque les plans
inactifs.

![Confirmation Désactiver le plan](/captures/web-direction-plan-desactiver.webp)

![Plan désactivé : badge Inactif dans la liste et le détail, bouton Réactiver ; « Actifs seulement » décoché](/captures/web-direction-plan-inactif.webp)

## L'échéancier glissant

![Déclenchement d'un plan à périodicité : la référence plus la périodicité donne l'échéance ; À venir, puis Cette semaine pendant les 7 jours où la tâche quotidienne génère l'occurrence, puis En retard avec une notification ; Lancer en avance avant la prévenance](/schemas/declenchement-preventif.svg)

L'onglet **Échéancier** montre, pour chaque plan actif et chaque équipement, la prochaine
échéance. Elle est **glissante** : elle part de la **clôture de la demande** de la dernière
occurrence clôturée, à laquelle on ajoute la périodicité. Sans historique, l'échéance est
aujourd'hui.

Les lignes sont rangées en groupes :

| Groupe | Sens |
| --- | --- |
| En retard | L'échéance est dépassée. Un badge indique le retard, par exemple « +11 j ». |
| Cette semaine | L'échéance tombe dans la semaine de prévenance. |
| À venir | L'échéance est plus lointaine. |
| Non calculé | Plan par compteur d'heures : pas d'échéance calculée. |

La colonne **Suivi** donne des liens vers la **Demande** et l'**Intervention** de
l'occurrence en cours. Le code d'un équipement mène à sa fiche.

![Groupe En retard de l'échéancier : badge de retard et liens Demande et Intervention](/captures/web-direction-echeancier-retard.webp)

Si une intervention préventive est **rouverte**, la nouvelle clôture devient la référence
de l'échéance suivante.

## La génération automatique

Une semaine avant l'échéance, Tunnel crée l'occurrence et une **demande** attribuée au
système. Vous la traitez comme les autres demandes (voir
[Traiter les demandes](/responsable/demandes)). Si le plan est en création automatique,
l'intervention est créée sans validation de votre part.

### La tâche quotidienne

Une tâche quotidienne tourne dans l'API, une fois par jour à heure fixe (5 h par défaut,
heure du serveur). Elle :

1. génère les occurrences à créer ;
2. notifie les préventifs en retard ;
3. notifie les interventions sans action depuis 7 jours.

Elle est **active par défaut** dans une installation Docker Compose. Hors Compose, elle est
inactive tant qu'elle n'est pas activée. Ses écritures sont tracées dans le journal comme
des événements du système.

Les notifications partent à tous les utilisateurs actifs et sont **relancées chaque
semaine** tant que la situation dure. Elles apparaissent dans la cloche du menu (voir
[Accueil](/responsable/accueil#les-notifications)).

![Haut du menu : la cloche Notifications avec son compteur de non lues](/captures/web-direction-notifications-zone.webp)

## Lancer en avance

Pour faire un préventif avant son échéance, sans attendre la semaine de prévenance :

1. Ouvrez **Équipements** et sélectionnez l'équipement.
2. Dans la section **Préventif**, cliquez sur **Détail**.
3. Sur la carte du plan, cliquez sur **Lancer en avance**.

![Carte d'un plan dans la fenêtre Maintenance préventive, avec le bouton Lancer en avance](/captures/web-direction-preventif-plan-carte.webp)
4. Confirmez : « Créer dès maintenant l'intervention préventive … sans attendre la
   prévenance ? », puis **Lancer**.

![Confirmation Lancer en avance d'un plan de convoyeur](/captures/web-direction-preventif-lancer-avance.webp)

L'occurrence et sa demande sont créées tout de suite. L'échéance théorique reste connue :
la fiche et la courbe d'écart montrent ensuite l'avance prise.

Le bouton n'apparaît que pour un plan **actif**, à **périodicité**, sans occurrence déjà en
cours, et si votre rôle l'autorise. Si l'API refuse (une occurrence est déjà en cours, ou
le plan ou l'équipement ne convient pas), le message s'affiche en rouge. Cette fonction
existe sur le web seulement.

## Ignorer une occurrence, avec un motif

Ignorer une occurrence, c'est décider de ne pas faire ce préventif à cette échéance. C'est
une décision hors travail normal : un motif est **obligatoire**.

- La page **Occurrences préventives** (adresse `/admin/preventive-occurrences`, qui ne figure
  pas dans le menu) propose le bouton **Ignorer** sur les occurrences au statut « En
  attente ». La fenêtre précise : « Un motif vous sera demandé ».
- Dans la configuration de départ, les raisons sont : Machine arrêtée ; Fait hors de
  l'outil ; Plan obsolète ; Autre raison (avec une précision obligatoire).
- Pour écarter une occurrence **déjà générée**, rejetez sa demande : l'occurrence passe
  « Ignorée ».

Cette page propose aussi les boutons **Générer** (lancer la génération à la main) et
**Corriger** (réparer des données). Les occurrences y sont filtrables par plan, statut et
dates.

![Page Occurrences préventives : filtres, boutons Corriger et Générer, liste des occurrences avec leur demande et leur intervention](/captures/web-direction-occurrences-preventives.webp)

## Où voir l'état du préventif

- L'**échéancier**, ci-dessus.
- La **fiche équipement** : voir [Équipements](/responsable/equipements).
- Le [Bilan du service](/responsable/bilan) : « Préventif en attente », « Préventifs en
  retard » et « Dernière génération ».

![Bilan du service : Préventif en attente, Préventifs en retard et Dernière génération](/captures/web-direction-bilan-preventif.webp)
