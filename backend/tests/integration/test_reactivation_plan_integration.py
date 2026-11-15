"""Réactivation d'un plan préventif : changement routinier, sans motif, tracé `active_changed`.

La désactivation (DELETE, soft delete) exige un motif de suppression ; la réactivation est
routinière (décision 8 de docs/taches/AUDC-plan.md) : la règle preventive_plan de la
migration 0010 suffit, le middleware injecte ROUTINE.
"""

import secrets

import pytest

from tests.integration.etape2_helpers import lignes_audit

pytestmark = pytest.mark.integration


@pytest.fixture
def plan_inactif(instance):
    classe = instance.sql(
        "INSERT INTO equipement_class (code, label) VALUES (%s, 'Classe réactivation') "
        "RETURNING id",
        (f"CR-{secrets.token_hex(3)}",),
    )[0][0]
    return instance.sql(
        "INSERT INTO preventive_plan (code, label, equipement_class_id, trigger_type, "
        "periodicity_days, active) VALUES (%s, 'Plan inactif', %s, 'periodicity', 30, false) "
        "RETURNING id::text",
        (f"PR-{secrets.token_hex(3)}", classe),
    )[0][0]


def _actif(instance, plan):
    return instance.sql("SELECT active FROM preventive_plan WHERE id = %s", (plan,))[0][0]


def test_reactivation_sans_motif_tracee_en_routine(instance, client, admin, plan_inactif):
    resp = client.post(f"/preventive-plans/{plan_inactif}/reactivate", headers=admin.headers)

    assert resp.status_code == 200, resp.text
    assert resp.json()["data"]["active"] is True
    assert _actif(instance, plan_inactif) is True
    assert lignes_audit(instance, plan_inactif) == [
        ("preventive_plan", "active_changed", "ROUTINE", False, admin.id)
    ]


def test_reactiver_un_plan_actif_n_ecrit_rien(instance, client, admin, plan_inactif):
    instance.sql("UPDATE preventive_plan SET active = true WHERE id = %s", (plan_inactif,))

    resp = client.post(f"/preventive-plans/{plan_inactif}/reactivate", headers=admin.headers)

    assert resp.status_code == 200, resp.text
    assert lignes_audit(instance, plan_inactif) == []


def test_reactiver_un_plan_inconnu_repond_404(client, admin):
    resp = client.post(
        "/preventive-plans/00000000-0000-0000-0000-000000000000/reactivate",
        headers=admin.headers,
    )
    assert resp.status_code == 404, resp.text


def test_reactivation_refusee_au_technicien(instance, client, make_user, plan_inactif):
    tech = make_user("TECH")

    resp = client.post(f"/preventive-plans/{plan_inactif}/reactivate", headers=tech.headers)

    assert resp.status_code == 403, resp.text
    assert _actif(instance, plan_inactif) is False


def test_reactivation_ouverte_au_responsable(instance, client, make_user, plan_inactif):
    resp_user = make_user("RESP")

    resp = client.post(f"/preventive-plans/{plan_inactif}/reactivate", headers=resp_user.headers)

    assert resp.status_code == 200, resp.text
    assert _actif(instance, plan_inactif) is True
