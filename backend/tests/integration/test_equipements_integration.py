"""Création d'équipement sur une installation neuve (aucune classe d'équipement)."""

import pytest

pytestmark = pytest.mark.integration


def test_creer_un_equipement_sans_code_ni_statut(client, admin):
    """Le front web n'envoie pas de code quand aucune classe n'existe : l'API le calcule."""
    premier = client.post("/equipements", json={"name": "Compresseur"}, headers=admin.headers)
    second = client.post("/equipements", json={"name": "Tour"}, headers=admin.headers)

    assert premier.status_code in (200, 201), premier.text
    assert second.status_code in (200, 201), second.text
    codes = [r.json().get("data", r.json())["code"] for r in (premier, second)]
    assert codes[0].startswith("EQ") and codes[1].startswith("EQ")
    assert int(codes[1][2:]) == int(codes[0][2:]) + 1
