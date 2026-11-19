"""Liste des notifications : pagination stable quand plusieurs notifications partagent la
même date de création (passage de la tâche quotidienne, une seule transaction)."""

import secrets
from datetime import date, timedelta

import pytest

from api.notifications.repo import NotificationRepository

pytestmark = pytest.mark.integration


def test_pagination_sans_doublon_ni_manque_a_date_egale(instance, client, make_user):
    user = make_user("TECH")
    # Une seule instruction, donc un seul now() : toutes les lignes ont la même created_at.
    # Volume d'un passage réel (57 en dev) : le tri par tas de LIMIT n'est pas stable.
    instance.sql(
        "INSERT INTO notification (user_id, type, entity_type, entity_id, message) "
        "SELECT %s, 'intervention_a_cloturer', 'intervention', gen_random_uuid(), 'n' || g "
        "FROM generate_series(1, 60) g",
        (user.id,),
    )
    vus = []
    for skip in range(0, 60, 20):
        page = client.get(f"/notifications?limit=20&skip={skip}", headers=user.headers)
        assert page.status_code == 200
        vus += [n["id"] for n in page.json()["items"]]
    assert len(vus) == 60
    assert len(set(vus)) == 60


def _notif(instance, user_id, lue=False):
    """Insère une notification (lue ou non) et retourne son id."""
    return str(
        instance.sql(
            "INSERT INTO notification (user_id, type, entity_type, entity_id, message, read_at) "
            "VALUES (%s, 'intervention_a_cloturer', 'intervention', gen_random_uuid(), 'n', "
            "CASE WHEN %s THEN now() END) RETURNING id",
            (user_id, lue),
        )[0][0]
    )


def _etat(client, user):
    liste = client.get("/notifications", headers=user.headers).json()
    count = client.get("/notifications/unread-count", headers=user.headers).json()
    return liste, count


def test_masquer_une_notification_la_retire_de_la_liste_du_total_et_du_compteur(
    instance, client, make_user
):
    user = make_user("TECH")
    a, b = _notif(instance, user.id), _notif(instance, user.id)
    r = client.delete(f"/notifications/{a}", headers=user.headers)
    assert r.status_code == 200
    assert r.json() == {"dismissed": 1}
    liste, count = _etat(client, user)
    assert [n["id"] for n in liste["items"]] == [b]
    assert liste["pagination"]["total"] == 1
    assert count["count"] == 1
    # La ligne reste en base, marquée.
    assert instance.sql("SELECT dismissed_at FROM notification WHERE id = %s", (a,))[0][0]
    # Déjà masquée : 404.
    assert client.delete(f"/notifications/{a}", headers=user.headers).status_code == 404


def test_impossible_de_masquer_la_notification_d_un_autre(instance, client, make_user):
    proprietaire, intrus = make_user("TECH"), make_user("TECH")
    n = _notif(instance, proprietaire.id)
    assert client.delete(f"/notifications/{n}", headers=intrus.headers).status_code == 404
    assert instance.sql("SELECT dismissed_at FROM notification WHERE id = %s", (n,))[0][0] is None


def test_masquer_une_notification_inconnue_donne_404(client, make_user):
    user = make_user("TECH")
    inconnue = "00000000-0000-0000-0000-000000000000"
    r = client.delete(f"/notifications/{inconnue}", headers=user.headers)
    assert r.status_code == 404


def test_masquer_les_lues_garde_les_non_lues_puis_tout_masquer(instance, client, make_user):
    user, autre = make_user("TECH"), make_user("TECH")
    lue, non_lue = _notif(instance, user.id, lue=True), _notif(instance, user.id)
    de_l_autre = _notif(instance, autre.id, lue=True)
    r = client.delete("/notifications?only_read=true", headers=user.headers)
    assert r.json() == {"dismissed": 1}
    liste, _ = _etat(client, user)
    assert [n["id"] for n in liste["items"]] == [non_lue]
    assert lue not in [n["id"] for n in liste["items"]]
    # Sans paramètre : tout, et seulement les siennes.
    assert client.delete("/notifications", headers=user.headers).json() == {"dismissed": 1}
    assert _etat(client, user)[0]["items"] == []
    assert (
        instance.sql("SELECT dismissed_at FROM notification WHERE id = %s", (de_l_autre,))[0][0]
        is None
    )


def test_cle_mcp_ne_peut_pas_masquer(client, admin):
    r = client.post("/api-keys", headers=admin.headers, json={"name": f"it-{secrets.token_hex(3)}"})
    assert r.status_code == 201, r.text
    cle = {"X-API-Key": r.json()["secret"]}
    # Route personnelle : la clé n'a pas d'utilisateur, la route la refuse (401, comme read-all).
    assert client.delete("/notifications", headers=cle).status_code == 401


def test_palier_masque_par_tous_n_est_pas_reemis(instance, client, make_user):
    make_user("TECH")
    repo = NotificationRepository()
    entite = str(instance.sql("SELECT gen_random_uuid()")[0][0])
    args = ("preventif_echeance", "intervention", entite, "relance", date(2026, 11, 18))
    crees = repo.notify_active_users_once(*args)
    assert crees >= 1
    instance.sql("UPDATE notification SET dismissed_at = now() WHERE entity_id = %s", (entite,))
    assert repo.notify_active_users_once(*args) == 0


def test_marquer_lue_une_notification_masquee_donne_404(instance, client, make_user):
    user = make_user("TECH")
    n = _notif(instance, user.id)
    assert client.delete(f"/notifications/{n}", headers=user.headers).status_code == 200
    assert client.patch(f"/notifications/{n}/read", headers=user.headers).status_code == 404
    assert instance.sql("SELECT read_at FROM notification WHERE id = %s", (n,))[0][0] is None


def test_ancienne_notification_sans_jour_d_envoi_datee_par_sa_creation(instance, make_user):
    # Ligne d'avant la 5.9.1 : pas de `sent_on`, la période sans relance lit created_at.
    make_user("TECH")
    repo = NotificationRepository()
    entite = str(instance.sql("SELECT gen_random_uuid()")[0][0])
    instance.sql(
        "INSERT INTO notification (user_id, type, entity_type, entity_id, message, data) "
        "SELECT id, 'preventif_echeance', 'preventive_occurrence', %s, 'ancienne', "
        "'{\"milestone\": \"2026-11-12\"}'::jsonb FROM tunnel_user WHERE is_active LIMIT 1",
        (entite,),
    )
    today = instance.sql("SELECT current_date")[0][0]
    args = ("preventif_echeance", "preventive_occurrence", entite, "relance", today)
    assert repo.notify_active_users_once(*args, quiet_since=today - timedelta(6)) == 0
    assert repo.notify_active_users_once(*args, quiet_since=today + timedelta(1)) >= 1
