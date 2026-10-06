#!/bin/sh
# Prépare deploy/.env avec des secrets aléatoires (ADR 0002).
#   ./install.sh [email-admin]
# L'e-mail peut aussi venir de la variable ADMIN_EMAIL, sinon il est demandé.
# PUBLIC_URL (facultatif) fixe l'adresse publique, par exemple https://gmao.exemple.fr.
# Ne remplace jamais un .env existant : les secrets en place restent valables.
set -eu

DIR=$(cd "$(dirname "$0")" && pwd)
ENV_FILE="$DIR/.env"

if [ -e "$ENV_FILE" ]; then
    echo "$ENV_FILE existe déjà : rien n'est modifié."
    exit 0
fi

# Chaîne aléatoire alphanumérique de longueur $1 (sûre dans une URL de connexion).
random() {
    LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c "$1"
}

email="${1:-${ADMIN_EMAIL:-}}"
if [ -z "$email" ]; then
    printf "E-mail du premier administrateur : "
    read -r email
fi
case "$email" in
    ''|*[!A-Za-z0-9._%+@-]*|*@*@*|@*|*@) echo "E-mail invalide : $email" >&2; exit 1 ;;
    *@*.*) ;;
    *) echo "E-mail invalide : $email" >&2; exit 1 ;;
esac

umask 077
tmp=$(mktemp "$DIR/.env.XXXXXX")
trap 'rm -f "$tmp"' EXIT

sed \
    -e "s|^DB_OWNER_PASSWORD=.*|DB_OWNER_PASSWORD=$(random 32)|" \
    -e "s|^DB_APP_PASSWORD=.*|DB_APP_PASSWORD=$(random 32)|" \
    -e "s|^JWT_SECRET_KEY=.*|JWT_SECRET_KEY=$(random 64)|" \
    -e "s|^ADMIN_EMAIL=.*|ADMIN_EMAIL=$email|" \
    "$DIR/.env.example" > "$tmp"

if [ -n "${PUBLIC_URL:-}" ]; then
    case "$PUBLIC_URL" in
        *[!A-Za-z0-9:/._-]*) echo "PUBLIC_URL invalide." >&2; exit 1 ;;
    esac
    sed -i -e "s|^PUBLIC_URL=.*|PUBLIC_URL=$PUBLIC_URL|" "$tmp"
fi

chmod 600 "$tmp"
# ln refuse d'écraser : protège d'un .env créé entre-temps.
ln "$tmp" "$ENV_FILE"
echo "Créé : $ENV_FILE (lisible par vous seul)."
echo "Étape suivante : cd $DIR && docker compose up -d --build"
