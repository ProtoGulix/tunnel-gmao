#!/usr/bin/env sh
# Vérification unique du monorepo (ADR 0003) : backend (format, lint, tests),
# puis build des deux fronts. Lancée par le hook pre-commit et par la CI.
# Les fronts sont construits l'un après l'autre : pas de charge parallèle sur la VM.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "== backend"
"$ROOT/backend/scripts/check.sh"

for front in web mobile; do
  echo "== $front (build)"
  if [ ! -d "$ROOT/$front/node_modules" ]; then
    echo "$front/node_modules absent : lancer 'npm ci' dans $front/ d'abord." >&2
    exit 1
  fi
  (cd "$ROOT/$front" && npm run --silent build >/dev/null)
done
echo "check.sh : tout est vert"
