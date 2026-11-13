"""Clôture et annulation directes d'une tâche par RESP et ADMIN (ADR 0016, CLO-01 et CLO-03).

PATCH /intervention-tasks/{id} avec status=done ou skipped : `done` réservé à RESP et
ADMIN, motif d'audit explicite exigé (demande de motif standard sinon), auteur réel tiré
du jeton (closed_by et audit_log.changed_by).

Le cas « skipped » d'une étape obligatoire de gamme réservée à RESP et ADMIN est déjà
couvert par test_taches_ignorer_integration.py : non dupliqué ici."""

import secrets

import pytest

pytestmark = pytest.mark.integration

# Motif explicite, valable pour demande, intervention, tâche et action (audit_rule seed).
RAISON = "ROUTINE"

TEXTE = "Travail fait, constaté en réunion de coordination"


def _intervention(client, admin, instance, plan_id=None):
    """Crée équipement, demande et intervention ; renvoie intervention_id."""
    raison = RAISON
    equipement = client.post("/equipements", json={"name": "Presse test"}, headers=admin.headers)
    machine_id = equipement.json().get("data", equipement.json())["id"]
    demande = client.post(
        "/intervention-requests",
        json={
            "machine_id": machine_id,
            "demandeur_nom": "Atelier",
            "description": "Révision",
            "reason_code": raison,
        },
        headers=admin.headers,
    )
    request_id = demande.json().get("data", demande.json())["id"]
    intervention = client.post(
        "/interventions",
        json={
            "machine_id": machine_id,
            "type_inter": "PRE",
            "tech_id": admin.id,
            "title": "Révision",
            "priority": "normale",
            "request_id": request_id,
            "reason_code": raison,
        },
        headers=admin.headers,
    )
    assert intervention.status_code in (200, 201), intervention.text
    intervention_id = intervention.json().get("data", intervention.json())["id"]
    if plan_id:
        instance.sql(
            "UPDATE intervention SET plan_id = %s WHERE id = %s", (plan_id, intervention_id)
        )
    return intervention_id


def _plan(instance):
    return instance.sql(
        "INSERT INTO preventive_plan (code, label, trigger_type, periodicity_days) "
        "VALUES (%s, 'Plan test clôture', 'periodicity', 30) RETURNING id::text",
        (f"CLO-{secrets.token_hex(3)}",),
    )[0][0]


def _tache(instance, intervention_id, status="todo", optional=False):
    return instance.sql(
        "INSERT INTO intervention_task (intervention_id, label, origin, status, optional) "
        "VALUES (%s, 'Contrôler les paliers', 'plan', %s, %s) RETURNING id::text",
        (intervention_id, status, optional),
    )[0][0]


def _etat(instance, task_id):
    return instance.sql(
        "SELECT status, closed_by::text FROM intervention_task WHERE id = %s", (task_id,)
    )[0]


MOTIF = "TASK_DONE_UNRECORDED"
MOTIFS_SEED = {
    "TASK_DONE_UNRECORDED",
    "TASK_HANDLED_ELSEWHERE",
    "TASK_NO_LONGER_NEEDED",
    "TASK_DUPLICATE",
}


# Liste exacte proposée sur une base neuve, selon le bouton (decision_types, ADR 0016)
MOTIFS_PAR_BOUTON = {
    "done": {"TASK_DONE_UNRECORDED", "TASK_HANDLED_ELSEWHERE", "OTHER"},
    "skipped": {"TASK_NO_LONGER_NEEDED", "TASK_DUPLICATE", "TASK_HANDLED_ELSEWHERE", "OTHER"},
}


def _patcher(client, account_headers, task_id, status, reason_code=MOTIF, **extra):
    """PATCH de statut ; reason_code=None omet le champ (le middleware injecte ROUTINE)."""
    corps = {"status": status, **extra}
    if reason_code is not None:
        corps["reason_code"] = reason_code
    return client.patch(f"/intervention-tasks/{task_id}", json=corps, headers=account_headers)


def _cloturer(client, account_headers, task_id, **kwargs):
    return _patcher(client, account_headers, task_id, "done", **kwargs)


def _audits(instance, task_id):
    """Entrées d'audit distinctes du changement de statut (texte, auteur).

    Le repo écrit une ligne par champ (AUD-04, ADR 0017) : elle doit porter la raison
    et l'auteur."""
    rows = instance.sql(
        "SELECT reason_text, changed_by::text FROM audit_log "
        "WHERE entity_id = %s AND decision_type = 'status_changed'",
        (task_id,),
    )
    return sorted(set(map(tuple, rows)), key=str)


