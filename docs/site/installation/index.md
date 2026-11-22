# Installation

Tunnel s'installe sur un serveur de l'entreprise avec Docker Compose. Les données restent
chez vous : Tunnel n'envoie rien à l'extérieur.

Trois services tournent ensemble :

| Service | Rôle |
| --- | --- |
| `web` | Le serveur web (nginx) : le front web, le front mobile sous `/m/`, et le relais vers l'API. C'est le seul service accessible depuis le réseau. |
| `api` | L'application (FastAPI). Elle prépare la base au démarrage. |
| `db` | La base PostgreSQL 15, avec ses données dans un volume nommé `tunnel-db`. |

## Les pages

1. [Prérequis et installation](./docker-compose) : installer, créer le premier
   administrateur, ouvrir Tunnel, protéger l'accès.
2. [Mise à jour et sauvegarde](./mise-a-jour) : sauvegarder la base, répéter une mise à jour
   sur une copie avant de la faire, passer à une nouvelle version, restaurer.

## En bref

```sh
git clone https://github.com/ProtoGulix/tunnel-gmao.git
cd tunnel-gmao/deploy
./install.sh admin@example.com
docker compose up -d --build
```

Remplacez `admin@example.com` par le courriel du futur administrateur. Le détail de chaque
étape est sur la page suivante.
