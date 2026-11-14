"""Le repo des occurrences préventives n'avale aucun échec (ADR 0018, 1 bis, 1 quater, AUDC-24)."""

import inspect

from api.preventive_occurrences import repo


def test_aucun_rollback_ni_savepoint_dans_le_repo_des_occurrences():
    source = inspect.getsource(repo)
    assert "rollback(" not in source
    assert "SAVEPOINT" not in source.upper()
