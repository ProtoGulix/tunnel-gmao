# SAUV-02. Script de répétition d'une mise à jour sur une copie

- Statut : faite (2026-11-22)
- Agent : db-dev
- Branche : feat/scripts-sauvegarde (depuis develop, ADR 0008)
- Dépend de : SAUV-01
- Périmètre d'écriture : deploy/repeter-mise-a-jour.sh (nouveau), deploy/README.md (section
  « Mise à jour »). Exclu : docker-compose*.yml, .env*, backend/ (le script utilise le code
  et l'image tels quels), toute écriture dans une base autre que la base jetable.

## Contexte

Les migrations se jouent au démarrage de l'API (backend/docker-entrypoint.sh : bootstrap puis
uvicorn ; alembic avec une transaction par migration, backend/alembic/env.py). Une migration
qui échoue en production empêche l'API de démarrer (cas possible : garde de la migration 0025,
ADR 0039). Avant `docker compose up -d --build`, l'exploitant doit pouvoir rejouer la mise à
jour sur une copie de sa sauvegarde, sans toucher à la production.

## Critères d'acceptation

- [x] `deploy/repeter-mise-a-jour.sh <sauvegarde.sql.gz>` restaure la sauvegarde dans un
      conteneur PostgreSQL jetable (même image que le service db de deploy/docker-compose.yml),
      sur un réseau Docker jetable, sans port publié, mot de passe aléatoire non affiché.
- [x] Joue la mise à jour avec l'image de l'API construite depuis le code courant (le script
      la construit si besoin par `docker compose build api`, sans lancer ni recréer de
      service) et la même commande que le démarrage (bootstrap : migrations et données de
      départ) ; à défaut de pouvoir jouer le bootstrap complet hors Compose, alembic upgrade
      head, en le disant dans le README.
- [x] Affiche : révision alembic avant et après, succès ou erreur exacte de la migration en
      cause, décompte des priorités d'intervention (`SELECT priority, count(*) ...`) ; code
      de sortie nul seulement si la mise à jour passe.
- [x] Supprime conteneur, volume et réseau jetables dans tous les cas (trap), y compris sur
      Ctrl-C ; ne laisse aucune donnée de la sauvegarde sur le disque hors du fichier fourni.
- [x] Essai réel sur cette machine avec une sauvegarde de la base de dev faite par SAUV-01 :
      répétition verte (base de dev en 0025 : aucune migration à jouer, à constater), puis une
      répétition qui doit jouer des migrations (par exemple sauvegarde restaurée puis révision
      abaissée dans la base jetable seulement, ou autre moyen sans toucher à la base de dev) ;
      essai d'échec (valeur de priorité inconnue insérée dans la base jetable seulement) :
      message clair, code non nul, nettoyage fait. Aucun conteneur jetable restant.
- [x] deploy/README.md : section « Mise à jour » en quatre étapes (git pull, sauvegarder,
      répéter, up -d --build si la répétition est verte).
- [x] scripts/check.sh vert ; `sh -n` ; shellcheck s'il est installé.

## Compte rendu final

Fait (db-dev, sonnet) : deploy/repeter-mise-a-jour.sh (image de la base lue dans le
Compose, réseau et volume jetables, aucun port publié, mots de passe aléatoires par
l'environnement, rôle tunnel_app créé avant la restauration en transaction unique, bootstrap
complet par l'image de l'API construite depuis le code courant, révision avant et après,
décompte des priorités, code non nul au moindre échec, trap de nettoyage) ; README, mise à
jour en quatre étapes. Essais de l'agent : répétition verte sur la base de dev (0025, rien à
jouer) ; 0024 → 0025 joué après abaissement dans la base jetable ; priorité inconnue
« critique » : échec nommé par la garde de 0025, code 1, nettoyage fait ; archive invalide
refusée ; Ctrl-C pendant la restauration : rien ne reste. Commande en échec : un premier
essai de Ctrl-C mal envoyé par l'agent (kill sur un mauvais groupe), conteneur jetable resté
un temps puis nettoyé par le second essai.

Contrôle de l'agent principal : périmètre conforme, script relu, message d'échec de la
restauration corrigé (il accusait la sauvegarde) ; répétition relancée sur une sauvegarde
fraîche : verte, aucun conteneur, volume ni réseau restant, stack de dev intacte.
NON VÉRIFIÉ : serveur de production réel, Ctrl-C pendant la construction ou le bootstrap,
temps et place disque sur une grosse base. `docker compose build api` retague
tunnel-api:local (voulu en production, sans effet sur les conteneurs en cours).

Reviewer APPROUVÉ ; réserves corrigées par l'agent principal : mot de passe du rôle par l'entrée standard (plus dans la liste des processus), fin de dump contrôlée avant restauration (dump tronqué refusé, essayé), réseau jetable --internal (répétition verte relancée), et dans sauvegarder.sh droits 700 seulement sur un dossier créé par le script. Non retenus : liens physiques absents sur certains montages (message clair), seq hors POSIX (présent partout).
