"""Garde des cascades : chacune dépose son événement du système (CASC-03, ADR 0029).

Chaque test déclenche une cascade par l'API réelle et vérifie la ligne d'audit sur l'entité
modifiée : is_system, motif SYSTEM_CASCADE, auteur = utilisateur du jeton. Un chemin qui
écrit sans événement fait échouer son test.
"""

import secrets

import pytest

from tests.integration.etape2_helpers import MOTIF, intervention_liee, tache
from tests.integration.test_audc24_preventif_integration import _classe_machines_plan
from tests.integration.test_audc25_achats_integration import (
    _demande_a_repartir,
    _fournisseur,
    _piece,
    famille,  # noqa: F401
)

pytestmark = pytest.mark.integration

SYSTEME = ("SYSTEM_CASCADE", True)


def _evenements(instance, entity_id, decision=None):
    """(entity_type, decision_type, ancien, nouveau, motif, is_system, auteur) d'une entité."""
    lignes = instance.sql(
        "SELECT l.entity_type, l.decision_type, l.old_value, l.new_value, r.code, "
        "l.is_system, l.changed_by::text FROM audit_log l "
        "JOIN audit_reason_code r ON r.id = l.reason_code_id "
        "WHERE l.entity_id = %s ORDER BY l.logged_at",
        (entity_id,),
    )
    return [lg for lg in lignes if decision is None or lg[1] == decision]


def _un_evenement_systeme(instance, admin, entity_id, decision, **nouveau):
    """Vérifie qu'un événement `decision` du système existe, au nom de admin, avec ces champs."""
    trouves = [
        lg
        for lg in _evenements(instance, entity_id, decision)
        if (lg[4], lg[5], lg[6]) == (*SYSTEME, admin.id)
        and all((lg[3] or {}).get(k) == v for k, v in nouveau.items())
    ]
    assert trouves, (decision, nouveau, _evenements(instance, entity_id))
    return trouves[0]


@pytest.fixture
def plans(instance):
    crees = []

    def fabrique(auto_accept):
        (machine_id,), plan = _classe_machines_plan(instance, 1, auto_accept)
        # Étape facultative : la fermeture de l'intervention n'exige aucune tâche faite.
        instance.sql(
            "UPDATE preventive_plan_gamme_step SET optional = true WHERE plan_id = %s", (plan,)
        )
        crees.append(plan)
        return machine_id, plan

    yield fabrique
    for plan in crees:
        instance.sql("UPDATE preventive_plan SET active = false WHERE id = %s", (plan,))


def _generer(instance, client, admin, plans, auto_accept):
    machine_id, plan = plans(auto_accept)
    resp = client.post("/preventive-occurrences/generate", headers=admin.headers)
    assert resp.status_code == 200, resp.text
    occ_id, di_id, intervention_id = instance.sql(
        "SELECT id::text, di_id::text, intervention_id::text FROM preventive_occurrence "
        "WHERE plan_id = %s AND machine_id = %s",
        (plan, machine_id),
    )[0]
    task_id = instance.sql(
        "SELECT id::text FROM intervention_task WHERE occurrence_id = %s", (occ_id,)
    )[0][0]
    return occ_id, di_id, intervention_id, task_id


# ── Occurrence préventive et tâches rattachées ──────────────────────────────


def test_acceptation_automatique_trace_l_occurrence_et_la_tache(instance, client, admin, plans):
    occ_id, _, intervention_id, task_id = _generer(instance, client, admin, plans, True)

    _un_evenement_systeme(
        instance,
        admin,
        occ_id,
        "status_changed",
        status="in_progress",
        intervention_id=intervention_id,
    )
    _un_evenement_systeme(instance, admin, task_id, "updated", intervention_id=intervention_id)


def test_acceptation_manuelle_de_la_demande_trace_l_occurrence_et_la_tache(
    instance, client, admin, plans
):
    occ_id, di_id, _, task_id = _generer(instance, client, admin, plans, False)

    resp = client.post(
        f"/intervention-requests/{di_id}/transition",
        headers=admin.headers,
        json={
            "status_to": "acceptee",
            "type_inter": "PRE",
            "tech_id": admin.id,
            "reason_code": MOTIF,
        },
    )
    assert resp.status_code == 200, resp.text

    intervention_id = instance.sql(
        "SELECT intervention_id::text FROM preventive_occurrence WHERE id = %s", (occ_id,)
    )[0][0]
    _un_evenement_systeme(
        instance,
        admin,
        occ_id,
        "status_changed",
        status="in_progress",
        intervention_id=intervention_id,
    )
    _un_evenement_systeme(instance, admin, task_id, "updated", intervention_id=intervention_id)


def test_fermer_l_intervention_trace_l_occurrence_completee_par_le_trigger(
    instance, client, admin, plans
):
    occ_id, _, intervention_id, _ = _generer(instance, client, admin, plans, True)

    resp = client.put(
        f"/interventions/{intervention_id}", headers=admin.headers, json={"status_actual": "ferme"}
    )
    assert resp.status_code == 200, resp.text

    assert instance.sql("SELECT status FROM preventive_occurrence WHERE id = %s", (occ_id,)) == [
        ("completed",)
    ]
    termines = [
        lg
        for lg in _evenements(instance, occ_id, "status_changed")
        if (lg[3] or {}).get("status") == "completed"
    ]
    assert len(termines) == 1, termines
    assert termines[0][4:] == (*SYSTEME, admin.id)


