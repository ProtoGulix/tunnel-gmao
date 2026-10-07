# Changelog

Les historiques détaillés des versions 1 à 4 se trouvent dans backend/CHANGELOG.md,
web/CHANGELOG.md et mobile/CHANGELOG.md. À partir de la 5.0.0, ce fichier couvre
tout le dépôt.

## Non publié

### Ajouté
- Règles de branches et de versions (ADR 0008) : main ne reçoit que des versions,
  develop intègre les chantiers ; CI GitHub Actions sur chaque pull request.
- Droits par rôle appliqués (ADR 0007) : chaque requête est vérifiée dans la matrice
  des permissions, éditable par l'administrateur. Matrice par défaut par métier
  (RESP, TECH, ACHETEUR), clés d'API en lecture seule, ADMIN a toujours tous les droits.
- Les fronts masquent les actions que le rôle connecté ne peut pas faire.

### Sécurité
- Le journal d'audit ne peut plus être modifié ni supprimé par l'application.
- Le jeton de session ne transporte plus la liste des permissions (plus léger).
- L'anti-flood du login ne compte plus que les échecs : des connexions réussies
  depuis la même IP (réseau d'usine) ne bloquent plus personne.

### Corrigé
- Une erreur de validation à la création d'une intervention (type inconnu) renvoyait
  une erreur 500 au lieu du message utile.
- Les erreurs de base de données sont désormais toujours journalisées côté serveur.

## 5.0.0 — 2026-10-07

Première version publiée sous forme d'un seul dépôt (backend, front web, mobile).

### Ajouté
- Installation en une commande : `deploy/install.sh` puis `docker compose up -d`.
  La base est créée automatiquement (schéma, données de référence, rôle applicatif
  sans superuser, premier administrateur).
- Mobile servi sous `/m` par le même nginx que le front web et l'API (`/api`).
- Procédure et script de bascule d'une instance 4.x (`deploy/MIGRATION-v4.md`).
- Gestion des tâches côté mobile.
- Tests d'intégration sur base jetable (`scripts/test-integration.sh`).

### Sécurité
- Gestion des utilisateurs réservée aux administrateurs.
- L'auteur réel de chaque mutation est tracé depuis la session, y compris pour les
  changements de statut.
- Session refusée si la base ne peut pas vérifier l'utilisateur.
- Export CSV protégé contre l'injection de formules.
- Valeur d'API_ENV inconnue refusée au démarrage ; IP client fiable derrière un proxy.
- Déconnexion : le jeton de rafraîchissement est réellement révoqué (web et mobile).

### Corrigé
- Création d'un équipement sur une installation neuve (code et statut par défaut).
- Codes des statuts d'intervention vides : tâches, fermeture en cascade et compteurs
  du tableau de bord ne trouvaient rien.
- Plusieurs erreurs 500 dues à des imports manquants.

### Connu
- Les droits par rôle (matrice de permissions) ne sont pas encore appliqués aux
  routes métier : tout utilisateur connecté, et une clé d'API, peut écrire. Chantier
  prioritaire de la prochaine version.
