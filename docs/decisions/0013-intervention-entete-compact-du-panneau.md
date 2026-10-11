# 0013. Interventions : un en-tête compact pour le panneau de détail

- Statut : accepté
- Date : 2026-10-11

## Contexte

Dans la page Interventions en master-detail, le panneau droit affiche le détail de
l'intervention choisie dans la liste de gauche. Avant les onglets, il empile quatre
blocs, soit environ 205 px, près d'un tiers de la hauteur du panneau :

1. le code intervention dans un gros badge bleu, le code et le nom de la machine, et
   une icône qui ouvre la page complète ;
2. le titre ;
3. une ligne de gros boutons : statut (bleu plein), priorité (jaune plein) et
   « Demander le pointage » (orange), plus « Supprimer » quand c'est possible ;
4. une carte pour la demande d'intervention liée, qui répète le titre.

Plusieurs choses gênent l'utilisateur :

- Statut et priorité sont des attributs, mais ils ont l'air de boutons d'action, et
  trois couleurs vives se disputent l'attention. Le texte blanc sur jaune se lit mal.
- « Demander le pointage » est une action ponctuelle, pourtant mise au même niveau
  que le statut.
- Le code intervention est déjà affiché dans la liste de gauche. C'est pourtant
  l'élément le plus visible de l'en-tête.
- Le lien vers la page complète ne sert plus.
- La carte de la demande prend une ligne entière pour ce qui n'est qu'un lien vers
  l'onglet Demande.

Trois maquettes ont été comparées : une ligne de propriétés (A), une fiche de
propriétés avec libellés (B) et un statut en boutons côte à côte (C). L'utilisateur a
retenu A.

## Décision

1. Le périmètre se limite à l'en-tête du mode panneau et à la carte de la demande. Les
   onglets et leur contenu, le mode page complète (`PageHeader`) et le composant
   partagé `DropdownButton` ne changent pas.
2. Un composant `InterventionPanelHeader` remplace l'en-tête du bloc `embedded` de
   `InterventionDetailPage`. Il compte trois lignes :
   - **Ligne 1** : code et nom de la machine. À droite, le code intervention en petit
     texte gris, puis un menu « ⋯ ».
   - **Ligne 2** : le titre, en gras et en 18 px. Au-delà de deux lignes, il est coupé
     par « … » et le titre complet s'affiche au survol.
   - **Ligne 3** : le statut et la priorité, chacun sous forme de pastille de couleur
     avec un libellé, qui ouvre un menu de choix. Ensuite, un lien
     « DI-AAAA-NNNN demandeur · date » ouvre l'onglet Demande. À droite, le temps
     total et le nombre d'actions.
3. Le menu « ⋯ » contient : « Demander le pointage », « Copier le code », un
   séparateur, puis « Supprimer ». Si l'intervention a des actions ou des achats,
   « Supprimer » reste grisé avec la raison. Sans la permission de supprimer,
   l'entrée n'apparaît pas. La confirmation reste une boîte de dialogue.
4. L'icône d'ouverture de la page complète est retirée du panneau. La route
   `/intervention/:id` reste accessible.
5. Les droits et le verrouillage ne changent pas. Chaque entrée garde son contrôle
   `can(PERM…)`, et une intervention fermée ou annulée désactive le statut et la
   priorité. Les appels à l'API, et les fonctions qui les lancent, sont réutilisés
   tels quels. Le backend ne change pas.
6. Les couleurs des pastilles viennent de `STATE_COLORS` et `PRIORITY_COLORS`, pour
   rester cohérentes avec la liste.

## Alternatives écartées

1. **Fiche de propriétés avec libellés (B).** Plus explicite et extensible, mais plus
   haute. Elle met le titre avant la machine et change une habitude.
2. **Statut en boutons côte à côte (C).** On change de statut en un clic, mais les
   quatre statuts ne forment pas une suite (les deux attentes sont des détours). La
   rangée déborde dans un panneau étroit, et « Fermer » en un clic expose à une
   clôture par erreur.
3. **Appliquer le même en-tête à la page complète.** Écarté par l'utilisateur pour
   l'instant. Sans liste à gauche, le code intervention y garde sa place.
4. **Ajouter une variante discrète à `DropdownButton`.** Écarté : ce composant est
   partagé, et le changement doit rester local au panneau.

## Conséquences

- L'en-tête du panneau passe d'environ 205 px à environ 116 px, ou 140 px quand le
  titre tient sur deux lignes. Ces valeurs sont estimées sur maquette, pas mesurées.
- Demander un pointage demande désormais deux clics au lieu d'un.
- Le panneau et la page complète affichent temporairement deux en-têtes différents.
  Les harmoniser demandera un nouvel ADR.
- « Imprimer la fiche » n'est pas ajouté au menu : l'onglet Fiche suffit.
