"""Exclusions de la transaction de requête (ADR 0018, AUDC-15) : contenu figé."""

from api import transaction


def test_exclusions_temporaires_figees():
    """Seules generate et import sont exclues provisoirement ; toute autre entrée est refusée."""
    assert transaction._TEMPORARY_EXCLUSIONS == frozenset(
        {
            ("POST", "/preventive-occurrences/generate"),
            ("POST", "/purchase-requests/import"),
        }
    )


def test_exclusions_permanentes_d_auth_inchangees():
    assert transaction._EXCLUDED_PATHS == frozenset(
        {"/auth/login", "/auth/refresh", "/auth/logout"}
    )
