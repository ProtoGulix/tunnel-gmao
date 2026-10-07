# Suites de l'étape 5 (RBAC, 2026-10-07)

- Plusieurs dépôts attrapent `except Exception` autour d'un code qui lève des erreurs
  métier (HTTPException) et les transforment en 500 : corrigé pour la création
  d'intervention, à rechercher et corriger ailleurs (grep « except Exception » suivi de
  « raise DatabaseError »).
- Le front web appelle DELETE /parts/{id}, route absente du backend : bouton masqué
  derrière parts:update, à trancher (créer la route ou retirer le bouton).
- Écrans pas encore couverts par le masquage : StockItemsTab (orphelin), détail
  famille / sous-famille / modèle de pièce, boutons internes de GammeStepsPanel,
  planning, coordination, briefing, onglet Sécurité (clés d'API, blocklist, domaines),
  détail d'équipement sur mobile ; composant `Can` côté web.
- Les fronts ne relisent les permissions qu'au login et au chargement : un changement
  de matrice n'apparaît qu'après rechargement de la page.
- Transitions et réparation de demandes d'intervention réservées à RESP par la matrice
  par défaut (choix le plus restrictif) : à confirmer avec l'usage des techniciens.
- Lecture par défaut (relecture du 2026-10-07) : TECH, ACHETEUR et MCP lisent GET /users
  (liste des utilisateurs) et GET /audit/logs. Les sélecteurs de demandeur et
  d'approbateur ont besoin de /users ; /audit/logs est à trancher par l'utilisateur.
- DatabaseError journalise le détail PostgreSQL brut, qui peut contenir des valeurs
  (ex. Key (email)=(...)) : les journaux ne doivent jamais être exposés.
- Une requête non authentifiée n'est pas contrôlée par la matrice : c'est sûr parce
  que JWTMiddleware renvoie 401 hors routes publiques ; ajouter un test sur la liste
  exacte des routes publiques.
- AuditMiddleware passe avant le contrôle de la matrice : une écriture refusée peut
  répondre 400 (motif d'audit manquant) avant le 403. Pas de faille, code moins net.
