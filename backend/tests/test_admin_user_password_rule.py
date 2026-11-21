"""ADM-01 : mot de passe fixé par l'administrateur et rôle d'une personne."""

import pytest
from pydantic import ValidationError

from api.admin.schemas import AdminUserCreate, AdminUserRolePatch

BASE = {"email": "a@b.fr", "initial": "AB", "role_code": "TECH"}


@pytest.mark.parametrize("faible", ["court1A", "sansmajuscule1", "SansChiffre"])
def test_mot_de_passe_faible_refuse(faible):
    with pytest.raises(ValidationError):
        AdminUserCreate(**BASE, password=faible)


def test_mot_de_passe_conforme_accepte():
    assert AdminUserCreate(**BASE, password="Demo2026x").password == "Demo2026x"


def test_role_machine_refuse_pour_une_personne():
    with pytest.raises(ValidationError):
        AdminUserCreate(**{**BASE, "role_code": "MCP"}, password="Demo2026x")
    with pytest.raises(ValidationError):
        AdminUserRolePatch(role_code="mcp")
    assert AdminUserRolePatch(role_code="ACHETEUR").role_code == "ACHETEUR"
