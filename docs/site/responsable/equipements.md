# Équipements

La page **Équipements** est l'inventaire du parc, avec l'état de santé de chaque
équipement. Une liste à gauche, la fiche à droite.

![Fiche d'un équipement : état de santé, préventif, état et évolution](/captures/web-direction-equipement-preventif.webp)

## L'arborescence

Le parc se découpe avec la **hiérarchie mère et fille** : une ligne de production, un
atelier ou un site est un équipement mère, et ses machines sont ses filles. Une machine
peut elle-même avoir des filles (sous-ensembles).

![Page Équipements : la liste à plat des équipements avec leur état de santé, à gauche de la zone de fiche](/captures/web-direction-equipements.webp)

Règles de l'arbre, contrôlées par l'API :

- **4 niveaux au plus** ;
- un équipement ne peut pas être sa propre mère, ni créer de boucle ;
- une mère qui a des filles ne peut pas être supprimée.

Votre découpage décide de la qualité des vues : un parc bien rattaché donne de lui-même
le bon regroupement.

### La liste

En haut de la liste :

- **Arbre** ou **À plat** : l'arbre montre les mères dépliables ; « À plat » est une liste
  paginée ;
- **Tri : Santé** ou **Tri : Code** ;
- un filtre de **classe** (l'icône en couches), avec « Toutes les classes ».

Une recherche, ou un filtre de classe, passe la liste « À plat » automatiquement. Chaque
ligne montre une pastille de santé, le code et le nom, et le badge de statut (par exemple
« En service »). À plat, le chemin de rattachement s'ajoute en gris.

![Liste en arbre : recherche, Arbre ou À plat, tri et filtre de classe, puis le site déplié jusqu'aux machines](/captures/web-direction-equipements-filtres.webp)

Le bouton **Nouvel équipement** ouvre un formulaire : nom, classe, statut, équipement
parent (facultatif), n° de machine, emplacement, fabricant, n° de série, mise en service,
notes. Le code est généré automatiquement.

![Fenêtre Nouvel équipement remplie : le code se calcule à partir de la classe et du n° de machine](/captures/web-direction-equipement-creation.webp)

## La fiche

Cliquez sur un équipement. L'en-tête montre le code, le nom (modifiable sur place) et la
**santé**, avec sa cause.

### La santé

Les niveaux sont **Opérationnel**, **Maintenance**, **Attention** et **Critique**. La cause
est écrite à côté, par exemple « 1 intervention urgente ouverte ». Elle est calculée à
partir de ce qui est ouvert sur l'équipement :

- **Critique** : au moins une intervention urgente ouverte, ou 3 tâches en retard ou plus ;
- **Attention** : 1 ou 2 tâches en retard, plus de 5 interventions ouvertes, un préventif en
  retard, ou des travaux ouverts sans emplacement renseigné ;
- **Maintenance** : des interventions, demandes, tâches ou demandes d'achat ouvertes ;
- **Opérationnel** : rien d'ouvert.

La santé d'une **mère** reflète sa fille la plus dégradée. L'en-tête le dit : « via » suivi
du code de la fille, cliquable.

![En-tête d'un atelier : santé Critique, avec la cause et « via PR-05 »](/captures/web-direction-equipement-sante.webp)

### La section « Fiche »

Les propriétés se modifient **sur place**, une à la fois, si votre rôle l'autorise :
**Classe**, **Statut**, **Rattachement**, **N° machine**, **Emplacement**, **Fabricant**,
**N° série**, **Mise en service**, **Nœud de regroupement** et **Notes**. Le code ne change
pas : il est cité partout.

![Section Fiche d'un équipement : classe, statut, rattachement et autres propriétés modifiables sur place](/captures/web-direction-equipement-fiche.webp)

Le **Rattachement** (la mère) se choisit dans une recherche qui évite les boucles. Le
chemin complet s'affiche, par exemple « MRV › ATL-INJ – Atelier injection », avec un lien
vers la mère.

Si le statut de l'équipement interdit les interventions, le badge « Interventions
bloquées » l'indique.

### Sous-équipements et activité

- **Sous-équipements** : les filles directes, avec leur santé et leur statut. Cliquez pour
  les ouvrir.
- **Activité** : les « Demandes ouvertes » et les « Interventions » de l'équipement.
- La case **Inclure les sous-équipements** (pour une mère) étend l'activité et l'état et
  évolution à toutes ses filles.

![Sous-équipements d'un atelier, avec leur santé et leur statut](/captures/web-direction-equipement-sous-equipements.webp)

![Activité d'un atelier : demandes ouvertes, puis interventions paginées](/captures/web-direction-equipement-activite.webp)

## Le suivi du préventif

La section **Préventif** de la fiche donne l'état en une ligne :

- **« Préventif à jour »** en vert, ou **« N en retard »** en rouge ;
- le nombre d'occurrences **en attente** ;
- la **prochaine** échéance.

Le bouton **Détail** ouvre « Maintenance préventive — code » :

- le nombre de préventifs en retard et la **prochaine échéance** ;
- chaque plan de la classe, avec son déclencheur, son état (« En retard », « Cette
  semaine », « À venir »), son échéance et le bouton « Lancer en avance »
  (voir [Préventif](/responsable/preventif#lancer-en-avance)) ;
- les **Interventions préventives** passées ;
- la courbe **Écart par rapport à l'échéance** : au-dessus de la ligne, en retard ; en
  dessous, en avance. Chaque réalisation est notée « −5 j » (en avance), « +12 j » (en
  retard) ou « à l'heure ».

![Fenêtre Maintenance préventive d'une presse : plan en retard, interventions préventives passées et courbe d'écart](/captures/web-direction-equipement-preventif-detail.webp)

Un équipement sans classe affiche « Pas de classe assignée » : sans classe, pas de plan.

## État et évolution

La section **État et évolution** résume l'activité de l'équipement sur une période : 6, 12
ou 24 mois, ou « Depuis la mise en service » (10 ans au plus). Le bouton **Voir les
interventions** liste toutes ses interventions.

Les chiffres clés :

| Chiffre | Sens |
| --- | --- |
| Signalées | Interventions signalées sur la période. |
| Fermées | Interventions fermées. |
| Ouvertes maintenant | Interventions encore ouvertes. |
| Heures passées | Temps passé, avec le nombre d'actions. |
| Complexité moyenne | Moyenne des complexités saisies sur les actions. |
| Délai de fermeture | Délai de fermeture des interventions, en jours, en moyenne. |

Viennent ensuite des graphiques : interventions signalées par mois et par type, heures
passées par mois, puis la répartition par **type d'intervention**, par **catégorie
d'action** (heures) et par **facteur de complexité**. Le tableau « Valeurs par mois » donne
les chiffres. Un clic sur un type ou un mois ouvre la liste des interventions concernées.

![État et évolution sur 12 mois : chiffres clés, interventions et heures par mois, répartition par type, par catégorie d'action et par facteur de complexité](/captures/web-direction-equipement-evolution.webp)

![Liste des interventions d'un mois, ouverte par un clic sur le graphique](/captures/web-direction-equipement-interventions.webp)

Ces chiffres décrivent l'équipement. Ils ne décrivent jamais un technicien.

## Les QR codes

Tunnel génère un QR code pour une **intervention**, pas pour un équipement.
