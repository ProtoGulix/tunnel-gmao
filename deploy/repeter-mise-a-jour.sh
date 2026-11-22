#!/bin/sh
# Répète une mise à jour sur une copie de la base, sans toucher à la production.
#   ./repeter-mise-a-jour.sh <sauvegarde.sql.gz>
# À lancer après « git pull » et ./sauvegarder.sh, avant « docker compose up -d --build ».
#
# Le script restaure la sauvegarde dans un PostgreSQL jetable (même image que le service
# db, réseau Docker jetable, aucun port publié, mot de passe aléatoire), construit l'image
# de l'API depuis le code courant (docker compose build api : aucun service n'est lancé ni
# recréé) et y joue la même commande qu'au démarrage de l'API : migrations et données de
# départ (python -m scripts.bootstrap). Il affiche la révision avant et après et le
# décompte des priorités d'intervention. Code de sortie 0 seulement si tout passe.
# Conteneurs, volume et réseau jetables sont supprimés dans tous les cas, Ctrl-C compris.
#
# Variable de test, inutile en exploitation : REPETITION_SQL_ESSAI, fichier SQL joué dans
# la base jetable (jamais ailleurs) après la restauration, pour simuler un état à migrer.
set -eu

DIR=$(cd "$(dirname "$0")" && pwd)
API_IMAGE="tunnel-api:local"   # nom fixé par docker-compose.yml
FILE="${1:-}"

fail() { echo "ERREUR : $*" >&2; exit 1; }
say() { echo "[répétition] $*"; }

[ -n "$FILE" ] && [ "$#" -eq 1 ] || fail "usage : $0 <sauvegarde.sql.gz>"
[ -f "$FILE" ] || fail "sauvegarde introuvable : $FILE"
command -v docker >/dev/null 2>&1 || fail "docker introuvable."
[ -f "$DIR/docker-compose.yml" ] || fail "docker-compose.yml introuvable à côté du script ($DIR)."
gunzip -t "$FILE" 2>/dev/null || fail "$FILE n'est pas une archive gzip valide."
# Un dump tronqué mais gzip valide ferait une répétition verte à tort.
gunzip -c "$FILE" | tail -n 5 | grep -q '^-- PostgreSQL database dump complete' \
    || fail "$FILE ne se termine pas comme un dump PostgreSQL complet : sauvegarde tronquée ?"
if [ -n "${REPETITION_SQL_ESSAI:-}" ]; then
    [ -f "$REPETITION_SQL_ESSAI" ] || fail "REPETITION_SQL_ESSAI introuvable : $REPETITION_SQL_ESSAI"
fi

# Chaîne aléatoire alphanumérique de longueur $1 (sûre dans une URL de connexion).
random() { LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c "$1"; }

SUFFIX="$$-$(random 6)"
NAME="tunnel-repetition-$SUFFIX"
NETWORK="$NAME"
VOLUME="$NAME"
DB_CONTAINER="$NAME-db"
API_CONTAINER="$NAME-api"

