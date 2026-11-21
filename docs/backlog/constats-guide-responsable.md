# Constats de la rédaction du guide (responsable), 2026-11-21

Relevés par le rédacteur GUIDE-03 dans le code, NON VÉRIFIÉS à l'écran par l'agent principal :

- Mettre une demande « en attente » : permis par l'API (nouvelle → en_attente), aucun bouton
  ni sur le web ni sur le mobile.
- Ignorer une occurrence préventive : bouton seulement sur `/admin/preventive-occurrences`,
  page hors menu, sans contrôle de rôle côté front, et seulement pour les occurrences
  « pending » (la génération crée des occurrences « generated »).
- Coordination : l'écran charge `status: 'ouvert,en_cours'` alors que « en_cours » n'est
  pas un statut ; les interventions en attente de pièces ou de production n'y apparaissent
  probablement pas. Les changements de statut et de priorité en ligne échouent sans message
  (console seulement). « Créer inter » ne présélectionne pas la demande.
- Libellés d'un même statut différents selon l'écran (« Ouvert/Fermé » en Coordination,
  « En cours/Terminée » dans la fiche) ; sur une tâche, « Annuler » met le statut « Ignoré ».
- Onglet Qualité : filtre « Articles de stock » et règles « Sans seuil minimum », « Sans
  fournisseur » portent sur l'ancien modèle `stock_item`.

## Constats de la section « Comprendre Tunnel » (GUIDE-05), NON VÉRIFIÉS à l'écran

- Priorités : `PRIORITY_TYPES` (api/constants.py) dit `normal`, une partie du code écrit
  `normale` (création depuis une demande, préventif, filtre des interventions) ; les deux
  valeurs coexistent en base (profil de la production, spike 0005).
- Codes de plan préventif : le formulaire web impose `^[A-Z0-9_]+$`, l'API n'impose rien ;
  les codes à tirets (scénario de démonstration) ne passeraient pas par le formulaire.
- Quantité reçue d'une ligne de commande : modifiable par l'API, prise en compte par les
  statuts « Reçu » et « Partiellement reçu », sans écran de saisie.
