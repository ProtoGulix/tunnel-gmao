"""Couverture de l'audit (ADR 0018, point 3) : aucune route qui modifie ne passe entre les mailles.

Chaque route POST, PUT, PATCH, DELETE est soit déclarée (api.audits.declaration.audit),
soit listée dans api.audits.exclusions avec sa catégorie et sa raison, jamais les deux.
"""

import pytest
from fastapi import APIRouter, FastAPI, Request
from fastapi.routing import APIRoute

from api.app import app
from api.audits.declaration import (
    CREATED_ID_ATTR,
    AuditDeclaration,
    audit,
    declare_created_id,
    find_declaration,
)
from api.audits.exclusions import EXCLUDED, EXCLUSIONS, NO_WRITE, TO_DO

MUTATING = {"POST", "PUT", "PATCH", "DELETE"}


def _mutating_routes():
    """{(méthode, chemin): route} pour toutes les routes de l'application réelle."""
    found = {}
    for route in app.routes:
        if isinstance(route, APIRoute):
            for method in route.methods & MUTATING:
                found[(method, route.path)] = route
    return found


def _label(keys):
    return "\n".join(f"  {m} {p}" for m, p in sorted(keys))


def test_toute_route_qui_modifie_est_declaree_ou_listee():
    routes = _mutating_routes()
    declared = {k for k, r in routes.items() if find_declaration(r)}
    listed = set(EXCLUSIONS)

    missing = set(routes) - declared - listed
    assert not missing, (
        "Routes qui modifient sans déclaration d'audit ni entrée dans api/audits/exclusions.py.\n"
        "Ajoutez audit(...) dans dependencies=[...] de la route, ou une exclusion motivée :\n"
        + _label(missing)
    )

    stale = listed - set(routes)
    assert not stale, (
        "Routes listées dans api/audits/exclusions.py qui n'existent plus : retirez-les.\n"
        + _label(stale)
    )

    both = declared & listed
    assert not both, (
        "Routes à la fois déclarées et listées : retirez-les de api/audits/exclusions.py.\n"
        + _label(both)
    )


def test_exclusions_bien_formees():
    for key, exclusion in EXCLUSIONS.items():
        assert exclusion.category in {TO_DO, EXCLUDED, NO_WRITE}, key
        if exclusion.category == TO_DO:
            assert exclusion.step in (2, 3, 4), f"étape manquante : {key}"
        else:
            assert exclusion.reason, (
                f"raison obligatoire pour une route {exclusion.category} : {key}"
            )


# --- Mécanisme de déclaration, sur une application de test (aucune route métier) ---


def _app_de_test():
    router = APIRouter()

    @router.patch(
        "/things/{thing_id}", dependencies=[audit("thing", id_from_path="thing_id", table="thing")]
    )
    def patch_thing(thing_id: str):
        return {}

    @router.post("/things", dependencies=[audit("thing", id_from_created=True)])
    def create_thing(request: Request):
        declare_created_id(request, "abc")
        return {"id": request.state.audit_created_id}

    @router.post("/other")
    def other():
        return {}

    test_app = FastAPI()
    test_app.include_router(router)
    return test_app


def _route(test_app, method, path):
    return next(
        r
        for r in test_app.routes
        if isinstance(r, APIRoute) and r.path == path and method in r.methods
    )


def test_declaration_retrouvee_depuis_la_route():
    test_app = _app_de_test()
    patch = find_declaration(_route(test_app, "PATCH", "/things/{thing_id}"))
    assert patch == AuditDeclaration("thing", id_from_path="thing_id", table="thing")
    create = find_declaration(_route(test_app, "POST", "/things"))
    assert create.id_from_created and create.table is None
    assert find_declaration(_route(test_app, "POST", "/other")) is None


def test_declaration_sans_effet_a_l_execution_et_identifiant_depose():
    from fastapi.testclient import TestClient

    client = TestClient(_app_de_test())
    assert client.patch("/things/1").status_code == 200
    created = client.post("/things")
    assert created.json() == {"id": "abc"}
    assert CREATED_ID_ATTR == "audit_created_id"


@pytest.mark.parametrize(
    "kwargs",
    [{}, {"id_from_path": "x", "id_from_created": True}],
)
def test_declaration_exige_une_seule_origine(kwargs):
    with pytest.raises(ValueError):
        AuditDeclaration("thing", **kwargs)
