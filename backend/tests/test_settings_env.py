"""Garde-fou de démarrage sur API_ENV (faute de frappe = refus de démarrer)."""

import os
import subprocess
import sys

import pytest

BASE_ENV = {
    "PATH": os.environ.get("PATH", ""),
    "JWT_SECRET_KEY": "cle-de-test-uniquement-pour-pytest-0123456789",
    "DATABASE_URL": "postgresql://test:test@127.0.0.1:1/inexistante",
}


def _import_settings(api_env: str) -> int:
    env = {**BASE_ENV, "API_ENV": api_env}
    return subprocess.run(
        [sys.executable, "-c", "import api.settings"], env=env, capture_output=True
    ).returncode


def test_api_env_inconnu_refuse_de_demarrer():
    assert _import_settings("devellopment") == 1


@pytest.mark.parametrize("value", ["test", "development", "production"])
def test_api_env_valides_demarrent(value):
    assert _import_settings(value) == 0
