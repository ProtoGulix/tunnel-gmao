"""Étape 3 de l'audit centralisé (AUDC-33, AUDC-34) : couverture des routes du catalogue et des achats.

Hors périmètre : part-templates (fonctionnalité abandonnée). Les familles de stock (identifiant
texte) sont tracées sous un uuid déterministe de leur code : test_audc34_stock_integration.
"""

import inspect
import re

import pytest
from fastapi.routing import APIRoute

from api.app import app
from api.audits.declaration import find_declaration
from api.manufacturer_items import repo as manufacturer_items_repo
from api.parts import repo as parts_repo
from api.preventive_plans import repo as preventive_plans_repo
from api.stock_item_suppliers import repo as stock_item_suppliers_repo
from api.stock_items import repo as stock_items_repo
from api.stock_items import stock_item_service
from api.stock_sub_families import repo as stock_sub_families_repo
from api.supplier_order_lines import repo as supplier_order_lines_repo
from api.suppliers import repo as suppliers_repo

ROUTES_AUDC_33 = [
    ("POST", "/preventive-plans"),
    ("PUT", "/preventive-plans/{plan_id}"),
    ("PATCH", "/preventive-plans/{plan_id}/steps"),
    ("DELETE", "/preventive-plans/{plan_id}"),
    ("POST", "/parts"),
    ("PATCH", "/parts/{part_id}"),
    ("POST", "/parts/{part_id}/manufacturer-refs"),
    ("PATCH", "/parts/manufacturer-refs/{mfr_ref_id}"),
    ("DELETE", "/parts/manufacturer-refs/{mfr_ref_id}"),
    ("POST", "/parts/manufacturer-refs/{mfr_ref_id}/set-preferred"),
    ("POST", "/parts/manufacturer-refs/{mfr_ref_id}/supplier-refs"),
    ("PATCH", "/parts/supplier-refs/{supplier_ref_id}"),
    ("DELETE", "/parts/supplier-refs/{supplier_ref_id}"),
    ("POST", "/parts/supplier-refs/{supplier_ref_id}/set-preferred"),
    ("POST", "/manufacturer-items"),
    ("PATCH", "/manufacturer-items/{item_id}"),
    ("DELETE", "/manufacturer-items/{item_id}"),
]

ROUTES_AUDC_34 = [
    ("POST", "/stock-items"),
    ("PUT", "/stock-items/{item_id}"),
    ("PATCH", "/stock-items/{item_id}/quantity"),
    ("DELETE", "/stock-items/{item_id}"),
    ("POST", "/stock-sub-families"),
    ("POST", "/stock-sub-families/{family_code}"),
    ("PATCH", "/stock-sub-families/{family_code}/{sub_family_code}"),
    ("POST", "/stock-item-suppliers"),
    ("PUT", "/stock-item-suppliers/{ref_id}"),
    ("DELETE", "/stock-item-suppliers/{ref_id}"),
    ("POST", "/stock-item-suppliers/{ref_id}/set-preferred"),
    ("POST", "/suppliers"),
    ("PUT", "/suppliers/{supplier_id}"),
    ("DELETE", "/suppliers/{supplier_id}"),
    ("POST", "/supplier-order-lines"),
    ("PUT", "/supplier-order-lines/{line_id}"),
    ("PATCH", "/supplier-order-lines/{line_id}"),
    ("DELETE", "/supplier-order-lines/{line_id}"),
    ("POST", "/supplier-order-lines/{line_id}/purchase-requests"),
    ("DELETE", "/supplier-order-lines/{line_id}/purchase-requests/{purchase_request_id}"),
]


def _route(method, path):
    return next(
        r for r in app.routes if isinstance(r, APIRoute) and r.path == path and method in r.methods
    )


def _params(routes):
    return [pytest.param(m, p, id=f"{m} {p}") for m, p in routes]


@pytest.mark.parametrize(("method", "path"), _params(ROUTES_AUDC_33) + _params(ROUTES_AUDC_34))
def test_routes_du_catalogue_et_des_achats_de_l_etape_3_sont_declarees(method, path):
    assert find_declaration(_route(method, path)) is not None, f"{method} {path}"


# Garde-fou : ces repos n'ont aujourd'hui ni SAVEPOINT ni rollback avalé (vérifié à l'écriture
# du test) ; le test empêche d'en introduire pendant la migration vers l'audit centralisé.
REPOS = [
    preventive_plans_repo,
    parts_repo,
    manufacturer_items_repo,
    stock_items_repo,
    stock_item_service,
    stock_sub_families_repo,
    stock_item_suppliers_repo,
    suppliers_repo,
    supplier_order_lines_repo,
]


@pytest.mark.parametrize("module", REPOS, ids=lambda m: m.__name__)
def test_aucun_savepoint(module):
    assert "SAVEPOINT" not in inspect.getsource(module).upper()


@pytest.mark.parametrize("module", REPOS, ids=lambda m: m.__name__)
def test_tout_rollback_est_suivi_d_un_raise(module):
    lignes = inspect.getsource(module).splitlines()
    for i, ligne in enumerate(lignes):
        if "rollback(" not in ligne:
            continue
        suite = [s.strip() for s in lignes[i + 1 : i + 4]]
        assert any(re.match(r"(raise|raise_db_error)\b", s) for s in suite), (
            f"{module.__name__}:{i + 1} rollback sans raise : {ligne.strip()}"
        )
