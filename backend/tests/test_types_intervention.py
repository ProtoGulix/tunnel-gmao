"""Types d'intervention lus en base (TYP-02, ADR 0026) : règles de validation et contrat."""

import pytest

from api.errors.exceptions import ValidationError
from api.interventions import types as types_module
from api.interventions.types import check_assignable, check_known

TYPES = [
    {"id": "CUR", "title": "Curatif", "color": "red", "description": "d", "is_active": True},
    {"id": "OLD", "title": "Ancien", "color": "gray", "description": None, "is_active": False},
]


@pytest.fixture(autouse=True)
def referentiel(monkeypatch):
    monkeypatch.setattr(
        types_module,
        "list_types",
        lambda include_inactive=False: [t for t in TYPES if include_inactive or t["is_active"]],
    )


def test_type_actif_accepte():
    check_assignable("CUR")


def test_type_inconnu_refuse_avec_les_valeurs_actives():
    with pytest.raises(ValidationError) as e:
        check_assignable("XYZ")
    assert "XYZ" in str(e.value.detail) and "CUR" in str(e.value.detail)
    assert "OLD" not in str(e.value.detail)


def test_type_inactif_refuse_pour_une_nouvelle_valeur():
    with pytest.raises(ValidationError) as e:
        check_assignable("OLD", current="CUR")
    assert "désactivé" in str(e.value.detail)


def test_type_inactif_accepte_s_il_est_inchange():
    check_assignable("OLD", current="OLD")


def test_filtre_accepte_un_type_inactif_et_refuse_un_inconnu():
    check_known(["CUR", "OLD"])
    with pytest.raises(ValidationError):
        check_known(["CUR", "XYZ"])
