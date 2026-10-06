#!/usr/bin/env sh
# Vérification unique du backend (ADR 0003) : format, lint, tests.
# Lancée par le hook pre-commit et par la CI. Ne touche jamais la base de dev.
set -e
cd "$(dirname "$0")/.."
VENV_BIN=".venv/bin"
"$VENV_BIN/ruff" format --check .
"$VENV_BIN/ruff" check .
"$VENV_BIN/pytest" -q
