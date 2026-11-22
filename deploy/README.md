# Installer Tunnel GMAO

Prérequis : une machine Linux avec Docker et le plugin Docker Compose (v2), 2 Go de
mémoire libre, et `git`.

## Installation en 4 commandes

```sh
git clone https://github.com/ProtoGulix/tunnel-gmao.git
cd tunnel-gmao/deploy
./install.sh admin@votre-entreprise.fr
docker compose up -d --build
```

`install.sh` crée `deploy/.env` avec des mots de passe et une clé de signature
aléatoires, et ne remplace jamais un `.env` existant. La première construction
prend quelques minutes. Ensuite, ouvrir <http://127.0.0.1:8080> (front web) ou
<http://127.0.0.1:8080/m/> (front mobile) depuis la machine.

## Premier administrateur

Au premier démarrage, l'installation de la base crée le compte de l'adresse
`ADMIN_EMAIL` avec un mot de passe aléatoire, affiché une seule fois dans les
journaux de l'API :

```sh
docker compose logs api
```

Le mot de passe est à changer à la première connexion. S'il a été perdu avant la
première connexion, supprimer la base (`docker compose down -v`, **efface toutes les
données**) et recommencer, uniquement sur une installation vide.

## HTTPS obligatoire hors réseau interne

Tunnel ne livre que du HTTP. Les mots de passe et les jetons de connexion
circuleraient en clair : **ne jamais exposer le port publié directement sur Internet**.

- Réseau interne de l'usine uniquement : mettre `HTTP_BIND=0.0.0.0` dans `.env`
  (accessible depuis tout le réseau local, sans chiffrement).
- Accès depuis Internet : placer un proxy HTTPS (Cloudflare Tunnel, Caddy, Traefik,
  nginx...) devant, garder `HTTP_BIND=127.0.0.1`, et renseigner dans `.env`
  `PUBLIC_URL` (adresse HTTPS publique), `TRUSTED_PROXIES` et `REAL_IP_HEADER`.

### IP réelle des clients

L'API trace l'IP de chaque connexion. nginx pose lui-même `X-Forwarded-For` ; il
n'accepte jamais celui d'un client. Par défaut c'est l'adresse TCP vue par nginx.
Derrière un proxy, indiquer ses adresses et l'en-tête qui porte l'IP du client :

```sh
# Cloudflare Tunnel (cloudflared sur la même machine, via le port publié)
TRUSTED_PROXIES=172.16.0.0/12
REAL_IP_HEADER=CF-Connecting-IP
```

L'en-tête n'est lu que si la connexion vient d'une adresse de `TRUSTED_PROXIES`.
Contrôler le résultat dans les journaux de l'API après une connexion.

## Mise à jour

```sh
cd tunnel-gmao
git pull
cd deploy
./sauvegarder.sh                                          # 1. sauvegarde
./repeter-mise-a-jour.sh ~/sauvegardes-tunnel/tunnel-AAAA-MM-JJ-HHMM.sql.gz   # 2. répétition
docker compose up -d --build                              # 3. seulement si la répétition est verte
```

Les migrations s'appliquent au démarrage de l'API. Une migration qui échoue empêche l'API
de démarrer : d'où la répétition. `repeter-mise-a-jour.sh` restaure la sauvegarde dans un
PostgreSQL jetable (réseau jetable, aucun port publié, mot de passe aléatoire), construit
l'image de l'API depuis le code récupéré (`docker compose build api`, sans rien lancer ni
recréer) et y joue la commande de démarrage de l'API, `python -m scripts.bootstrap` :
migrations, rôle applicatif et données de départ, comme en production. Il affiche la
révision avant et après, l'erreur exacte de la migration en cause s'il y en a une, et le
décompte des priorités d'intervention. Il se termine par un code non nul au moindre échec ;
dans ce cas ne pas lancer l'étape 3. La production n'est jamais touchée, et conteneur,
volume et réseau jetables sont supprimés dans tous les cas. La répétition demande de la
place pour une copie de la base et quelques minutes pour la construction.

## Sauvegarde et restauration de la base

```sh
# Sauvegarde (depuis n'importe quel répertoire ; à planifier, par exemple avec cron)
./sauvegarder.sh [dossier]
```

`sauvegarder.sh` écrit `tunnel-AAAA-MM-JJ-HHMM.sql.gz` dans `~/sauvegardes-tunnel/` (ou
dans le dossier donné, créé au besoin, accessible à vous seul), ne remplace jamais un
fichier existant, contrôle l'archive et n'en laisse aucune si la sauvegarde échoue.
Ne pas utiliser un simple `pg_dump | gzip` : sans contrôle, un échec laisse un fichier
vide qui a l'air bon.

```sh
# Restauration dans une installation neuve (install.sh fait, base jamais démarrée avec l'API)
docker compose up -d db
docker compose exec -T db psql -U tunnel_owner -d tunnel -c "CREATE ROLE tunnel_app LOGIN"
gunzip -c ~/sauvegardes-tunnel/tunnel-AAAA-MM-JJ-HHMM.sql.gz | docker compose exec -T db psql -U tunnel_owner -d tunnel -v ON_ERROR_STOP=1 --single-transaction
docker compose up -d --build
```

Le rôle `tunnel_app` doit exister avant la restauration : la sauvegarde lui donne des droits.
Au démarrage, l'API lui pose le mot de passe du `.env` et ses droits. `ON_ERROR_STOP` et
`--single-transaction` arrêtent tout à la première erreur, sans restauration à moitié faite.
C'est l'ordre que joue `repeter-mise-a-jour.sh` dans sa base jetable.

Conserver les sauvegardes hors de la machine. Le fichier `.env` fait aussi partie de
la sauvegarde (le script ne le copie pas) : sans `JWT_SECRET_KEY` et les mots de passe,
une restauration demande de les régénérer.

## Réglages

Tous les réglages sont commentés dans `.env.example` : adresse et port d'écoute,
taille maximale d'un envoi (`CLIENT_MAX_BODY_SIZE`), envoi de mails (`SMTP_*`).
Après modification de `.env` : `docker compose up -d`.

## Architecture

| Service | Rôle | Port publié |
| --- | --- | --- |
| `web` | nginx : front web sous `/`, mobile sous `/m/`, proxy de `/api/` vers l'API | oui (`HTTP_BIND:HTTP_PORT`) |
| `api` | FastAPI, lance le bootstrap puis uvicorn | non |
| `db` | PostgreSQL 15, volume nommé `tunnel-db` | non |

## Stack de développement (contributeurs)

Pour travailler sur le code, `docker-compose.dev.yml` remplace les images figées par
du rechargement à chaud : API en `uvicorn --reload` sur `backend/` monté, fronts web
et mobile servis par Vite (ADR 0010). Depuis la racine du dépôt :

```
docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.dev.yml up -d
```

Derrière un proxy HTTPS, renseigner `DEV_ALLOWED_HOSTS` et `DEV_HMR_CLIENT_PORT=443`
dans `deploy/.env`, et faire transmettre les websockets par le proxy (en-têtes
`Upgrade` et `Connection`). Sans `DEV_ALLOWED_HOSTS`, Vite n'accepte que localhost.
Prérequis : Docker Compose 2.24 ou plus (`!reset`), dépôt possédé par l'uid 1000
(utilisateur node des conteneurs Vite). Pas de CSP en dev : ne jamais utiliser cette
stack en production, ni y mettre des comptes ou secrets de production.
