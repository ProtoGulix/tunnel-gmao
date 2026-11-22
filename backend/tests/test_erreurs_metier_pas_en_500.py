"""Une erreur métier levée dans un `try / except Exception` n'est pas transformée en 500.

Tests au niveau repo, sans base : connexion et curseur simulés. Les cas directs (rôle
inconnu, occurrence ou plan absent) dépendent de `raise_db_error` (ERR-01) ; les cas
indirects de stock_items, suppliers et supplier_orders, du passage des repo par
`raise_db_error` (ERR-02).
"""

from unittest.mock import MagicMock

import pytest

from api.admin.repo import AdminUserRepository
from api.errors.exceptions import ConflictError, DatabaseError, NotFoundError, ValidationError
from api.parts.repo import PartRepository
from api.preventive_occurrences.repo import PreventiveOccurrenceRepository
from api.preventive_plans.repo import PreventivePlanRepository
from api.stock_families.repo import StockFamilyRepository
from api.stock_items.repo import StockItemRepository
from api.supplier_orders.repo import SupplierOrderRepository
from api.suppliers.repo import SupplierRepository


@pytest.fixture
def cursor(monkeypatch):
    """Curseur simulé : fetchone() ne trouve rien ; la connexion est partagée par tous les repos."""
    cur = MagicMock(name="cursor")
    cur.fetchone.return_value = None
    conn = MagicMock(name="connection")
    conn.cursor.return_value = cur
    cur.__enter__.return_value = cur
    conn.cursor.return_value.__enter__.return_value = cur
    for module in (
        "api.admin.repo",
        "api.parts.repo",
        "api.preventive_occurrences.repo",
        "api.preventive_plans.repo",
        "api.stock_families.repo",
        "api.stock_items.repo",
        "api.supplier_orders.repo",
        "api.suppliers.repo",
    ):
        monkeypatch.setattr(f"{module}.get_connection", lambda conn=conn: conn)
        monkeypatch.setattr(f"{module}.release_connection", lambda c: None)
    return cur


def _leve(appel):
    with pytest.raises(Exception) as exc:
        appel()
    assert not isinstance(exc.value, DatabaseError), "erreur métier devenue une 500"
    return exc.value


# ── Cas directs : l'erreur métier est levée dans le try ──────────────


def test_creation_utilisateur_role_inconnu_est_404(cursor):
    err = _leve(lambda: AdminUserRepository().create("a@b.c", "mdp", None, None, "AB", "ZZZ"))
    assert err.status_code == 404


def test_changement_de_role_inconnu_est_404(cursor):
    err = _leve(lambda: AdminUserRepository().set_role("uid", "ZZZ", "admin-id"))
    assert err.status_code == 404


def test_occurrence_preventive_absente_est_404(cursor):
    err = _leve(lambda: PreventiveOccurrenceRepository().get_by_id("absente"))
    assert err.status_code == 404


def test_plan_preventif_absent_est_404(cursor):
    err = _leve(lambda: PreventivePlanRepository().get_by_id("absent"))
    assert err.status_code == 404


# ── Cas indirects : une méthode appelée dans le try lève une erreur métier ──


def _introuvable_apres_ecriture(repo):
    """get_by_id réussit avant le try (existence) puis lève NotFoundError dans le try."""
    appels = iter([{}])

    def get_by_id(*_a, **_k):
        try:
            return next(appels)
        except StopIteration:
            raise NotFoundError("disparu") from None

    repo.get_by_id = get_by_id
    return repo


def test_creation_piece_relue_introuvable_est_404(cursor):
    repo = PartRepository()
    repo.get_by_id = MagicMock(side_effect=NotFoundError("Pièce absente"))
    data = {"family_code": "F", "sub_family_code": "S"}
    cursor.fetchone.return_value = ("pid",)
    assert _leve(lambda: repo.create(data)).status_code == 404


def test_modification_utilisateur_relu_introuvable_est_404(cursor):
    repo = AdminUserRepository()
    repo.get_by_id = MagicMock(side_effect=NotFoundError("Utilisateur absent"))
    assert _leve(lambda: repo.update("uid", None, "X", None, None)).status_code == 404


def test_creation_article_stock_relu_introuvable_est_404(cursor):
    repo = StockItemRepository()
    repo.get_by_id = MagicMock(side_effect=NotFoundError("Article absent"))
    data = {"name": "n", "family_code": "F", "sub_family_code": "S", "dimension": "d"}
    assert _leve(lambda: repo.add(data)).status_code == 404


def test_modification_fournisseur_relu_introuvable_est_404(cursor):
    repo = _introuvable_apres_ecriture(SupplierRepository())
    assert _leve(lambda: repo.update("sid", {})).status_code == 404


def test_modification_commande_relue_introuvable_est_404(cursor):
    repo = _introuvable_apres_ecriture(SupplierOrderRepository())
    assert _leve(lambda: repo.update("oid", {})).status_code == 404


def test_creation_famille_stock_en_double_est_400(cursor):
    cursor.fetchone.return_value = (1,)
    data = MagicMock(code="F1", label="Famille")
    err = _leve(lambda: StockFamilyRepository().create(data))
    assert isinstance(err, ValidationError) and err.status_code == 400


def test_raise_db_error_relance_une_erreur_de_conflit():
    from api.errors.exceptions import raise_db_error

    with pytest.raises(ConflictError):
        raise_db_error(ConflictError("déjà là"), "x")
