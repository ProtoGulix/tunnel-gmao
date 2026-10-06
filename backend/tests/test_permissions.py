"""Dépendances d'authentification et de rôle."""

from types import SimpleNamespace

import pytest

from api.auth.permissions import require_authenticated, require_role
from api.errors.exceptions import ForbiddenError, UnauthorizedError


def _requete(user_id=None, role=None, api_key_id=None):
    return SimpleNamespace(state=SimpleNamespace(user_id=user_id, role=role, api_key_id=api_key_id))


def test_une_requete_anonyme_est_refusee():
    with pytest.raises(UnauthorizedError):
        require_authenticated(_requete())


def test_une_cle_api_compte_comme_authentifiee_sans_utilisateur():
    assert require_authenticated(_requete(role="MCP", api_key_id="cle-1")) is None


def test_un_role_autorise_passe():
    check = require_role("RESP", "ADMIN")
    assert check(_requete(user_id="u1", role="RESP")) == "u1"


def test_un_role_non_autorise_est_refuse():
    check = require_role("ADMIN")
    with pytest.raises(ForbiddenError):
        check(_requete(user_id="u1", role="TECH"))
