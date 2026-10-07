"""Anti-flood du login : seules les tentatives ÉCHOUÉES comptent par IP.

Dans une usine, tous les postes sortent souvent par la même IP : compter les connexions
réussies bloquerait tout le monde après 20 connexions dans l'heure.
"""

import pytest

pytestmark = pytest.mark.integration


def _ip_vue_par_l_api(instance, client) -> str:
    """IP réellement enregistrée par l'API pour ce client de test (une tentative ratée)."""
    instance.sql("DELETE FROM auth_attempt")
    client.post("/auth/login", json={"email": "sonde@example.com", "password": "x"})
    ip = instance.sql("SELECT ip_address FROM auth_attempt LIMIT 1")[0][0]
    instance.sql("DELETE FROM auth_attempt")
    return ip


def test_des_connexions_reussies_ne_bloquent_pas_l_ip(instance, client, admin):
    ip = _ip_vue_par_l_api(instance, client)
    for _ in range(25):
        instance.sql(
            "INSERT INTO auth_attempt (email, ip_address, success) VALUES (%s, %s, true)",
            (admin.email, ip),
        )
    r = client.post("/auth/login", json={"email": admin.email, "password": admin.password})
    assert r.status_code == 200, r.text


def test_vingt_echecs_depuis_une_ip_bloquent_encore(instance, client, admin):
    ip = _ip_vue_par_l_api(instance, client)
    for i in range(20):
        instance.sql(
            "INSERT INTO auth_attempt (email, ip_address, success) VALUES (%s, %s, false)",
            (f"inconnu{i}@example.com", ip),
        )
    r = client.post("/auth/login", json={"email": admin.email, "password": admin.password})
    assert r.status_code == 429
    instance.sql("DELETE FROM auth_attempt")
