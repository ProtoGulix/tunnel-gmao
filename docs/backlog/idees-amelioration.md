# Module « idées d'amélioration »

- Retiré du front web le 2026-11-19 faute de backend : la vue d'accueil Direction technique
  affichait un kanban d'idées d'amélioration alimenté par des routes qui n'ont jamais existé
  (type de demande, catégories, sous-statuts, PATCH /intervention-requests/{id}/amelioration).
- Idée : un vrai module avec type de demande, catégories, sous-statuts, priorité, porteur
  et échéance, côté backend d'abord (schéma, API, droits), puis front.
- Besoin à définir avec l'utilisateur avant tout chantier : qui propose, qui arbitre, lien
  éventuel avec les interventions, volume attendu.
