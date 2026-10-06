#!/bin/sh
# Démarrage du conteneur API : installation de la base, puis serveur.
# `set -e` : si le bootstrap échoue (base injoignable, migration en erreur),
# le conteneur s'arrête et Compose le relance, sans jamais servir une base à moitié prête.
set -eu

python -m scripts.bootstrap

# L'URL du rôle propriétaire ne sert qu'aux migrations et au bootstrap : l'API ne doit
# jamais la détenir, sinon une compromission d'uvicorn rendrait le rôle sans superuser inutile.
unset DATABASE_URL_OWNER

# L'API n'est joignable que depuis le réseau Compose (aucun port publié) : le seul
# client HTTP est le nginx du service web. FORWARDED_ALLOW_IPS peut être restreint
# à l'adresse de ce nginx si le réseau Compose est figé.
exec uvicorn api.app:app \
    --host 0.0.0.0 --port 8000 \
    --workers "${UVICORN_WORKERS:-2}" \
    --proxy-headers --forwarded-allow-ips "${FORWARDED_ALLOW_IPS:-*}"
