"""Génération préventive tout ou rien et événements du système (ADR 0018, AUDC-24).

Une erreur SQL pendant la génération annule tout (500) ; un conflit prévisible est
rapporté sans erreur. Chaque occurrence, demande et intervention créée par la génération
porte sa ligne `created` (is_system, SYSTEM_CASCADE, auteur = jeton).
"""

import secrets
from datetime import date

import pytest

from api.db import get_connection
from api.preventive_occurrences.repo import PreventiveOccurrenceRepository
from tests.integration.etape2_helpers import lignes_audit

pytestmark = pytest.mark.integration


@pytest.fixture
def nouveau_plan(instance):
    """Fabrique de plans ; ils sont désactivés à la fin pour ne pas polluer les autres tests."""
    crees = []

    def fabrique(n_machines=2, auto_accept=False):
        machines, plan = _classe_machines_plan(instance, n_machines, auto_accept)
        crees.append(plan)
        return machines, plan

    yield fabrique
    for plan in crees:
        instance.sql("UPDATE preventive_plan SET active = false WHERE id = %s", (plan,))


def _classe_machines_plan(instance, n_machines=2, auto_accept=False):
    """Classe isolée avec ses machines et un plan périodique (une étape de gamme)."""
    classe = instance.sql(
        "INSERT INTO equipement_class (code, label) VALUES (%s, 'Classe AUDC-24') RETURNING id",
        (f"CL-{secrets.token_hex(3)}",),
    )[0][0]
    machines = [
        instance.sql(
            "INSERT INTO machine (code, name, equipement_class_id) "
            "VALUES (%s, 'Machine AUDC-24', %s) RETURNING id",
            (f"M-{secrets.token_hex(3)}", classe),
        )[0][0]
        for _ in range(n_machines)
    ]
    plan = instance.sql(
        "INSERT INTO preventive_plan (code, label, equipement_class_id, trigger_type, "
        "periodicity_days, auto_accept) VALUES (%s, %s, %s, 'periodicity', 30, %s) RETURNING id",
        (f"PL-{secrets.token_hex(3)}", f"Plan AUDC-24 {secrets.token_hex(3)}", classe, auto_accept),
    )[0][0]
    instance.sql(
        "INSERT INTO preventive_plan_gamme_step (plan_id, label, sort_order) "
        "VALUES (%s, 'Étape', 1)",
        (plan,),
    )
    return machines, plan


def _compte(instance, plan):
    return instance.sql(
        "SELECT count(*), count(di_id), count(intervention_id) "
        "FROM preventive_occurrence WHERE plan_id = %s",
        (plan,),
    )[0]


def test_conflit_previsible_rapporte_sans_rollback_et_les_autres_sont_creees(
    instance, client, admin, nouveau_plan
):
    (en_conflit, saine), plan = nouveau_plan()
    instance.sql(
        "INSERT INTO preventive_occurrence (plan_id, machine_id, scheduled_date, status) "
        "VALUES (%s, %s, %s, 'cancelled')",
        (plan, en_conflit, date.today()),
    )

    resp = client.post("/preventive-occurrences/generate", headers=admin.headers)

    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["skipped_conflicts"] >= 1
    assert data["errors"] == []
    assert instance.sql(
        "SELECT status FROM preventive_occurrence WHERE plan_id = %s AND machine_id = %s",
        (plan, saine),
    ) == [("generated",)]


def test_erreur_sql_pendant_la_generation_annule_tout(
    instance, client, admin, monkeypatch, nouveau_plan
):
    (_m1, _m2), plan = nouveau_plan(auto_accept=True)
    original = PreventiveOccurrenceRepository._generate_for_machine
    appels = {"n": 0}

    def echoue_au_second(self, plan_row, machine_id, today):
        if str(plan_row["id"]) != str(plan):
            return original(self, plan_row, machine_id, today)
        appels["n"] += 1
        result = original(self, plan_row, machine_id, today)
        if appels["n"] == 2:
            cur = get_connection().cursor()
            cur.execute("SELECT 1/0")
        return result

    monkeypatch.setattr(PreventiveOccurrenceRepository, "_generate_for_machine", echoue_au_second)

    resp = client.post("/preventive-occurrences/generate", headers=admin.headers)

    assert resp.status_code == 500, resp.text
    assert appels["n"] == 2
    assert _compte(instance, plan) == (0, 0, 0)
    label = instance.sql("SELECT label FROM preventive_plan WHERE id = %s", (plan,))[0][0]
    assert not instance.sql("SELECT 1 FROM intervention_request WHERE description = %s", (label,))
    assert not instance.sql("SELECT 1 FROM intervention i WHERE i.plan_id = %s", (plan,))


