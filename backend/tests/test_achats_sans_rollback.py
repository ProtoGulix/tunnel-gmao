"""Les repos achats, commandes et équipements n'avalent aucun échec (ADR 0018, 1 bis, 1 quater, AUDC-25).

Un `rollback()` n'est admis que suivi d'un `raise` (la requête échoue de toute façon) ; un
point de reprise SAVEPOINT ne l'est jamais.
"""

import inspect
import re

import pytest

from api.equipements import repo as equipements_repo
from api.purchase_requests import repo as purchase_requests_repo
from api.supplier_orders import repo as supplier_orders_repo

REPOS = [purchase_requests_repo, supplier_orders_repo, equipements_repo]


@pytest.mark.parametrize("module", REPOS, ids=lambda m: m.__name__)
def test_aucun_savepoint(module):
    assert "SAVEPOINT" not in inspect.getsource(module).upper()


@pytest.mark.parametrize("module", REPOS, ids=lambda m: m.__name__)
def test_tout_rollback_est_suivi_d_un_raise(module):
    lignes = inspect.getsource(module).splitlines()
    for i, ligne in enumerate(lignes):
        if "rollback(" not in ligne:
            continue
        # Un raise (ou raise_db_error) doit suivre dans les lignes proches (journal admis entre).
        suite = [s.strip() for s in lignes[i + 1 : i + 4]]
        assert any(re.match(r"(raise|raise_db_error)\b", s) for s in suite), (
            f"{module.__name__}:{i + 1} rollback sans raise : {ligne.strip()}"
        )
