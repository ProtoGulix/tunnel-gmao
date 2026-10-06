#!/usr/bin/env sh
# Hook PostToolUse : formate le fichier Python que Claude vient d'éditer (ADR 0003).
# Peu coûteux (ruff, un seul fichier) ; lint et tests restent dans scripts/check.sh.
file_path=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input', {}).get('file_path', ''))")
case "$file_path" in
  *.py)
    "$CLAUDE_PROJECT_DIR/backend/.venv/bin/ruff" format --quiet --config "$CLAUDE_PROJECT_DIR/backend/ruff.toml" "$file_path" >/dev/null 2>&1 || true
    ;;
esac
exit 0