def test_repair_des_occurrences_trace_chaque_correction(instance, client, admin, plans):
    occ_id, _, intervention_id, task_id = _generer(instance, client, admin, plans, True)
    # Dérive à réparer : occurrence restée « in_progress » sous une intervention fermée,
    # tâche détachée, case « facultative » désynchronisée de la gamme.
    instance.sql(
        "UPDATE intervention SET status_actual = 'ferme' WHERE id = %s", (intervention_id,)
    )
    instance.sql("UPDATE preventive_occurrence SET status = 'in_progress' WHERE id = %s", (occ_id,))
    instance.sql(
        "UPDATE intervention_task SET intervention_id = NULL, optional = false WHERE id = %s",
        (task_id,),
    )

    resp = client.post("/preventive-occurrences/repair", headers=admin.headers)

    assert resp.status_code == 200, resp.text
    _un_evenement_systeme(instance, admin, task_id, "updated", intervention_id=intervention_id)
    _un_evenement_systeme(instance, admin, task_id, "optional_changed", optional=True)
    _un_evenement_systeme(instance, admin, occ_id, "status_changed", status="completed")


def test_repair_des_demandes_trace_le_lien_retabli(instance, client, admin, plans):
    _, di_id, intervention_id, _ = _generer(instance, client, admin, plans, True)
    instance.sql("UPDATE intervention_request SET intervention_id = NULL WHERE id = %s", (di_id,))
    instance.sql(
        "UPDATE intervention SET status_actual = 'ferme' WHERE id = %s", (intervention_id,)
    )
    instance.sql("UPDATE intervention_request SET statut = 'acceptee' WHERE id = %s", (di_id,))

    resp = client.post("/intervention-requests/repair", headers=admin.headers)

    assert resp.status_code == 200, resp.text
    _un_evenement_systeme(
        instance, admin, di_id, "intervention_id_changed", intervention_id=intervention_id
    )
    _un_evenement_systeme(instance, admin, di_id, "status_transitioned", statut="cloturee")


# ── Tâches closes par une action : closed_by toujours rempli ────────────────


def test_une_action_qui_clot_une_tache_remplit_closed_by(instance, client, admin):
    intervention_id, _ = intervention_liee(client, admin, instance)
    faite = tache(instance, intervention_id, "À finir")
    ignoree = tache(instance, intervention_id, "À ignorer")
    sous_categorie = instance.sql("SELECT id FROM action_subcategory LIMIT 1")[0][0]

    resp = client.post(
        "/intervention-actions",
        headers=admin.headers,
        json={
            "intervention_id": intervention_id,
            "action_subcategory": sous_categorie,
            "tech": admin.id,
            "complexity_score": 1,
            "time_spent": 0.5,
            "reason_code": MOTIF,
            "tasks": [
                {"task_id": faite, "close_task": True},
                {"task_id": ignoree, "skip": True, "skip_reason": "Pièce absente"},
            ],
        },
    )

    assert resp.status_code == 200, resp.text
    for task_id in (faite, ignoree):
        assert instance.sql(
            "SELECT closed_by::text FROM intervention_task WHERE id = %s", (task_id,)
        ) == [(admin.id,)]


# ── Ligne « ouvert » du journal d'une intervention ──────────────────────────


def test_la_ligne_ouvert_du_journal_porte_l_auteur_de_la_requete(instance, client, admin):
    intervention_id, _ = intervention_liee(client, admin, instance)

    lignes = instance.sql(
        "SELECT changed_by::text FROM intervention_status_log "
        "WHERE intervention_id = %s AND status_from IS NULL",
        (intervention_id,),
    )
    assert lignes == [(admin.id,)]


# ── Achats : regroupement en lignes de commande ─────────────────────────────


def test_le_regroupement_trace_la_ligne_creee_puis_cumulee(
    instance,
    client,
    admin,
    famille,  # noqa: F811
):
    part = _piece(instance, famille, _fournisseur(instance))
    _demande_a_repartir(client, admin, part)
    _demande_a_repartir(client, admin, part)

    resp = client.post("/purchase-requests/dispatch", headers=admin.headers)

    assert resp.status_code == 200, resp.text
    lignes = instance.sql("SELECT id::text FROM supplier_order_line WHERE part_id = %s", (part,))
    assert len(lignes) == 1, lignes
    ligne = lignes[0][0]
    _un_evenement_systeme(instance, admin, ligne, "created", part_id=part)
    _un_evenement_systeme(instance, admin, ligne, "quantity_changed", quantity=4)


# ── Équipements : rattachement des sous-équipements ─────────────────────────


def test_le_rattachement_d_un_sous_equipement_est_trace_sur_lui(instance, client, admin):
    def creer(nom):
        r = client.post("/equipements", json={"name": nom}, headers=admin.headers)
        assert r.status_code in (200, 201), r.text
        return r.json().get("data", r.json())["id"]

    mere, fille = creer(f"Mère {secrets.token_hex(2)}"), creer(f"Fille {secrets.token_hex(2)}")

    resp = client.patch(
        f"/equipements/{mere}", json={"children_ids": [fille]}, headers=admin.headers
    )

    assert resp.status_code == 200, resp.text
    evenement = _un_evenement_systeme(
        instance, admin, fille, "equipement_mere_changed", equipement_mere=mere
    )
    assert evenement[2] == {"equipement_mere": None}
