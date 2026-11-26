# 0044. Vue direction et indicateurs des constats

- Statut : accepté (2026-11-23)
- Date : 2026-11-23
- Affine : ADR 0033 (page Bilan unique), ADR 0043 (constat après intervention, point indicateurs)

## Contexte

Les constats (ADR 0043) disent où agir pour éviter les arrêts, mais aucun écran ne les agrège.
L'utilisateur veut avancer sur une vue direction et y voir les constats (décisions du 2026-11-23).

## Décision

1. Les indicateurs des constats vivent dans un onglet « Constats » de /bilan (période du
   Bilan), dans la présentation de l'onglet État : chiffres clés avec mini-courbe, puis
   barres empilées.
2. Chiffres clés : constats par mois, part avec signal visible, part avec signal non
   remonté, suggestions retenues. Barres : leviers, signal précurseur, ancienneté du
   problème, devenir des demandes issues des constats (nouvelle, en attente, acceptée,
   rejetée, rattachée à une idée, clôturée).
3. Lecture `GET /stats/constats` (start_date, end_date) ouverte à tous les connectés, comme
   l'onglet État : règle de lecture par défaut (ADR 0007), aucune migration.
4. Seule la version courante d'un constat compte ; il est daté de sa première version (une
   correction ne le déplace pas de mois).
5. Aucun chiffre par personne (ADR 0043) : ni auteur ni technicien dans la réponse.

## Alternatives écartées

- Page « Direction » à part (/direction) : construite puis retirée à l'essai le 2026-11-23,
  elle doublait l'accueil « Direction technique » existant (choix de l'utilisateur).
- Bloc dans l'accueil « Direction technique » : essayé puis retiré le même jour, un tableau
  d'indicateurs n'a pas sa place sur un accueil (choix de l'utilisateur).
- Accès réservé à ADMIN et RESP : l'utilisateur veut que l'équipe voie ses tendances.
- Heures d'arrêt par levier : la durée d'arrêt n'est pas enregistrée (docs/backlog/constat-indicateurs.md).

## Conséquences

- Un nouveau droit `stats:get_constats`, créé par le bootstrap au démarrage, sans migration.
- Le guide responsable (bilan) décrit l'onglet.
- Le visuel reste presque vide tant que la production n'a pas de constats réels.
