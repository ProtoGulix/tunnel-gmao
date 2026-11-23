# Bilan du service

Le **Bilan du service** donne une vue d'ensemble de l'activité : l'état du service, l'audit
des décisions et la qualité des données. C'est un outil de pilotage d'équipe.

::: info Aucun chiffre individuel
Le Bilan ne montre **aucun chiffre par technicien**, par choix. Les indicateurs décrivent le
service, jamais une personne.
:::

La page a trois onglets : **État**, **Audit** et **Qualité**.

## La période

Deux onglets, **État** et **Audit**, partagent une période choisie en haut à droite :
**3 mois**, **6 mois**, **12 mois** ou **24 mois**. La période par défaut est de 3 mois.
Ce sont des mois calendaires, **mois en cours compris** : l'écran affiche la plage, par
exemple « 1 septembre – 21 novembre 2026 ».

L'onglet **Qualité** n'a pas de période : il décrit l'état actuel des données.

## L'onglet État

![Onglet État du Bilan : huit chiffres clés, puis temps et capacité](/captures/web-direction-bilan-etat.webp)

### Les chiffres clés

Huit cartes ouvrent l'onglet. Passez la souris sur l'icône **ⓘ** d'une carte pour lire sa
définition. Chaque carte montre :

- la **valeur** ;
- une **mini-courbe** : une valeur par mois de la période ;
- un mot de **tendance** : « en hausse », « stable » ou « en baisse ». La flèche est
  neutre, sans couleur de jugement : une hausse n'est pas bonne ou mauvaise en soi ;
- pour les trois premières, un **badge** donné par l'API.

| Carte | Définition affichée |
| --- | --- |
| Charge du service | Temps total heures / Capacité ETP proratisée sur la période. |
| Fragmentation | % temps fragmenté (support, actions courtes < 0,5h non-dépannage). |
| Temps de pilotage | % temps long protégé (documentation, préventif, dépannage réel). |
| Part d'urgences | Interventions de priorité urgente parmi celles signalées dans le mois. |
| Chantiers coupés par une urgence | Un chantier est un couple (technicien, intervention de projet ou de préventif) avec des actions sur au moins deux jours distincts, rattaché au mois de son premier jour. Il est coupé quand le même technicien traite, un jour strictement entre le premier et le dernier, une intervention curative urgente. |
| Interventions par journée de technicien | Pour chaque journée d'un technicien, le nombre d'interventions distinctes sur lesquelles il a agi ; moyenne du mois. |
| Part du préventif dans les heures | Somme du temps passé sur les actions, par type d'intervention (curatif, préventif, projet, autres) et par mois de la date de l'action. La carte donne la part du préventif. |
| Attente de pièces | État actuel : interventions au statut « attente de pièces », âge médian depuis leur signalement. |

Les badges des trois premières cartes, avec leurs mots :

| Carte | Mots du badge |
| --- | --- |
| Charge du service | Normale, Élevée, Au plafond |
| Fragmentation | Maîtrisée, Notable, Élevée |
| Temps de pilotage | Présent, Limité, Absent |

Les **seuils** sont écrits dans l'ⓘ de chaque carte, sous la définition, par exemple
« Seuils : élevée dès 75 %, au plafond dès 100 % ». Ils viennent de l'API : l'écran ne les
recopie pas.

Les cinq dernières cartes (part d'urgences, chantiers coupés, interventions par journée,
part du préventif, attente de pièces) ne s'affichent que si votre rôle y a droit.

### Temps et capacité

- **Répartition du temps par catégorie de travail** : une barre empilée (production,
  dépannage, pilotage, fragmentation), avec le total d'heures. L'ⓘ liste les catégories
  d'action de chaque type de temps.
- **Heures par type d'intervention** : curatif, préventif, projet, autres.
- **Causes de la fragmentation** (repliée) : les principales sources de fragmentation du
  temps. Elles correspondent à du support diffus, des interruptions ou des micro-actions
  répétées. Réduire la fragmentation passe par une action sur ces causes, pas par l'ajout de
  ressources.
- **Consommation de capacité par site** (repliée) : quels sites consomment la capacité du
  service. Elle reflète des contraintes d'organisation (distance, support, coordination),
  et non la performance des équipes ou des équipements.

### Organisation du travail

Cette section contient le tableau replié **Valeurs par mois**, qui donne toutes les valeurs
de chaque mois, dont la part des journées de technicien où il a agi sur 3 interventions
distinctes ou plus. La date d'une action est le jour du travail saisi par le technicien, à
défaut la date de signalement de l'intervention.

### Préventif

Trois chiffres courts sur l'**état actuel** du préventif, hors période :

