#!/bin/sh
# Génère /etc/nginx/real_ip.conf au démarrage (mécanisme /docker-entrypoint.d de
# l'image nginx officielle, exécuté avant nginx).
#
# Par défaut (TRUSTED_PROXIES vide) : aucun en-tête n'est cru, l'IP du client est
# l'adresse TCP vue par nginx. Si un proxy amont (Cloudflare, Traefik, Caddy...) est
# devant nginx, y mettre ses adresses (CIDR, séparées par des espaces ou virgules) et
# nommer l'en-tête qui porte l'IP du client dans REAL_IP_HEADER (CF-Connecting-IP,
# X-Forwarded-For, X-Real-IP). nginx ne lit cet en-tête que si la connexion vient
# d'une de ces adresses : un client direct ne peut pas se faire passer pour un autre.
set -eu

OUT=/etc/nginx/real_ip.conf
: > "$OUT"

proxies=$(printf '%s' "${TRUSTED_PROXIES:-}" | tr ',' ' ')
if [ -z "$proxies" ]; then
    echo "real-ip : aucun proxy de confiance, IP client = adresse TCP" >&2
    exit 0
fi

for cidr in $proxies; do
    case "$cidr" in
        *[!0-9a-fA-F:./]*) echo "real-ip : adresse invalide dans TRUSTED_PROXIES : $cidr" >&2; exit 1 ;;
    esac
    echo "set_real_ip_from $cidr;" >> "$OUT"
done
header="${REAL_IP_HEADER:-X-Forwarded-For}"
case "$header" in
    ""|*[!A-Za-z0-9-]*) echo "real-ip : nom d'en-tête invalide dans REAL_IP_HEADER : $header" >&2; exit 1 ;;
esac
echo "real_ip_header $header;" >> "$OUT"
echo "real_ip_recursive on;" >> "$OUT"
echo "real-ip : en-tête ${REAL_IP_HEADER:-X-Forwarded-For} cru depuis : $proxies" >&2
