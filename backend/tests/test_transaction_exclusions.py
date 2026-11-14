"""Exclusions de la transaction de requête (ADR 0018, AUDC-15) : contenu figé."""

from api import transaction


def test_exclusions_temporaires_figees():
    """Plus aucune exclusion provisoire (AUDC-25) ; toute entrée ajoutée est refusée."""
    assert transaction._TEMPORARY_EXCLUSIONS == frozenset()


def test_exclusions_permanentes_d_auth_inchangees():
    assert transaction._EXCLUDED_PATHS == frozenset(
        {"/auth/login", "/auth/refresh", "/auth/logout"}
    )
