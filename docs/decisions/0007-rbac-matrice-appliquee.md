# 0007. Droits par rôle : la matrice en base est appliquée à chaque requête

- Statut : accepté
- Date : 2026-10-07
- Affine : CLAUDE.md section 6.3, ADR 0005

## Contexte

Le catalogue des endpoints (tunnel_endpoint) et la matrice rôle × endpoint
(tunnel_permission) existent, avec un écran d'administration, mais aucune route
métier ne les consulte : tout utilisateur authentifié, et une clé d'API MCP, peut
écrire partout. C'était la principale limite connue de la 5.0.0 (SECURITY.md).

## Décision

1. La matrice en base fait foi et reste éditable par l'admin. Chaque requête
   authentifiée est rapprochée de son endpoint du catalogue (même code que la
   synchronisation) et refusée (403) si le rôle n'y a pas droit. Un endpoint absent
   du catalogue est refusé.
2. ADMIN a toujours tous les droits, y compris sur un endpoint nouveau : un admin
   ne peut pas se bloquer hors de l'écran des permissions.
3. Une courte liste explicite de routes personnelles reste ouverte à tout
   utilisateur authentifié (session, profil, notifications, nouveautés, page
   d'accueil) ; elle est déclarée dans le code, avec sa justification.
4. Matrice par défaut, par métier (tous les rôles lisent tout le métier) :
   RESP écrit tout le métier et les référentiels, sauf la gestion des utilisateurs
   (ADR 0005) ; TECH crée des demandes d'intervention et d'achat, met à jour les
   interventions, saisit actions, tâches et changements de statut ; ACHETEUR gère
   demandes d'achat, commandes, fournisseurs, pièces, stock et références ; MCP lit
   seulement (pas de /admin). Elle est appliquée à l'installation et, sur une
   instance existante, uniquement aux permissions qu'aucun admin n'a modifiées.
5. Le cache des permissions se recharge périodiquement : chaque worker voit une
   modification de l'admin en quelques dizaines de secondes.
6. Le journal d'audit devient infalsifiable par l'application : le rôle applicatif
   perd UPDATE et DELETE sur audit_log, permission_audit_log et security_log.
7. Les fronts masquent les actions non autorisées sur les écrans principaux, à
   partir des permissions renvoyées par /auth/me ; le backend reste la seule
   barrière réelle.

## Alternatives écartées

- Rôles déclarés dans le code (require_role sur chaque route) : simple et versionné,
  mais rend l'écran de matrice décoratif.
- Matrice « large » (tout le monde écrit tout) : presque aucune protection.
- ADMIN soumis à la matrice : risque de verrouillage.

## Conséquences

- Tout nouvel endpoint est refusé aux rôles autres qu'ADMIN tant que la matrice
  par défaut ou l'admin ne l'ouvre pas : un endpoint ajouté au code doit être ajouté
  aux règles par défaut dans le même lot.
- SECURITY.md et le CHANGELOG retirent la limite connue une fois l'étape livrée.
