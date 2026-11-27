# Relecture de cohérence du scénario (direction technique, R1)

Calculs par script sur les fichiers du scénario (aucune base). Jour 0 = chargement. Morvance Industrie : 32 équipements, 4 techniciens, 187 demandes, 173
interventions (165 fermées, 5 ouvertes, 3 en attente de pièces), 331 actions, 920 h.

## 1. Le bilan raconte-t-il une histoire lisible ?
Globalement oui.

- **Par mois** (blocs de 30 j) : 13, 9, 20, 16, 13, 18, 18, 11, 10, 13, 15, 13, creux d'été
  visible. Types : curatif 99, préventif 58, bâtiment 6, projet 4, pilotage 2, mise en
  service 2, conformité 1, réappro 1.
- **Urgences** : 29 (17 %). Par semestre 17 %, 23 %, puis 11 % sur 90 jours. Le préventif
  passe de 27 % à 45 % puis 38 % des heures : urgences en baisse, bonne histoire.
- **Heures** : dépannage 38 %, préventif 33 %, fabrication 17 %, bâtiment 7 %, support 3 %,
  documentation 1 %.
- **Chantiers coupés** : 4 projets (I027, I036, I106, I155) sur 29 à 80 jours ; I027 coupé
  par 3 urgences, I106 par 4. Lisible.
- **Attente de pièces** : 11 interventions (6 %), 8 closes (3 à 7 j d'attente) et 3 en cours
  (I180 12 j, I182 8 j, I187 4 j) adossées à CMD032 (ACK), CMD033 (SENT), CMD034 (OPEN).
- **Préventif** : 58 occurrences, retard maximal à l'ouverture 25 j, avance maximale 18 j
  (PR-01). En retard aujourd'hui : CP-02 (80 j), CV-03 (40 j), RB-03 (25 j), PR-05 (12 j).
  Écarts peu variés (25 j neuf fois, 15 j six fois), un peu mécanique.
- **Ouvertes** : 8 ; sans action depuis 7 j ou plus : I173 (25 j), I177 (17), I155 (12,
  projet), I180 (12), I182 (9). Bonne matière pour le « à relancer ».
- **Charge** : T1 277 h, T3 256, T2 229, T4 157.

## 2. Écarts au profil (spike 0005)

| Indicateur | Cible | Scénario | Verdict |
| --- | --- | --- | --- |
| Interventions / actions | ~330 / ~1 400 | 173 / 331 | acceptable (réduit) |
| Curatif / préventif | 60 / 20 % | 57 / 34 % | acceptable (préventif voulu) |
| Bâtiment, projet, pilotage | 6, 5, 4 % | 3,5, 2,3, 1,2 % | acceptable (petits effectifs) |
| Priorité urgente / normale | 30 / 50 % | 17 / 68 % | non |
| Durée médiane, D9 ; attente de pièces | 2 j, 90 j ; 5 % | 1 j, 4 j (max 80) ; 6,4 % | acceptable |
| Ouvertes / attente pièces à l'instant | 10 / 3 % | 2,9 / 1,7 % | non |
| Temps par action (Q1, méd., Q3, D9) | 1, 2,5, 4,5, 8 h | 1,5, 2,25, 4, 5,5 h | acceptable |
| Complexité 1, 2, 3, 4-5, 6+ | 35, 30, 20, 10, 5 % | 31, 37, 20, 8, 4 % | acceptable |
| Heures préventives | ~25 % (voulu) | 33 % | limite (+32 %) |
| Fabrication (actions / heures) | 28 / 43 % | 9 / 17 % | non |
| Dépannage (actions / heures) | 23 / 21 % | 40 / 38 % | non |
| Bâtiment (actions / heures) | 15 / 18 % | 4 / 7 % | non |
| Demandes d'achat autonomes | ~40 % | 48 % | acceptable |
| Urgence des demandes d'achat | normale ~94 % | 73 % | non |
| Commandes closes / annulées | 75 / 10 % | 79 / 9 % | acceptable |

## 3. Incohérences repérées

- 32 chevauchements d'horaires pour un même technicien le même jour (I027/I028 et
  I027/I050 jour -296 et -261, I036/I040 jour -281, I006, I030, I031...) ; 5 journées de
  plus de 10 h (T3 jour -281 : 13,25 h, fin à 21 h 30 ; T2 jour -282 : fin à 22 h 15).
- I084, action a3 : « Graissage complet. » (18 caractères), très courte.
- Aucune occurrence préventive ouverte : les 4 équipements en retard n'ont rien de généré en
  attente (profil : ~50 %), l'écran « préventif à faire » restera vide.