def test_la_generation_ecrit_un_evenement_created_par_entite_creee(
    instance, client, admin, nouveau_plan
):
    (machine_id,), plan = nouveau_plan(n_machines=1, auto_accept=True)

    resp = client.post("/preventive-occurrences/generate", headers=admin.headers)

    assert resp.status_code == 200, resp.text
    occ_id, di_id, intervention_id = instance.sql(
        "SELECT id::text, di_id::text, intervention_id::text FROM preventive_occurrence "
        "WHERE plan_id = %s AND machine_id = %s",
        (plan, machine_id),
    )[0]
    assert intervention_id is not None
    for entite, entity_id in (
        ("preventive_occurrence", occ_id),
        ("request", di_id),
        ("intervention", intervention_id),
    ):
        lignes = [lg for lg in lignes_audit(instance, entity_id) if lg[1] == "created"]
        assert lignes == [(entite, "created", "SYSTEM_CASCADE", True, admin.id)], (entite, lignes)


def test_l_intervention_preventive_est_creee_en_priorite_normal(
    instance, client, admin, nouveau_plan
):
    """ADR 0039 : le préventif écrit `normal`, jamais l'ancienne valeur `normale`."""
    (machine_id,), plan = nouveau_plan(n_machines=1, auto_accept=True)

    resp = client.post("/preventive-occurrences/generate", headers=admin.headers)

    assert resp.status_code == 200, resp.text
    assert instance.sql(
        "SELECT i.priority FROM intervention i WHERE i.plan_id = %s AND i.machine_id = %s",
        (plan, machine_id),
    ) == [("normal",)]


# Ignorer une occurrence : motif choisi obligatoire (CONT-03), règle d'audit de la migration 0019.
def _occurrence_pending(instance, nouveau_plan):
    (machine_id,), plan = nouveau_plan(n_machines=1)
    return instance.sql(
        "INSERT INTO preventive_occurrence (plan_id, machine_id, scheduled_date, status) "
        "VALUES (%s, %s, %s, 'pending') RETURNING id::text",
        (plan, machine_id, date.today()),
    )[0][0]


def _etat(instance, occ_id):
    return instance.sql(
        "SELECT status, skip_reason FROM preventive_occurrence WHERE id = %s", (occ_id,)
    )


@pytest.mark.parametrize(
    "corps",
    [
        {},
        {"skip_reason": "Arrêt prévu"},
        {"reason_code": "MOTIF_INCONNU"},
        {"reason_code": "ROUTINE"},
        {"reason_code": "SYSTEM_CASCADE"},
        {"reason_code": "TASK_DUPLICATE"},
        {"reason_code": "DELETE_DUPLICATE"},
        {"reason_code": "OTHER"},
        {"reason_code": "OTHER", "reason_text": "  "},
    ],
)
def test_skip_refuse_sans_motif_valide(instance, client, admin, nouveau_plan, corps):
    occ_id = _occurrence_pending(instance, nouveau_plan)

    resp = client.patch(f"/preventive-occurrences/{occ_id}/skip", headers=admin.headers, json=corps)

    assert resp.status_code == 400, resp.text
    assert _etat(instance, occ_id) == [("pending", None)]
    assert lignes_audit(instance, occ_id) == []


def test_skip_sans_motif_renvoie_les_motifs_proposes(instance, client, admin, nouveau_plan):
    occ_id = _occurrence_pending(instance, nouveau_plan)

    resp = client.patch(f"/preventive-occurrences/{occ_id}/skip", headers=admin.headers, json={})

    # La fenêtre commune filtre sur la décision : seuls ces motifs portent occurrence_skipped.
    codes = {
        r["code"]
        for r in resp.json()["audit"]["reasons"]
        if "occurrence_skipped" in (r["decision_types"] or [])
    }
    assert codes == {
        "OCCURRENCE_MACHINE_DOWN",
        "OCCURRENCE_DONE_OFFLINE",
        "OCCURRENCE_PLAN_OBSOLETE",
        "OTHER",
    }
    assert resp.json()["audit"]["silent"] is False


def test_skip_est_audite_avec_le_motif_choisi(instance, client, admin, nouveau_plan):
    occ_id = _occurrence_pending(instance, nouveau_plan)

    resp = client.patch(
        f"/preventive-occurrences/{occ_id}/skip",
        headers=admin.headers,
        json={"reason_code": "OCCURRENCE_MACHINE_DOWN"},
    )

    assert resp.status_code == 200, resp.text
    lignes = lignes_audit(instance, occ_id)
    assert sorted(lg[1] for lg in lignes) == ["skip_reason_changed", "status_changed"], lignes
    assert {(lg[0], lg[2], lg[3], lg[4]) for lg in lignes} == {
        ("preventive_occurrence", "OCCURRENCE_MACHINE_DOWN", False, admin.id)
    }
    assert _etat(instance, occ_id) == [("skipped", "Machine arrêtée")]


def test_skip_autre_exige_un_texte_qui_devient_skip_reason(instance, client, admin, nouveau_plan):
    occ_id = _occurrence_pending(instance, nouveau_plan)

    resp = client.patch(
        f"/preventive-occurrences/{occ_id}/skip",
        headers=admin.headers,
        json={"reason_code": "OTHER", "reason_text": "Ligne démontée pour travaux"},
    )

    assert resp.status_code == 200, resp.text
    assert _etat(instance, occ_id) == [("skipped", "Ligne démontée pour travaux")]
    assert {lg[2] for lg in lignes_audit(instance, occ_id)} == {"OTHER"}
