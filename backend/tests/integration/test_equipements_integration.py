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


# --- Intégrité de l'arbre (ADR 0011, décisions 2.2 et 3.4) -----------------------------


def _creer(client, admin, name, parent_id=None):
    body = {"name": name}
    if parent_id:
        body["parent_id"] = parent_id
    r = client.post("/equipements", json=body, headers=admin.headers)
    assert r.status_code in (200, 201), r.text
    return r.json().get("data", r.json())["id"]


def _chaine(client, admin, longueur):
    ids = []
    for i in range(longueur):
        ids.append(_creer(client, admin, f"niv{i + 1}", ids[-1] if ids else None))
    return ids


def test_arbre_profondeur_4_acceptee_5_refusee(client, admin):
    ids = _chaine(client, admin, 4)
    r = client.post(
        "/equipements", json={"name": "niv5", "parent_id": ids[-1]}, headers=admin.headers
    )
    assert r.status_code == 400
    assert "4 niveaux" in r.text


def test_arbre_refuse_auto_rattachement_cycle_et_parent_inexistant(client, admin):
    a, b, c = _chaine(client, admin, 3)
    for cible, parent in ((a, a), (a, c)):
        r = client.patch(f"/equipements/{cible}", json={"parent_id": parent}, headers=admin.headers)
        assert r.status_code == 400, r.text
    r = client.patch(
        f"/equipements/{b}",
        json={"parent_id": "00000000-0000-0000-0000-000000000000"},
        headers=admin.headers,
    )
    assert r.status_code == 400
    assert "n'existe pas" in r.text


def test_arbre_deplacer_un_sous_arbre_compte_sa_hauteur(client, admin):
    racine = _creer(client, admin, "autre racine")
    ids = _chaine(client, admin, 3)  # a > b > c
    sous = _creer(client, admin, "sous", racine)  # racine > sous (niveau 2)
    r = client.patch(f"/equipements/{ids[0]}", json={"parent_id": sous}, headers=admin.headers)
    assert r.status_code == 400  # racine > sous > a > b > c = 5 niveaux
    r = client.patch(f"/equipements/{ids[1]}", json={"parent_id": sous}, headers=admin.headers)
    assert r.status_code == 200, r.text  # racine > sous > b > c = 4 niveaux


def test_arbre_children_ids_memes_controles(client, admin):
    a, b, _ = _chaine(client, admin, 3)
    r = client.patch(f"/equipements/{b}", json={"children_ids": [a]}, headers=admin.headers)
    assert r.status_code == 400  # a est un ancêtre de b : cycle
    r = client.patch(f"/equipements/{a}", json={"children_ids": [a]}, headers=admin.headers)
    assert r.status_code == 400
    r = client.post(
        "/equipements",
        json={"name": "x", "children_ids": ["00000000-0000-0000-0000-000000000000"]},
        headers=admin.headers,
    )
    assert r.status_code == 400


def test_arbre_suppression_refusee_avec_des_filles(client, admin):
    parent, fille, _ = _chaine(client, admin, 3)
    assert client.delete(f"/equipements/{parent}", headers=admin.headers).status_code == 400
    feuille = _creer(client, admin, "feuille", fille)
    assert client.delete(f"/equipements/{feuille}", headers=admin.headers).status_code == 204
