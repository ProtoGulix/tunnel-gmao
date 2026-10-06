"""Neutralisation des formules dans les exports CSV (CLAUDE.md section 6, règle 9)."""

import asyncio

import pytest

from api.supplier_orders import routes as so_routes
from api.utils.csv_safety import neutralize_csv_cell, neutralize_csv_row


@pytest.mark.parametrize("prefix", ["=", "+", "-", "@", "\t", "\r"])
def test_un_texte_commencant_par_un_declencheur_est_prefixe(prefix):
    assert neutralize_csv_cell(f"{prefix}1+1") == f"'{prefix}1+1"


def test_une_formule_classique_est_neutralisee():
    assert neutralize_csv_cell('=HYPERLINK("http://x")') == "'=HYPERLINK(\"http://x\")"


def test_un_texte_normal_est_inchange():
    assert neutralize_csv_cell("Roulement 6204") == "Roulement 6204"
    assert neutralize_csv_cell("") == ""


def test_les_nombres_restent_des_nombres():
    assert neutralize_csv_cell(-5) == -5
    assert neutralize_csv_cell(3.5) == 3.5
    assert neutralize_csv_cell(0) == 0


def test_none_devient_vide():
    assert neutralize_csv_cell(None) == ""


def test_neutralize_csv_row_traite_chaque_cellule():
    assert neutralize_csv_row(["=A1", 2, None, "ok"]) == ["'=A1", 2, "", "ok"]


def test_lexport_csv_des_commandes_neutralise_les_cellules(monkeypatch):
    class FakeRepo:
        def get_export_data(self, order_id):
            return {
                "order_number": "CMD-1",
                "lines": [{"stock_item": {"name": "=cmd|' /C calc'!A0", "ref": "@x"}}],
            }

    monkeypatch.setattr(so_routes, "SupplierOrderRepository", FakeRepo)
    response = so_routes.export_supplier_order_csv("id-1")

    async def collect():
        return "".join([chunk async for chunk in response.body_iterator])

    body = asyncio.run(collect())
    lines = body.splitlines()
    assert lines[1].startswith("'=cmd|")
    assert ";'@x;" in lines[1]
