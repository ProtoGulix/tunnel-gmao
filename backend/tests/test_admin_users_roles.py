"""ADR 0005 : l'écriture sur les utilisateurs est réservée à ADMIN, RESP garde la lecture."""

import pytest

from api.admin import routes as admin_routes
from tests.helpers import make_client

UID = "22222222-2222-2222-2222-222222222222"

ECRITURES = [
    (
        "post",
        "/admin/users",
        {
            "email": "a@b.fr",
            "password": "MotDePasse-123",
            "first_name": "A",
            "last_name": "B",
            "initial": "AB",
            "role_code": "TECH",
        },
    ),
    ("put", f"/admin/users/{UID}", {"email": "a@b.fr", "first_name": "A", "last_name": "B"}),
    ("patch", f"/admin/users/{UID}/role", {"role_code": "ADMIN"}),
    ("patch", f"/admin/users/{UID}/active", {"is_active": False}),
    ("post", f"/admin/users/{UID}/reset-password", None),
    ("delete", f"/admin/users/{UID}", None),
]


class _FauxRepo:
    """Remplace AdminUserRepository : aucune base n'est touchée."""

    def get_all(self, **kwargs):
        return []

    def create(self, **kwargs):
        return {
            "id": UID,
            "email": "a@b.fr",
            "first_name": "A",
            "last_name": "B",
            "initial": "AB",
            "role_id": UID,
            "role_code": "TECH",
            "auth_provider": "local",
            "is_active": True,
            "provisioning": "manual",
            "created_at": "2026-10-06T10:00:00",
            "updated_at": "2026-10-06T10:00:00",
        }

    def update(self, **kwargs):
        return self.create()

    def set_role(self, *args):
        return None

    def set_active(self, *args):
        return None

    def reset_password(self, *args):
        return "temporaire"

    def soft_delete(self, *args):
        return None


@pytest.fixture(autouse=True)
def _faux_repo(monkeypatch):
    monkeypatch.setattr(admin_routes, "AdminUserRepository", _FauxRepo)


def _appel(client, methode, chemin, corps):
    envoi = getattr(client, methode)
    return envoi(chemin, json=corps) if corps else envoi(chemin)


@pytest.mark.parametrize("methode,chemin,corps", ECRITURES)
def test_resp_ne_peut_pas_ecrire_sur_les_utilisateurs(methode, chemin, corps):
    client = make_client(admin_routes.router, role="RESP")
    assert _appel(client, methode, chemin, corps).status_code == 403


@pytest.mark.parametrize("methode,chemin,corps", ECRITURES)
def test_admin_peut_ecrire_sur_les_utilisateurs(methode, chemin, corps):
    client = make_client(admin_routes.router, role="ADMIN")
    reponse = _appel(client, methode, chemin, corps)
    assert reponse.status_code in (200, 201), reponse.text


def test_resp_peut_toujours_lire_la_liste():
    client = make_client(admin_routes.router, role="RESP")
    assert client.get("/admin/users").status_code == 200
