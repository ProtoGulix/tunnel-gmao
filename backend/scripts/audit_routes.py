"""Inventaire des routes qui modifient, pour le chantier d'audit centralisé (ADR 0018).

Écrit docs/taches/AUDC-routes.md à partir des routes réellement montées dans
l'application : une route ajoutée apparaît d'elle-même. Le statut vient du mécanisme :
« déclarée » (api.audits.declaration), sinon l'entrée de api.audits.exclusions
(à traiter étape N, exclue avec sa raison), sinon « non classée » (le test de couverture échoue).

Usage : cd backend && .venv/bin/python -m scripts.audit_routes
"""

import sys
from pathlib import Path

from fastapi.routing import APIRoute

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from api.app import app  # noqa: E402
from api.audits.declaration import find_declaration  # noqa: E402
from api.audits.exclusions import EXCLUSIONS, TO_DO, step_for_path  # noqa: E402

OUTPUT = BACKEND.parent / "docs" / "taches" / "AUDC-routes.md"
MUTATING = ("POST", "PUT", "PATCH", "DELETE")


def mutating_routes():
    """(préfixe, méthode, chemin, fonction) de chaque route qui modifie, triés."""
    rows = []
    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue
        for method in sorted(set(route.methods) & set(MUTATING)):
            prefix = route.path.strip("/").split("/")[0]
            rows.append((prefix, method, route.path, route.endpoint.__name__, route))
    return sorted(rows, key=lambda r: (step_for_path(r[2]), r[0], r[2], r[1]))


def status(method, path, route) -> str:
    """Statut d'audit d'une route, tel que le voit le test de couverture."""
    declaration = find_declaration(route)
    if declaration:
        return f"déclarée ({declaration.entity_type})"
    exclusion = EXCLUSIONS.get((method, path))
    if exclusion is None:
        return "non classée"
    label = (
        f"{exclusion.category} étape {exclusion.step}"
        if exclusion.category == TO_DO
        else exclusion.category
    )
    return f"{label} : {exclusion.reason}" if exclusion.reason else label


def render(rows) -> str:
    lines = [
        "# AUDC : inventaire des routes qui modifient",
        "",
        "Généré par `backend/scripts/audit_routes.py` : ne pas éditer à la main, relancer le",
        "script. Plan et décisions : [AUDC-plan.md](AUDC-plan.md).",
        "",
        f"{len(rows)} routes.",
        "",
        "| Étape | Préfixe | Méthode | Chemin | Fonction | Statut |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for prefix, method, path, name, route in rows:
        step = step_for_path(path)
        lines.append(
            f"| {step} | {prefix} | {method} | `{path}` | {name} | {status(method, path, route)} |"
        )
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    routes = mutating_routes()
    OUTPUT.write_text(render(routes), encoding="utf-8")
    print(f"{OUTPUT} : {len(routes)} routes")
