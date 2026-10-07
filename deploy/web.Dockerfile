# Image du proxy web (ADR 0002, 0006) : construit le front web et le front mobile,
# puis les sert avec nginx. Contexte de build : racine du dépôt.
#   docker build -f deploy/web.Dockerfile .
# Les étapes de build sont séquentielles (web puis mobile), pas de charge parallèle.

FROM node:24-slim AS web-build
WORKDIR /src/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
# « Nouveautés » : le script de build copie le CHANGELOG racine (source unique).
COPY CHANGELOG.md /src/CHANGELOG.md
# Même origine que le front : l'API est atteinte en relatif sous /api.
ENV VITE_API_URL=/api
RUN npm run build

FROM node:24-slim AS mobile-build
WORKDIR /src/mobile
COPY mobile/package.json mobile/package-lock.json ./
RUN npm ci
COPY mobile/ ./
# Mobile servi sous /m/ (base Vite et basename du routeur), API en relatif.
ENV VITE_BASE_PATH=/m/ VITE_API_URL=/api
RUN npm run build

# Image nginx officielle « unprivileged » : processus non root (uid 101), écoute
# sur 8080, et mécanisme d'envsubst des templates conservé.
FROM nginxinc/nginx-unprivileged:1.28-alpine
COPY --from=web-build /src/web/dist /usr/share/nginx/html
COPY --from=mobile-build /src/mobile/dist /usr/share/nginx/html/m
COPY deploy/nginx/tunnel.conf.template /etc/nginx/templates/default.conf.template
COPY --chmod=755 deploy/nginx/15-real-ip.sh /docker-entrypoint.d/15-real-ip.sh

# Réglages modifiables au démarrage (voir deploy/.env.example).
ENV API_UPSTREAM=http://api:8000 \
    DNS_RESOLVER=127.0.0.11 \
    CLIENT_MAX_BODY_SIZE=20m \
    REAL_IP_HEADER=X-Forwarded-For \
    TRUSTED_PROXIES=""

EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
    CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8080/nginx-health"]