def test_la_seed_charge_les_quatre_motifs_de_cloture(instance):
    rows = instance.sql(
        "SELECT code, category, entity_types, is_active FROM audit_reason_code "
        "WHERE code = ANY(%s)",
        (sorted(MOTIFS_SEED),),
    )
    assert {r[0] for r in rows} == MOTIFS_SEED
    for _, category, entity_types, is_active in rows:
        assert category == "user"
        assert entity_types == ["task"]
        assert is_active


def test_resp_cloture_une_tache_avec_trace_dans_closed_by_et_laudit(
    client, admin, instance, make_user
):
    task_id = _tache(instance, _intervention(client, admin, instance))
    resp = make_user("RESP")
    r = _cloturer(client, resp.headers, task_id)
    assert r.status_code == 200, r.text
    assert _etat(instance, task_id) == ("done", resp.id)
    assert _audits(instance, task_id) == [(None, resp.id)]


def test_le_texte_facultatif_figure_sur_chaque_ligne_daudit(client, admin, instance, make_user):
    task_id = _tache(instance, _intervention(client, admin, instance))
    resp = make_user("RESP")
    r = _cloturer(client, resp.headers, task_id, reason_text=TEXTE)
    assert r.status_code == 200, r.text
    assert _audits(instance, task_id) == [(TEXTE, resp.id)]


@pytest.mark.parametrize("statut", ["done", "skipped"])
def test_sans_motif_la_demande_de_motif_standard_est_renvoyee(
    client, admin, instance, make_user, statut
):
    """Sans reason_code, le middleware injecte ROUTINE : la route doit le refuser."""
    task_id = _tache(instance, _intervention(client, admin, instance))
    resp = make_user("RESP")
    r = _patcher(client, resp.headers, task_id, statut, reason_code=None)
    assert r.status_code == 400, r.text
    corps = r.json()
    assert corps["detail"] == "reason_code obligatoire pour cette mutation"
    assert corps["error_type"] == "ValidationError"
    audit = corps["audit"]
    assert audit["required"] is True and audit["silent"] is False
    codes = {m["code"] for m in audit["reasons"]}
    assert codes == MOTIFS_PAR_BOUTON[statut]
    assert _etat(instance, task_id) == ("todo", None)


def test_motif_routine_explicite_est_traite_comme_une_absence_de_motif(
    client, admin, instance, make_user
):
    task_id = _tache(instance, _intervention(client, admin, instance))
    r = _cloturer(client, make_user("RESP").headers, task_id, reason_code="ROUTINE")
    assert r.status_code == 400 and r.json()["audit"]["reasons"]
    assert _etat(instance, task_id) == ("todo", None)


@pytest.mark.parametrize("extra", [{}, {"reason_text": "   "}])
def test_other_sans_texte_est_refuse_puis_accepte_avec_texte(
    client, admin, instance, make_user, extra
):
    task_id = _tache(instance, _intervention(client, admin, instance))
    resp = make_user("RESP")
    r = _cloturer(client, resp.headers, task_id, reason_code="OTHER", **extra)
    assert r.status_code == 400, r.text
    assert _etat(instance, task_id) == ("todo", None)
    ok = _cloturer(client, resp.headers, task_id, reason_code="OTHER", reason_text=TEXTE)
    assert ok.status_code == 200, ok.text
    assert _audits(instance, task_id) == [(TEXTE, resp.id)]


def test_legacy_status_change_est_inactif(instance):
    rows = instance.sql(
        "SELECT is_active FROM audit_reason_code WHERE code = 'LEGACY_STATUS_CHANGE'"
    )
    assert rows == [(False,)]


@pytest.mark.parametrize(
    ("statut", "code"),
    [
        ("done", "PLANNING_CHANGE"),  # valide pour task, hors de la liste de Terminé
        ("done", "TASK_DUPLICATE"),  # réservé à Ignorer
        ("skipped", "TASK_DONE_UNRECORDED"),  # réservé à Terminé
    ],
)
def test_motif_hors_liste_du_bouton_est_refuse(client, admin, instance, make_user, statut, code):
    task_id = _tache(instance, _intervention(client, admin, instance), optional=True)
    r = _patcher(client, make_user("RESP").headers, task_id, statut, reason_code=code)
    assert r.status_code == 400, r.text
    assert "audit" not in r.json()
    assert _etat(instance, task_id) == ("todo", None)


def test_motif_dune_autre_entite_est_refuse(client, admin, instance, make_user):
    code = f"REQ_ONLY_{secrets.token_hex(3).upper()}"
    instance.sql(
        "INSERT INTO audit_reason_code (id, code, label, category, entity_types, is_active) "
        "SELECT COALESCE(MAX(id), 0) + 1, %s, 'Motif demande', 'user', '{request}', true "
        "FROM audit_reason_code",
        (code,),
    )
    task_id = _tache(instance, _intervention(client, admin, instance))
    r = _cloturer(client, make_user("RESP").headers, task_id, reason_code=code)
    assert r.status_code == 400, r.text
    assert "audit" not in r.json()
    assert _etat(instance, task_id) == ("todo", None)


