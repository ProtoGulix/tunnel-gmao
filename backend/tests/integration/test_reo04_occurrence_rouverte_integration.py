"""Rouvrir une intervention rouvre son occurrence préventive (amendement ADR 0028, REO-04)."""

import pytest

from tests.integration.test_casc03_evenements_des_cascades_integration import (  # noqa: F401
    SYSTEME,
    _evenements,
    _generer,
    plans,
)

pytestmark = pytest.mark.integration


def _put(client, admin, intervention_id, status, **extra):
    return client.put(
        f"/interventions/{intervention_id}",
        headers=admin.headers,
        json={"status_actual": status, **extra},
    )


def _statut_occurrence(instance, occ_id):
    return instance.sql("SELECT status FROM preventive_occurrence WHERE id = %s", (occ_id,))[0][0]


def test_rouvrir_repasse_l_occurrence_en_cours_et_trace(instance, client, admin, plans):  # noqa: F811 (fixture importée)
    occ_id, _, intervention_id, _ = _generer(instance, client, admin, plans, True)
    assert _put(client, admin, intervention_id, "ferme").status_code == 200
    assert _statut_occurrence(instance, occ_id) == "completed"

    resp = _put(client, admin, intervention_id, "ouvert", reason_code="INTERVENTION_REWORK")

    assert resp.status_code == 200, resp.text
    assert _statut_occurrence(instance, occ_id) == "in_progress"
    # Seul l'événement de la réouverture part de « completed » : la génération en dépose
    # un autre vers « in_progress », depuis « pending ».
    reouvertures = [
        lg
        for lg in _evenements(instance, occ_id, "status_changed")
        if (lg[2] or {}).get("status") == "completed"
        and (lg[3] or {}).get("status") == "in_progress"
    ]
    assert len(reouvertures) == 1, _evenements(instance, occ_id)
    assert reouvertures[0][4:] == (*SYSTEME, admin.id)


def test_reclore_termine_de_nouveau_l_occurrence(instance, client, admin, plans):  # noqa: F811 (fixture importée)
    occ_id, _, intervention_id, _ = _generer(instance, client, admin, plans, True)
    _put(client, admin, intervention_id, "ferme")
    _put(client, admin, intervention_id, "ouvert", reason_code="INTERVENTION_REWORK")

    assert _put(client, admin, intervention_id, "ferme").status_code == 200

    assert _statut_occurrence(instance, occ_id) == "completed"


def test_refus_de_reouverture_ne_touche_pas_l_occurrence(instance, client, admin, plans):  # noqa: F811 (fixture importée)
    occ_id, _, intervention_id, _ = _generer(instance, client, admin, plans, True)
    _put(client, admin, intervention_id, "ferme")

    assert _put(client, admin, intervention_id, "ouvert").status_code == 400

    assert _statut_occurrence(instance, occ_id) == "completed"


def test_repair_ne_reclot_pas_une_occurrence_rouverte(instance, client, admin, plans):  # noqa: F811 (fixture importée)
    occ_id, _, intervention_id, _ = _generer(instance, client, admin, plans, True)
    _put(client, admin, intervention_id, "ferme")
    _put(client, admin, intervention_id, "ouvert", reason_code="INTERVENTION_REWORK")

    assert client.post("/preventive-occurrences/repair", headers=admin.headers).status_code == 200

    assert _statut_occurrence(instance, occ_id) == "in_progress"
