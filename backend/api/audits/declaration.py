"""Déclaration d'audit par route (ADR 0018, point 3).

Une route qui modifie déclare ce qu'elle audite dans son décorateur :

    @router.patch(
        "/{intervention_id}",
        dependencies=[audit("intervention", id_from_path="intervention_id", table="intervention")],
    )

ou, pour une création, l'identifiant est déposé par la route après l'insertion :

    @router.post("", dependencies=[audit("intervention", id_from_created=True)])
    def create(request: Request, ...):
        ...
        declare_created_id(request, new_id)

La déclaration est une dépendance FastAPI sans effet à l'exécution : elle sert de marqueur
lisible à côté de la route, et le middleware la retrouve avec `find_declaration`.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

from fastapi import Depends, Request
from fastapi.routing import APIRoute

# Attribut de request.state où la route dépose l'identifiant qu'elle vient de créer.
CREATED_ID_ATTR = "audit_created_id"


@dataclass(frozen=True)
class AuditDeclaration:
    """Ce qu'une route audite : entité, origine de l'identifiant, table de l'état avant/après."""

    entity_type: str
    id_from_path: Optional[str] = None
    id_from_created: bool = False
    table: Optional[str] = None
    # Route qui n'a aucune entité propre à tracer : seul le motif de l'entité est validé et les
    # événements déposés par le repo sont écrits (ex. journal de statut d'une intervention).
    events_only: bool = False

    def __post_init__(self) -> None:
        # Exactement une origine d'identifiant (aucune pour events_only), sinon ambigu.
        origins = int(bool(self.id_from_path)) + int(self.id_from_created)
        if origins != (0 if self.events_only else 1):
            raise ValueError(
                "audit() exige exactement une origine : id_from_path ou id_from_created=True "
                "(aucune avec events_only=True)"
            )

    def __call__(self) -> None:
        """Dépendance FastAPI sans effet : la déclaration ne sert qu'à être retrouvée."""
        return None


def audit(
    entity_type: str,
    *,
    id_from_path: Optional[str] = None,
    id_from_created: bool = False,
    table: Optional[str] = None,
    events_only: bool = False,
) -> Any:
    """Construit la dépendance à passer dans `dependencies=[...]` du décorateur de route."""
    return Depends(
        AuditDeclaration(
            entity_type=entity_type,
            id_from_path=id_from_path,
            id_from_created=id_from_created,
            table=table,
            events_only=events_only,
        )
    )


def declare_created_id(request: Request, created_id: Any) -> None:
    """À appeler par une route de création, une fois l'identifiant connu."""
    setattr(request.state, CREATED_ID_ATTR, created_id)


def find_declaration(route: APIRoute) -> Optional[AuditDeclaration]:
    """Retourne la déclaration d'audit d'une route, ou None si elle n'en a pas."""
    for dependency in route.dependencies:
        if isinstance(dependency.dependency, AuditDeclaration):
            return dependency.dependency
    return None
