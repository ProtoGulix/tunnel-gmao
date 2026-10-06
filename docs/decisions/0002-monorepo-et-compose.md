# 0002. Un seul dépôt public, Compose à trois services, installation automatique

- Statut : accepté
- Date : 2026-10-06

## Contexte

Tunnel est réparti en trois dépôts (tunnel-backend, tunnel-gmao,
web.tunnel-mobile). L'utilisateur veut un seul dépôt visible et propre, et une
installation automatique de la base, en proposant un conteneur unique. Les
historiques actuels contiennent un mot de passe de base commité, des scripts
dupliqués entre dépôts, des IP et un nom de domaine internes.

## Décision

1. Un nouveau dépôt public, avec un historique neuf (premier commit en v5.0.0).
   Les trois anciens dépôts passent en privé et sont archivés.
2. Structure : backend/, web/, mobile/, deploy/ (docker-compose.yml, .env.example,
   nginx/), docs/.
3. Déploiement par docker compose up, avec trois services :
   - db : image postgres officielle, volume nommé, aucun port publié ;
   - api : FastAPI, utilisateur non root, API_ENV=production ;
   - web : nginx qui sert le front web et le mobile, et fait proxy de /api.
     Seul service publié.
4. Installation de la base au démarrage de l'api : attente du healthcheck,
   alembic upgrade head, données de départ idempotentes (rôles, référentiels,
   matrice de permissions), premier admin créé depuis ADMIN_EMAIL avec un mot de
   passe aléatoire affiché une fois et à changer à la première connexion.
5. Deux rôles PostgreSQL : propriétaire (migrations) et applicatif (sans superuser).
6. Avant publication : gitleaks sur le nouveau dépôt, sans constat.

## Alternatives écartées

- Un seul conteneur avec PostgreSQL, l'API et nginx (supervisord) : mises à jour
  de l'image qui touchent aux données, sauvegardes et montées de version
  PostgreSQL plus délicates, une panne de l'API arrête la base, perte des
  correctifs des images officielles. L'expérience utilisateur visée (une
  commande) est obtenue par Compose.
- Importer les historiques (git subtree ou filter-repo) : risque de laisser un
  secret ou une donnée interne, coût de nettoyage élevé pour peu de valeur.

## Conséquences

- Une seule origine pour les fronts et l'API : CORS devient inutile en production.
- L'IP client est fournie par le nginx interne, ce qui règle l'usurpation de
  X-Forwarded-For (audit 2026-10-06).
- Points NON TRANCHÉS : mobile servi sous un sous-chemin du même nginx
  (recommandé) ou en service séparé ; TLS dans nginx ou laissé à Cloudflare ;
  suppression de Directus et Redis.
- Un script de migration de l'instance existante est à prévoir (pg_dump,
  restauration, alembic stamp).
