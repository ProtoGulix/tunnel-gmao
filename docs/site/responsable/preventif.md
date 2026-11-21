# Préventif

Le préventif de Tunnel repose sur des **plans**. Un plan est rattaché à une **classe**
d'équipement et vaut pour toutes les machines de cette classe. Il porte une **gamme** :
la liste des étapes à faire à chaque passage.

![Échéancier du préventif : en retard, cette semaine, à venir](/captures/web-direction-preventif-echeancier.webp)

La page **Préventif** a deux onglets : **Plans** et **Échéancier**.

## Les plans

L'onglet **Plans** liste les plans à gauche (recherche, interrupteur « Actifs
seulement ») et affiche le détail à droite.

Chaque ligne donne le code, le libellé, le déclencheur (par exemple « Périodicité 90j »)
et le nombre d'étapes. Le détail montre la classe, le déclencheur, la mention **Auto** ou
**Manuel**, et deux onglets : **Gamme** et **Occurrences**.

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

Une étape **obligatoire** bloque la clôture de l'intervention tant qu'elle n'est pas faite.
Seuls le responsable et l'administrateur peuvent l'ignorer.

### Désactiver et réactiver un plan

**Désactiver** demande une confirmation (« Les occurrences futures ne seront plus
générées. »), puis ouvre la fenêtre de motif. Un plan désactivé porte le badge **Inactif**.
**Réactiver** le remet en service. L'interrupteur « Actifs seulement » masque les plans
inactifs.

## L'échéancier glissant

L'onglet **Échéancier** montre, pour chaque plan actif et chaque équipement, la prochaine
échéance. Elle est **glissante** : elle part de la **clôture de la demande** de la dernière
occurrence terminée, à laquelle on ajoute la périodicité. Sans historique, l'échéance est
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

## Lancer en avance

Pour faire un préventif avant son échéance, sans attendre la semaine de prévenance :

1. Ouvrez **Équipements** et sélectionnez l'équipement.
2. Dans la section **Préventif**, cliquez sur **Détail**.
3. Sur la carte du plan, cliquez sur **Lancer en avance**.
4. Confirmez : « Créer dès maintenant l'intervention préventive … sans attendre la
   prévenance ? », puis **Lancer**.

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

## Où voir l'état du préventif

- L'**échéancier**, ci-dessus.
- La **fiche équipement** : voir [Équipements](/responsable/equipements).
- Le [Bilan du service](/responsable/bilan) : « Préventif en attente », « Préventifs en
  retard » et « Dernière génération ».
