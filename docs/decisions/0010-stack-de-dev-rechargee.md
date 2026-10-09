# 0010. Stack de dev : tout en rechargement automatique depuis le dépôt

- Statut : accepté
- Date : 2026-10-09
- Affine : ADR 0002, ADR 0006

## Contexte

Le serveur de dev (https://tunnel-dev.frezille.fr) faisait tourner la stack Compose de
production : images construites depuis un tag, nginx qui sert des fichiers figés. Une
modification du dépôt n'était visible qu'après reconstruction des images, donc jamais
pendant le travail sur une branche. La production tourne sur un autre serveur ; ce
serveur ne sert qu'au développement.

## Décision

1. Un fichier `deploy/docker-compose.dev.yml` s'ajoute au fichier Compose de base,
   sans le modifier. On lance la stack de dev depuis la racine du dépôt de travail :

       docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.dev.yml up -d

2. api : le dossier `backend/` est monté dans le conteneur et uvicorn tourne avec
   `--reload` (un seul processus). Le bootstrap (migrations, rôle applicatif, premier
   admin) s'exécute toujours au démarrage du conteneur, pas à chaque rechargement.
3. web-vite et mobile-vite : deux conteneurs Node (même version que l'image de build)
   lancent `npm run dev` sur le code monté, avec leurs node_modules dans un volume
   nommé (installés au démarrage quand package-lock.json change). Le mobile est servi
   sous `/m/`. Le rechargement à chaud passe par une websocket sur le port 443 du
   domaine (`VITE_HMR_CLIENT_PORT`).
4. web : le même conteneur nginx (même nom, même port publié) charge une
   configuration de dev, `deploy/nginx/tunnel.dev.conf.template` : `/api/` vers l'API
   comme en production, `/m/` et `/` vers les serveurs Vite, websockets transmises.
   La politique CSP de production n'y est pas appliquée : le serveur Vite injecte des
   scripts en ligne qu'elle bloquerait.
5. Le nginx de l'hôte transmet les en-têtes `Upgrade` et `Connection` pour que les
   websockets traversent jusqu'à la stack.
6. API_ENV reste `production` en dev : la base contient une copie de données réelles
   et le domaine est public, donc /docs reste fermé et les garde-fous de démarrage
   restent actifs.

## Alternatives écartées

1. Reconstruire les images à chaque modification (watch Compose ou script) : une
   construction du front prend plus d'une minute, sans rechargement à chaud.
2. Lancer Vite et uvicorn directement sur l'hôte : processus hors de Compose, à
   relancer à la main après un redémarrage, et API exposée hors du réseau interne.
3. Garder un clone séparé pour le serveur de dev : c'était la situation de départ ;
   il ne montre jamais la branche en cours.

## Conséquences

1. Le serveur de dev montre la branche extraite dans ~/DEV/tunnel-gmao. Changer de
   branche change ce que voit le navigateur.
2. Une migration présente sur une branche s'applique à la base de dev au prochain
   démarrage du conteneur api. La règle de CLAUDE.md 11.4 s'applique donc aussi au
   redémarrage de la stack : pas de redémarrage sur une branche qui contient une
   migration sans l'accord de l'utilisateur.
3. Le fichier deploy/.env du serveur vit dans le dépôt de travail, ignoré par git.
4. Le fichier Compose de base et le nginx de production ne changent pas : une
   installation PME n'est pas concernée.
5. Le polling de Vite (web/vite.config.js) reste actif : il coûte un peu de CPU
   sur la VM.
