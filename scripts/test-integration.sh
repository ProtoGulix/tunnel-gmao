#!/usr/bin/env sh
# Tests d'intégration du backend : vrais middlewares JWT et audit, vraie base.
# Lance un PostgreSQL jetable (Docker), exécute `pytest -m integration`, puis détruit
# le conteneur même en cas d'échec. Hors check.sh : lent et nécessite Docker.
# N'utilise jamais la base de dev : conteneur propre sur 127.0.0.1:55435.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME="tunnel-it-db"
PORT=55435
PASSWORD="$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')"

cleanup() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM
cleanup

docker run -d --rm --name "$NAME" \
  -e POSTGRES_USER=tunnel_owner -e POSTGRES_PASSWORD="$PASSWORD" -e POSTGRES_DB=postgres \
  -p 127.0.0.1:$PORT:5432 postgres:15 >/dev/null

echo "attente de PostgreSQL..."
# L'image démarre un serveur temporaire pour l'initialisation puis le redémarre :
# on exige une vraie connexion TCP, réussie deux fois de suite.
ok=0
i=0
while [ "$ok" -lt 2 ]; do
  if docker exec "$NAME" pg_isready -U tunnel_owner -d postgres -h 127.0.0.1 >/dev/null 2>&1; then
    ok=$((ok + 1))
  else
    ok=0
  fi
  i=$((i + 1))
  if [ "$i" -ge 90 ]; then
    echo "PostgreSQL ne répond pas après 90 s" >&2
    exit 1
  fi
  sleep 1
done

export TEST_DATABASE_URL_OWNER="postgresql://tunnel_owner:$PASSWORD@127.0.0.1:$PORT/postgres"
cd "$ROOT/backend"
.venv/bin/pytest -m integration "$@"
