#!/usr/bin/env sh
# Vérification unique du monorepo (ADR 0003) : backend (format, lint, tests),
# build des deux fronts, noms non définis des fronts, format du CHANGELOG. Lancée par le hook pre-commit et par la CI.
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
echo "== fronts (noms non définis)"
# Imports manquants que le build vite ne voit pas (backlog suites-audc-etape-2 point 8).
(cd "$ROOT/web" && npx --no-install eslint --no-config-lookup -c eslint.undef.config.mjs src)
(cd "$ROOT/mobile" && "$ROOT/web/node_modules/.bin/eslint" --no-config-lookup -c "$ROOT/web/eslint.undef.config.mjs" src)
echo "== changelog"
(cd "$ROOT/web" && node scripts/validate-changelog.cjs)
echo "== web (tests)"
(cd "$ROOT/web" && npm test --silent)
echo "check.sh : tout est vert"
