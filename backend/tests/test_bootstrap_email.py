"""L'email du premier admin doit passer la même validation que le login."""

import pytest

from scripts.bootstrap import BootstrapError, validate_admin_email


def test_un_email_accepte_par_le_login_est_accepte():
    assert validate_admin_email("admin@example.com") == "admin@example.com"


@pytest.mark.parametrize("email", ["admin@tunnel.test", "admin@usine.local", "pas-un-email"])
def test_un_email_refuse_par_le_login_bloque_l_installation(email):
    with pytest.raises(BootstrapError):
        validate_admin_email(email)
