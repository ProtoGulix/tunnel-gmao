#!/bin/sh
# Sauvegarde la base de Tunnel dans un fichier tunnel-AAAA-MM-JJ-HHMM.sql.gz.
#   ./sauvegarder.sh [dossier]
# Dossier par défaut : ~/sauvegardes-tunnel (créé au besoin, accessible à vous seul).
# Se lance depuis n'importe quel répertoire. Ne remplace jamais un fichier existant ;
# si la sauvegarde échoue, aucun fichier partiel ne reste.
# Variables de test, inutiles en exploitation : TUNNEL_DB_SERVICE (service Compose de la
# base, défaut db) et TUNNEL_DB_NAME (nom de la base, défaut tunnel).
set -eu

DIR=$(cd "$(dirname "$0")" && pwd)
SERVICE="${TUNNEL_DB_SERVICE:-db}"
DB_NAME="${TUNNEL_DB_NAME:-tunnel}"
TARGET="${1:-${HOME:?HOME non défini : indiquer un dossier}/sauvegardes-tunnel}"

fail() { echo "ERREUR : $*" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || fail "docker introuvable."
[ -f "$DIR/docker-compose.yml" ] || fail "docker-compose.yml introuvable à côté du script ($DIR)."

umask 077
# Droits imposés seulement à un dossier créé ici : un dossier existant garde les siens.
if [ ! -d "$TARGET" ]; then
    mkdir -p "$TARGET"
    chmod 700 "$TARGET"
fi

stamp=$(date +%Y-%m-%d-%H%M)
final="$TARGET/tunnel-$stamp.sql.gz"
[ ! -e "$final" ] || fail "$final existe déjà : rien n'est remplacé. Réessayer dans une minute."

tmp=$(mktemp "$TARGET/.tunnel-sauvegarde.XXXXXX")
raw="$tmp.sql"
trap 'rm -f "$tmp" "$raw"' EXIT
trap 'exit 130' INT TERM

# POSIX sh n'a pas pipefail : pg_dump écrit d'abord un fichier SQL brut dont on contrôle
# le code de sortie, puis on le compresse. Un « pg_dump | gzip » masquerait son échec.
echo "Sauvegarde de la base $DB_NAME (service $SERVICE)..."
if ! (cd "$DIR" && docker compose exec -T "$SERVICE" pg_dump -U tunnel_owner -d "$DB_NAME") > "$raw"; then
    fail "pg_dump a échoué (service $SERVICE arrêté ou absent, base ou rôle inconnu ?). Voir le message ci-dessus. Aucun fichier créé. Lancer 'docker compose ps' dans $DIR."
fi
[ -s "$raw" ] || fail "pg_dump n'a rien produit. Aucun fichier créé."
tail -n 5 "$raw" | grep -q '^-- PostgreSQL database dump complete' \
    || fail "la sauvegarde est incomplète (fin de dump PostgreSQL absente). Aucun fichier créé."

gzip -c "$raw" > "$tmp" || fail "compression impossible (disque plein ?). Aucun fichier créé."
gunzip -t "$tmp" || fail "archive invalide. Aucun fichier créé."
[ -s "$tmp" ] || fail "archive vide. Aucun fichier créé."
gunzip -c "$tmp" | tail -n 5 | grep -q '^-- PostgreSQL database dump complete' \
    || fail "l'archive ne se termine pas comme un dump PostgreSQL. Aucun fichier créé."

chmod 600 "$tmp"
# ln refuse d'écraser : protège d'un fichier créé entre-temps.
ln "$tmp" "$final" || fail "impossible de créer $final."

size=$(du -h "$final" | cut -f1)
echo "Sauvegarde créée : $final ($size)"
echo "À faire : garder une copie hors de cette machine, et sauvegarder à part $DIR/.env"
echo "(ce script ne le copie pas : sans lui, une restauration demande de régénérer les secrets)."