| Chiffre | Définition affichée |
| --- | --- |
| Préventif en attente | État actuel : occurrences générées dont la demande liée est encore « nouvelle », avec l'âge de la plus ancienne. |
| Préventifs en retard | État actuel : plans préventifs actifs, par équipement, dont l'échéance est dépassée (périodicité glissante, calculée par l'échéancier). Les plans par heures ne sont pas comptés. |
| Dernière génération | Date de la dernière occurrence générée. La génération est automatique quand la tâche quotidienne est activée : au-delà de 35 jours, un oubli ou une tâche quotidienne désactivée est probable. |

## L'onglet Constats

Les constats saisis après intervention, sur la période choisie. Un bandeau de quatre
chiffres clés, comme l'onglet État :

| Chiffre | Ce qu'il mesure |
| --- | --- |
| Constats | Nombre de constats, avec leur courbe par mois. Une correction ne compte pas en plus. |
| Signal visible avant | Part des constats où un signe annonçait l'arrêt, vu ou non remonté. |
| Signal non remonté | Part des constats où le signe a été vu sans être signalé. |
| Suggestions retenues | Demandes issues des constats acceptées ou clôturées, et nombre en attente. |

Puis, sous « Où agir », une barre par question : **leviers** (un constat peut en citer
plusieurs), **signal précurseur**, **problème connu depuis**, **devenir des demandes**
(« rattachée » : doublon d'une idée d'amélioration). Aucun chiffre par personne. Sans
constat : « Aucun constat sur la période ».

## L'onglet Audit

![Onglet Audit du Bilan : six chiffres sur les tâches et les décisions](/captures/web-direction-bilan-audit.webp)

Cet onglet n'apparaît que si votre rôle y a droit. Il décrit la façon dont les tâches sont
confiées et dont les décisions sont prises, en chiffres d'équipe.

Le **garant** est la personne affectée à la tâche : il est responsable de la finir. Les
**exécutants** sont les techniciens qui ont saisi les actions liées à la tâche. Plusieurs
exécutants, ou un garant qui n'exécute pas lui-même, sont des fonctionnements normaux. Le
partage des tâches n'est pas une faute.

| Carte | Définition affichée |
| --- | --- |
| Tâches sans garant | Tâches créées dans le mois sans personne affectée. Part calculée sur les tâches créées. |
| Faites sans action du garant | Tâches terminées dont le garant n'a saisi aucune action : le travail a été fait par d'autres. C'est un signe de travail d'équipe, pas une faute. Part calculée sur les tâches terminées qui ont un garant. |
| Repérées sur le terrain | Tâche créée par son garant, qui y a lui-même fait une action. Part calculée sur les tâches terminées qui ont un garant. |
| Tâches partagées | Tâches terminées avec au moins deux exécutants différents, signe de travail d'équipe. Part calculée sur les tâches terminées. |
| Décisions hors travail normal | Choix faits avec un motif (clôture, réouverture, tâche annulée…), comptés par type de décision et par motif. Les modifications sans motif n'en font pas partie. |
| Modifications automatiques | Part des modifications faites automatiquement par le système (cascades, calculs) parmi tous les événements du journal du mois. |

Les cartes n'ont **pas de badge** : ces chiffres n'ont pas de seuil. Elles montrent la
valeur, un détail (par exemple « 18 sur 109 créées »), la tendance et la mini-courbe.

Deux tableaux repliés complètent l'onglet : **Valeurs par mois** et **Décisions hors travail
normal, par type et motif**.

::: warning Données incomplètes
Quand certains mois sont concernés, l'écran affiche « Données incomplètes sur certains
mois ». Avant le 20 novembre 2026, l'auteur des clôtures et les modifications en cascade
n'étaient pas toutes enregistrés. Lisez avec prudence les décisions et la part automatique
de ces mois.
:::

## L'onglet Qualité

![Onglet Qualité du Bilan : contrôle des données](/captures/web-direction-bilan-qualite.webp)

L'onglet **Qualité** contrôle la complétude et la cohérence des données saisies. Il montre
l'état actuel, sans période.

- Des **filtres** : « Toutes sévérités » (Critique, Moyenne) et « Toutes entités ».
- Trois cartes : **Total problèmes**, **Critiques** et **Moyennes**.
- Les problèmes, regroupés par nature : **Champ obligatoire manquant**, **Valeur suspecte
  ou incohérente**, **Anomalie de cycle de vie**.

Parmi les contrôles, sur les actions : temps non saisi, complexité sans facteur,
sous-catégorie ou technicien manquant, description vide, temps supérieur à 8 h, action
saisie après la fermeture de l'intervention. Sur les interventions : fermée sans action,
sans type, en cours depuis plus de 14 jours. Sur les demandes d'achat : sans pièce liée.

Quand tout va bien, l'écran affiche « Aucun problème détecté ».