def test_tech_ne_peut_pas_cloturer_une_tache_sans_action(client, admin, instance, make_user):
    task_id = _tache(instance, _intervention(client, admin, instance))
    r = _cloturer(client, make_user("TECH").headers, task_id)
    assert r.status_code == 403, r.text
    assert _etat(instance, task_id) == ("todo", None)


def test_cle_mcp_ne_peut_pas_cloturer_une_tache(client, admin, instance):
    task_id = _tache(instance, _intervention(client, admin, instance))
    cle = client.post(
        "/api-keys", json={"name": f"it-{secrets.token_hex(3)}"}, headers=admin.headers
    )
    assert cle.status_code == 201, cle.text
    r = _cloturer(client, {"X-API-Key": cle.json()["secret"]}, task_id)
    assert r.status_code == 403, r.text
    assert _etat(instance, task_id) == ("todo", None)


def test_skipped_avec_motif_sans_skip_reason_prend_le_libelle(client, admin, instance, make_user):
    task_id = _tache(instance, _intervention(client, admin, instance), optional=True)
    resp = make_user("RESP")
    r = _patcher(client, resp.headers, task_id, "skipped", reason_code="TASK_DUPLICATE")
    assert r.status_code == 200, r.text
    assert _etat(instance, task_id) == ("skipped", resp.id)
    libelle = instance.sql("SELECT label FROM audit_reason_code WHERE code = 'TASK_DUPLICATE'")[0][
        0
    ]
    assert instance.sql("SELECT skip_reason FROM intervention_task WHERE id = %s", (task_id,)) == [
        (libelle,)
    ]


def test_skipped_ajoute_le_texte_au_libelle_du_motif(client, admin, instance, make_user):
    task_id = _tache(instance, _intervention(client, admin, instance), optional=True)
    r = _patcher(
        client,
        make_user("RESP").headers,
        task_id,
        "skipped",
        reason_code="TASK_NO_LONGER_NEEDED",
        reason_text="Machine arrêtée",
    )
    assert r.status_code == 200, r.text
    skip_reason = instance.sql(
        "SELECT skip_reason FROM intervention_task WHERE id = %s", (task_id,)
    )[0][0]
    assert skip_reason.endswith(" : Machine arrêtée")


def test_resp_cloture_une_tache_en_cours_qui_a_une_action(client, admin, instance, make_user):
    intervention_id = _intervention(client, admin, instance)
    task_id = _tache(instance, intervention_id)
    resp = make_user("RESP")
    raison = RAISON
    sous_categorie = instance.sql("SELECT id FROM action_subcategory LIMIT 1")[0][0]
    action = client.post(
        "/intervention-actions",
        json={
            "intervention_id": intervention_id,
            "action_subcategory": sous_categorie,
            "tech": resp.id,
            "complexity_score": 1,
            "time_spent": 0.5,
            "tasks": [{"task_id": task_id}],
            "reason_code": raison,
        },
        headers=resp.headers,
    )
    assert action.status_code in (200, 201), action.text
    instance.sql("UPDATE intervention_task SET status = 'in_progress' WHERE id = %s", (task_id,))
    r = _cloturer(client, resp.headers, task_id)
    assert r.status_code == 200, r.text
    assert _etat(instance, task_id) == ("done", resp.id)


def _fermer(client, admin, intervention_id):
    return client.post(
        "/intervention-status-log",
        json={
            "intervention_id": intervention_id,
            "status_from": "ouvert",
            "status_to": "ferme",
            "technician_id": admin.id,
            "date": "2026-11-13T10:00:00",
        },
        headers=admin.headers,
    )


def test_gamme_incomplete_bloque_la_fermeture_puis_la_cloture_la_debloque(
    client, admin, instance, make_user
):
    intervention_id = _intervention(client, admin, instance, plan_id=_plan(instance))
    task_id = _tache(instance, intervention_id)
    statut = instance.sql(
        "SELECT status_actual FROM intervention WHERE id = %s", (intervention_id,)
    )
    assert statut[0][0] == "ouvert"

    refus = _fermer(client, admin, intervention_id)
    assert refus.status_code == 409, refus.text
    assert instance.sql(
        "SELECT status_actual FROM intervention WHERE id = %s", (intervention_id,)
    ) == [("ouvert",)]

    resp = make_user("RESP")
    assert _cloturer(client, resp.headers, task_id).status_code == 200
    ok = _fermer(client, admin, intervention_id)
    assert ok.status_code == 201, ok.text
    assert instance.sql(
        "SELECT status_actual FROM intervention WHERE id = %s", (intervention_id,)
    ) == [("ferme",)]