- Commandes annulées CMD011, CMD025, CMD027 : DA310, DA317, DA318 reprises ailleurs, bon.
  Demandes sans commande (DA113, DA323, DA324) : récentes, normal.
- RAS : aucune action avant ouverture ou après fermeture, aucun statut qui recule, aucune
  demande clôturée avec intervention ouverte, tâches obligatoires toutes soldées, aucun
  article commandé après la reprise, aucune date future, facteurs de complexité présents.
- Les jours de semaine glissent à chaque rechargement (dates relatives) : 57 actions tombent
  un week-end le 2026-11-21, non corrigeable dans le fichier.
- Noms : aucune marque connue par grep. NON VÉRIFIÉ : Morvance, Kordex, Tavion, Valmeca,
  Brenmar, Dalmor, Aerolis, Lubrex, Vandéral, Hydropneu, Ormeau.

## 4. Corrections demandées

**Bloquant (1)**
1. Part des urgences trop basse (17 %, cible 24 à 36 %, 11 % sur 90 jours) : requalifier une
   dizaine de curatifs « normal » en « urgent », surtout parmi les 90 derniers jours.

**Souhaitable (7)**
1. Supprimer les chevauchements d'horaires, journées de 10 h au plus (I027, I028, I030, I031,
   I036, I040, I050, I054, I056).
2. Rééquilibrer le curatif : moins de dépannage, 6 à 8 actions FAB et 5 à 6 actions BAT en
   plus.
3. Ramener les heures préventives vers 27 à 30 %.
4. Ajouter 3 interventions ouvertes (dont 1 en attente de pièces) vers 10 % / 3 %.
5. Générer 2 occurrences préventives ouvertes non commencées (CV-03, RB-03).
6. Ramener les demandes d'achat « normal » vers 90 % (requalifier 6 demandes).
7. Allonger I084 a3 ; varier les écarts d'échéance ; contrôler les noms du point 3.

## Corrections appliquées par l'agent principal (2026-11-21)

- Bloquant levé : 17 curatifs « normal » requalifiés « urgent » (graine fixe, 7 dans les
  90 derniers jours) ; urgences à 27 % de toutes les interventions, 27 % sur 90 jours.
- Chevauchements supprimés : heures de début recalées par technicien et par jour (départ
  07:30, 15 min entre deux actions, pause de midi) ; 5 journées restent au-delà de 10 h.
- Souhaitables non traités, laissés en l'état : mix des catégories, occurrences
  préventives ouvertes (créées par la tâche quotidienne au premier démarrage), jours de
  semaine qui glissent avec les dates relatives.

## 4. Constats (GUIDE-07)

Ajout après la relecture ci-dessus : 95 constats (`constats.json`), 8 demandes et 3 interventions
de plus (`I200` à `I207`), donc 195 demandes et 176 interventions.

- Un constat sur chacun des 92 curatifs fermés, comme l'exige la clôture : 84 sans demande
  (réponses tirées de la clé, dont environ un tiers « Rien ne l'aurait évité »), 9 écrits à
  la main (11 versions avec les deux corrections). Le curatif I159 en porte deux, de deux
  techniciens.
- Demandes issues des constats : acceptée avec intervention (2 préventives dont une fermée,
  1 projet ouvert), rejetée (projet), rattachée à l'idée du projet ouvert MO-02 du scénario (rejetée en
  doublon), en attente, nouvelle ; une seconde demande « nouvelle » sur MO-02 (I207) peut être
  rattachée à cette idée, pour le guide. Deux constats corrigés (un avec demande « nouvelle », un
  sans demande).
- Les constats avec demande datent tous des trois derniers mois : l'onglet Constats du Bilan
  montre des suggestions retenues.
- Aucun nom, aucune machine réels : mêmes personnages et mêmes machines que le scénario.

## 5. Plan désactivé (GUIDE-08)

`PRE-PORTES-MENS`, contrôle mensuel des portes de quai, est inactif (`"active": false`) : repris
par l'étape portes de quai du contrôle annuel du bâtiment. Il n'a aucune occurrence ; il sert
au guide (badge Inactif, bouton Réactiver).

## 6. Demande à qualifier et clé d'API (GUIDE-08)

`DA326`, joint de porte d'armoire demandé la veille par un technicien, n'a pas d'article :
elle est « À qualifier » (53 demandes d'achat). `K1`, clé d'API du rôle MCP créée par
l'administrateur, montre l'onglet Clés API ; son secret n'est conservé nulle part.
