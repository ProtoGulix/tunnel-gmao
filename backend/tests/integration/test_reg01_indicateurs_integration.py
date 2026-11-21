"""Indicateurs de règle et capacités dans l'API (ADR 0030, REG-01).

is_locked (intervention), can_delete (action, tâche), capabilities de /auth/me, et refus
de suppression d'une tâche qui n'est pas « todo »."""

import pytest

from tests.integration.etape2_helpers import MOTIF, intervention_liee, tache
from tests.integration.test_audc23_taches_actions_journal_integration import _action

pytestmark = pytest.mark.integration


def _data(resp):
    corps = resp.json()
    return corps.get("data", corps)


def _supprimer_tache(client, admin, task_id):
    return client.request(
        "DELETE",
        f"/intervention-tasks/{task_id}",
        headers=admin.headers,
        json={"reason_code": MOTIF},
    )


@pytest.fixture
def ouverte(client, admin, instance):
    return intervention_liee(client, admin, instance)[0]


def _fermer(instance, intervention_id):
    # Fermeture directe en base de test : le chemin API est couvert ailleurs
    instance.sql(
        "UPDATE intervention SET status_actual = 'ferme' WHERE id = %s", (intervention_id,)
    )


def test_is_locked_faux_puis_vrai_detail_et_liste(client, admin, instance, ouverte):
    assert (
        _data(client.get(f"/interventions/{ouverte}", headers=admin.headers))["is_locked"] is False
    )
    _fermer(instance, ouverte)
    assert (
        _data(client.get(f"/interventions/{ouverte}", headers=admin.headers))["is_locked"] is True
    )
    liste = client.get(
        "/interventions?include_printed=true&limit=1000&status=ferme", headers=admin.headers
    )
    items = {i["id"]: i for i in liste.json()["items"]}
    assert items[ouverte]["is_locked"] is True


def test_can_delete_action_vrai_puis_faux_si_intervention_fermee(client, admin, instance, ouverte):
    action_id = _action(client, admin, instance, ouverte)
    action = _data(client.get(f"/intervention-actions/{action_id}", headers=admin.headers))
    assert action["can_delete"] is True
    assert action["intervention"]["is_locked"] is False
    detail = _data(client.get(f"/interventions/{ouverte}", headers=admin.headers))
    assert [a["can_delete"] for a in detail["actions"]] == [True]

    _fermer(instance, ouverte)
    action = _data(client.get(f"/intervention-actions/{action_id}", headers=admin.headers))
    assert action["can_delete"] is False
    detail = _data(client.get(f"/interventions/{ouverte}", headers=admin.headers))
    assert [a["can_delete"] for a in detail["actions"]] == [False]
    assert all(t["can_delete"] is False for t in detail["tasks"])


def test_can_delete_tache_selon_statut_et_actions(client, admin, instance, ouverte):
    a_faire = tache(instance, ouverte, "À faire", "todo")
    faite = tache(instance, ouverte, "Faite", "done")
    avec_action = tache(instance, ouverte, "Avec action", "todo")
    _action(client, admin, instance, ouverte, tasks=[{"task_id": avec_action}])

    def indicateur(task_id):
        return _data(client.get(f"/intervention-tasks/{task_id}", headers=admin.headers))[
            "can_delete"
        ]

    assert indicateur(a_faire) is True
    assert indicateur(faite) is False
    # L'action a pu faire passer la tâche en cours ; dans tous les cas elle n'est plus supprimable
    assert indicateur(avec_action) is False
    detail = _data(client.get(f"/interventions/{ouverte}", headers=admin.headers))
    par_id = {t["id"]: t["can_delete"] for t in detail["tasks"]}
    assert par_id[a_faire] is True and par_id[faite] is False


def test_supprimer_une_tache_faite_sans_action_est_refuse(client, admin, instance, ouverte):
    faite = tache(instance, ouverte, "Faite", "done")
    resp = _supprimer_tache(client, admin, faite)
    assert resp.status_code == 400, resp.text
    assert instance.sql("SELECT 1 FROM intervention_task WHERE id = %s", (faite,))


def test_supprimer_une_tache_d_une_intervention_fermee_est_refuse(client, admin, instance, ouverte):
    a_faire = tache(instance, ouverte)
    _fermer(instance, ouverte)
    assert _supprimer_tache(client, admin, a_faire).status_code == 400
    assert instance.sql("SELECT 1 FROM intervention_task WHERE id = %s", (a_faire,))


@pytest.mark.parametrize("role,attendu", [("ADMIN", True), ("RESP", True), ("TECH", False)])
def test_capacites_de_me(client, admin, make_user, role, attendu):
    compte = admin if role == "ADMIN" else make_user(role)
    resp = client.get("/auth/me", headers=compte.headers)
    assert resp.status_code == 200, resp.text
    assert resp.json()["capabilities"] == {
        "skip_obligatory_step": attendu,
        "close_task_without_action": attendu,
    }
