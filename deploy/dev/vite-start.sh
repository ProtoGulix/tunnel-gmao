#!/bin/sh
# Démarrage d'un serveur Vite de la stack de dev (ADR 0010), lancé en root depuis
# le dossier du front (web/ ou mobile/).
# node_modules vit dans un volume nommé : réinstallé seulement si package-lock.json
# a changé depuis la dernière installation.
set -eu

chown node:node node_modules

exec su node -s /bin/sh -c '
    set -eu
    lock_hash=$(sha1sum package-lock.json | cut -d" " -f1)
    if [ "$(cat node_modules/.lock-sha1 2>/dev/null || true)" != "$lock_hash" ]; then
        echo "vite-start : installation des dépendances (npm ci)"
        rm -f node_modules/.lock-sha1
        npm ci --no-audit --no-fund
        echo "$lock_hash" > node_modules/.lock-sha1
    fi
    exec npm run dev
'
