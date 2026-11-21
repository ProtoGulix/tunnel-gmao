#!/bin/sh
# Réinitialisation complète de l'instance de démonstration (ADR 0036, DEMO-06).
#   deploy/demo/reset-demo.sh
# Pensé pour une tâche planifiée nocturne : rejouable à tout moment, sans état à
# nettoyer avant. Pas à pas :
#   1. contrôles (projet « tunnel-demo », nom de base contenant « demo », secrets remplis) ;
#   2. arrêt du web et de l'API de la démonstration, puis base supprimée et recréée ;
#   3. installation normale : l'API démarre et son bootstrap applique migrations, rôles,
#      données de référence et droits, comme à toute installation ;
#   4. chargement du scénario (load_demo.py, joué dans le conteneur de l'API) ;
#   5. publication du proxy web.
# Seul le projet Compose « tunnel-demo » est touché : jamais de « down », de « prune » ni de
# commande sans -p. Un échec laisse le web arrêté plutôt que de publier une base incomplète.
set -eu

DIR=$(cd "$(dirname "$0")" && pwd)
ENV_FILE="${DEMO_ENV_FILE:-$DIR/.env.demo}"
COMPOSE_FILE_BASE="$DIR/../docker-compose.yml"
COMPOSE_FILE_DEMO="$DIR/docker-compose.demo.yml"
# DEMO_COMPOSE_PROJECT n'existe que pour les essais (tunnel-demo-<suffixe>) : la démonstration
# réelle reste « tunnel-demo ». Tout autre nom est refusé, en particulier « tunnel ».
PROJECT="${DEMO_COMPOSE_PROJECT:-tunnel-demo}"

fail() {
    echo "reset-demo : $*" >&2
    exit 1
}
say() {
    echo "reset-demo : $*"
}

case "$PROJECT" in
    tunnel-demo | tunnel-demo-[a-z0-9]*) ;;
    *) fail "projet Compose « $PROJECT » refusé (attendu : tunnel-demo)" ;;
esac
[ -n "${COMPOSE_PROJECT_NAME:-}" ] && [ "$COMPOSE_PROJECT_NAME" != "$PROJECT" ] \
    && fail "COMPOSE_PROJECT_NAME=$COMPOSE_PROJECT_NAME diffère du projet $PROJECT"
[ -f "$ENV_FILE" ] || fail "$ENV_FILE introuvable (copier .env.demo.example, voir README.md)"

# Valeur d'une variable du fichier d'environnement (dernière occurrence, sans « source »).
getv() {
    sed -n "s/^$1=//p" "$ENV_FILE" | tail -n 1
}
require() {
    value=$(getv "$1")
    [ -n "$value" ] || fail "$1 est vide dans $ENV_FILE"
}

for name in DEMO_DB_NAME DB_OWNER_PASSWORD DB_APP_PASSWORD JWT_SECRET_KEY ADMIN_EMAIL DEMO_PASSWORD; do
    require "$name"
done
DB_NAME=$(getv DEMO_DB_NAME)
case "$DB_NAME" in
    *[!a-z0-9_]* | '') fail "DEMO_DB_NAME « $DB_NAME » : minuscules, chiffres et _ seulement" ;;
    *demo*) ;;
    *) fail "DEMO_DB_NAME « $DB_NAME » ne contient pas « demo » : refus (garde-fou)" ;;
esac
[ "$(getv DEMO_MODE)" = "true" ] || fail "DEMO_MODE doit valoir true dans $ENV_FILE"
[ "$(getv MAIL_ENABLED)" = "false" ] || fail "MAIL_ENABLED doit valoir false dans $ENV_FILE"
[ "$(getv API_ENV)" = "production" ] || fail "API_ENV doit valoir production dans $ENV_FILE"
case "$(getv HTTP_BIND)" in
    127.0.0.1) ;;
    *) fail "HTTP_BIND doit valoir 127.0.0.1 (le tunnel HTTPS se raccorde en local)" ;;
esac

# Une seule réinitialisation à la fois (cron et lancement manuel qui se chevauchent).
if command -v flock >/dev/null 2>&1; then
    exec 9>"$DIR/.reset-demo.lock"
    flock -n 9 || fail "une réinitialisation est déjà en cours"
fi

# Le mot de passe public ne passe que par l'environnement de ce processus.
DEMO_PASSWORD=$(getv DEMO_PASSWORD)
export DEMO_PASSWORD

dc() {
    docker compose -p "$PROJECT" --env-file "$ENV_FILE" \
        -f "$COMPOSE_FILE_BASE" -f "$COMPOSE_FILE_DEMO" "$@"
}

say "projet $PROJECT, base $DB_NAME"
say "base de données"
dc up -d --wait db
dc stop web api

say "base recréée (supprimée puis créée)"
dc exec -T db psql -v ON_ERROR_STOP=1 -q -U tunnel_owner -d postgres \
    -c "DROP DATABASE IF EXISTS \"$DB_NAME\" WITH (FORCE)" \
    -c "CREATE DATABASE \"$DB_NAME\""

say "installation normale (migrations, bootstrap) : démarrage de l'API"
dc up -d --build --wait api

say "chargement du scénario"
dc exec -T api mkdir -p /tmp/demo
dc cp "$DIR/load_demo.py" api:/tmp/demo/load_demo.py
dc cp "$DIR/scenario" api:/tmp/demo
dc exec -T -e DEMO_PASSWORD api python /tmp/demo/load_demo.py

say "publication du proxy web"
dc up -d --build --wait web
say "terminé : démonstration prête sur http://$(getv HTTP_BIND):$(getv HTTP_PORT)"