# Supprime tout ce que le script a créé ; chaque étape tolère l'échec.
cleanup() {
    rc=$?
    trap - EXIT INT TERM
    docker rm -f -v "$API_CONTAINER" "$DB_CONTAINER" >/dev/null 2>&1 || true
    docker volume rm -f "$VOLUME" >/dev/null 2>&1 || true
    docker network rm "$NETWORK" >/dev/null 2>&1 || true
    exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

# Image de la base : celle du service db de docker-compose.yml, à défaut postgres:15.
DB_IMAGE=$(cd "$DIR" && docker compose config --images 2>/dev/null | grep -m1 '^postgres:' || true)
DB_IMAGE="${DB_IMAGE:-postgres:15}"

say "construction de l'image de l'API depuis le code courant (aucun service lancé)"
(cd "$DIR" && docker compose build api) >/dev/null \
    || fail "docker compose build api a échoué (deploy/.env présent ? lancer install.sh sinon)."

OWNER_PW=$(random 32)
APP_PW=$(random 32)
JWT_KEY=$(random 64)

say "base jetable ($DB_IMAGE), réseau et volume jetables, aucun port publié"
# --internal : aucun accès sortant pour les conteneurs qui portent une copie des données.
docker network create --internal "$NETWORK" >/dev/null
docker volume create "$VOLUME" >/dev/null
# La valeur passe par l'environnement du client docker, jamais par la ligne de commande.
POSTGRES_PASSWORD="$OWNER_PW" docker run -d --name "$DB_CONTAINER" --network "$NETWORK" \
    --network-alias db -e POSTGRES_PASSWORD -e POSTGRES_USER=tunnel_owner -e POSTGRES_DB=tunnel \
    -v "$VOLUME:/var/lib/postgresql/data" "$DB_IMAGE" >/dev/null

# Le serveur d'initialisation de l'image n'écoute pas en TCP : le test TCP n'aboutit qu'une
# fois le serveur définitif démarré.
ready=0
for _ in $(seq 1 60); do
    if docker exec "$DB_CONTAINER" pg_isready -q -h 127.0.0.1 -U tunnel_owner -d tunnel; then ready=1; break; fi
    sleep 1
done
[ "$ready" = 1 ] || fail "la base jetable ne démarre pas."

# Connexion locale du conteneur : sans mot de passe, jamais exposée hors du conteneur.
db_psql() { docker exec -i "$DB_CONTAINER" psql -U tunnel_owner -d tunnel -X -q -v ON_ERROR_STOP=1 "$@"; }
revision() {
    db_psql -At -c "SELECT COALESCE(string_agg(version_num, ',' ORDER BY version_num), 'aucune') FROM alembic_version_backend" 2>/dev/null \
        || echo "illisible"
}

say "restauration de la sauvegarde dans la base jetable"
# Les droits du dump visent le rôle applicatif : il doit exister avant la restauration.
# Par l'entrée standard : le mot de passe n'apparaît pas dans la liste des processus.
printf "CREATE ROLE tunnel_app LOGIN PASSWORD '%s';\n" "$APP_PW" | db_psql >/dev/null
gunzip -c "$FILE" | db_psql --single-transaction -o /dev/null \
    || fail "la restauration dans la base jetable a échoué (voir ci-dessus) : sauvegarde incomplète ou rôle absent de la base jetable. La production n'a pas été touchée."

if [ -n "${REPETITION_SQL_ESSAI:-}" ]; then
    say "essai : $REPETITION_SQL_ESSAI joué dans la base jetable"
    db_psql -o /dev/null < "$REPETITION_SQL_ESSAI" || fail "le SQL d'essai a échoué."
fi

before=$(revision)
say "révision alembic avant : $before"

say "mise à jour : python -m scripts.bootstrap (migrations et données de départ), comme au démarrage"
# Les valeurs sont lues dans notre environnement (-e NOM sans valeur) : rien dans la ligne de commande.
export DATABASE_URL_OWNER="postgresql://tunnel_owner:$OWNER_PW@db:5432/tunnel"
export DATABASE_URL="postgresql://tunnel_app:$APP_PW@db:5432/tunnel"
export JWT_SECRET_KEY="$JWT_KEY"
export ADMIN_EMAIL="admin@example.com"
export API_ENV="production"
rc=0
docker run --rm --name "$API_CONTAINER" --network "$NETWORK" \
    -e DATABASE_URL_OWNER -e DATABASE_URL -e JWT_SECRET_KEY -e ADMIN_EMAIL -e API_ENV \
    --entrypoint python "$API_IMAGE" -m scripts.bootstrap || rc=$?

after=$(revision)
say "révision alembic après : $after"
say "priorités d'intervention (priorité, nombre) :"
db_psql -At -F ' : ' -c "SELECT COALESCE(priority, '(vide)'), count(*) FROM intervention GROUP BY 1 ORDER BY 1" 2>/dev/null \
    | sed 's/^/    /' || true

if [ "$rc" -ne 0 ]; then
    echo "ÉCHEC de la mise à jour (code $rc) : l'erreur de la migration en cause est affichée plus haut." >&2
    echo "Ne pas lancer 'docker compose up -d --build' : l'API ne démarrerait pas. La production n'a pas été touchée." >&2
    exit 1
fi
say "mise à jour réussie : $before -> $after. La production n'a pas été touchée ; vous pouvez lancer 'docker compose up -d --build'."
