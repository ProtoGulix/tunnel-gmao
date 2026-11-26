"""Constat après intervention (CST-02, ADR 0043) : API, clôture, demande issue du constat."""

import secrets

import pytest

pytestmark = pytest.mark.integration

CHOIX_PRE = ["TASK", "FREQ_MONTHLY", "SIGNAL_SEEN", "PART_PLC"]
CHOIX_PRO = ["PROJECT", "SINCE_LT_1M", "SIGNAL_NONE", "PART_MECHANICAL"]
CHOIX_SANS_TYPE = ["TRAINING", "DOM_ELECTRICAL", "SIGNAL_NONE", "PART_PLC"]


def _data(response):
    body = response.json()
    return body.get("data", body)


def _machine(client, admin, name="Presse constat"):
    r = client.post(
        "/equipements", json={"name": f"{name} {secrets.token_hex(2)}"}, headers=admin.headers
    )
    return _data(r)["id"]


def _intervention(client, admin, machine_id=None, type_inter="CUR"):
    machine_id = machine_id or _machine(client, admin)
    demande = client.post(
        "/intervention-requests",
        json={"machine_id": machine_id, "demandeur_nom": "Atelier", "description": "Panne"},
        headers=admin.headers,
    )
    r = client.post(
        "/interventions",
        json={
            "machine_id": machine_id,
            "type_inter": type_inter,
            "tech_id": admin.id,
            "title": "Panne",
            "priority": "normal",
            "request_id": _data(demande)["id"],
        },
        headers=admin.headers,
    )
    assert r.status_code in (200, 201), r.text
    return _data(r)["id"], machine_id


def _constat(client, account, intervention_id, choices, **extra):
    return client.post(
        f"/interventions/{intervention_id}/constats",
        json={"choices": choices, **extra},
        headers=account.headers,
    )


def _fermer(client, admin, intervention_id):
    return client.put(
        f"/interventions/{intervention_id}",
        json={"status_actual": "ferme", "reason_code": "ROUTINE"},
        headers=admin.headers,
    )


@pytest.fixture
def cur_exige_un_constat(instance):
    """CUR exige un constat (réglage de départ, remis à son état d'avant en fin de test)."""
    avant = instance.sql("SELECT constat_required FROM intervention_type WHERE code = 'CUR'")[0][0]
    instance.sql("UPDATE intervention_type SET constat_required = true WHERE code = 'CUR'")
    yield
    instance.sql("UPDATE intervention_type SET constat_required = %s WHERE code = 'CUR'", (avant,))


def test_questions_actives_dans_l_ordre_sans_type_preconise(client, make_user):
    r = client.get("/constats/questions", headers=make_user("TECH").headers)
    assert r.status_code == 200, r.text
    questions = r.json()
    assert [q["code"] for q in questions][:2] == ["LEVER", "FREQUENCY"]
    lever = questions[0]
    assert lever["is_multiple"] is True and lever["parent_choice_code"] is None
    assert [c["code"] for c in lever["choices"]][:2] == ["TASK", "PROJECT"]
    assert questions[1]["parent_choice_code"] == "TASK"
    assert "suggested_type_inter" not in lever["choices"][0]


def test_creation_cree_la_demande_dans_la_meme_transaction(client, admin, make_user, instance):
    tech = make_user("TECH")
    intervention_id, machine_id = _intervention(client, admin)
    # created_by du corps est ignoré : l'auteur vient du jeton
    r = _constat(client, tech, intervention_id, CHOIX_PRE, created_by=admin.id)
    assert r.status_code == 201, r.text
    constat = _data(r)
    assert constat["created_by"] == tech.id and constat["machine_id"] == machine_id
    assert constat["suggested_type_inter"] == "PRE" and constat["request_status"] == "nouvelle"
    assert {a["choice_code"] for a in constat["answers"]} == set(CHOIX_PRE)
    di = instance.sql(
        "SELECT source_intervention_id::text, created_by::text, origine, description, statut "
        "FROM intervention_request WHERE id = %s",
        (constat["request_id"],),
    )[0]
    assert di[0] == intervention_id and di[1] == tech.id and di[2] == "signalee"
    assert di[4] == "nouvelle"
    assert "Tâche de maintenance régulière" in di[3] and "Mensuelle" in di[3]
    # Auteur réel tracé dans le journal d'audit, pour le constat comme pour la demande
    auteurs = instance.sql(
        "SELECT DISTINCT changed_by::text FROM audit_log WHERE entity_id IN (%s, %s)",
        (constat["id"], constat["request_id"]),
    )
    assert [a[0] for a in auteurs] == [tech.id]


def test_levier_projet_prend_le_type_pro_et_sans_levier_type_aucun(
    client, admin, make_user, instance
):
    tech = make_user("TECH")
    intervention_id, _ = _intervention(client, admin)
    assert (
        _data(_constat(client, tech, intervention_id, CHOIX_PRO))["suggested_type_inter"] == "PRO"
    )
    sans = _constat(client, tech, intervention_id, CHOIX_SANS_TYPE)
    assert sans.status_code == 201, sans.text
    assert _data(sans)["suggested_type_inter"] is None
    # Plusieurs constats par intervention : les deux sont listés
    liste = client.get(f"/interventions/{intervention_id}/constats", headers=tech.headers)
    assert len(liste.json()) == 2


def test_machine_visee_modifiable_et_inconnue_refusee(client, admin, make_user):
    tech = make_user("TECH")
    intervention_id, _ = _intervention(client, admin)
    autre = _machine(client, admin, "Autre")
    ok = _constat(client, tech, intervention_id, CHOIX_PRE, machine_id=autre)
    assert _data(ok)["machine_id"] == autre
    inconnue = _constat(
        client, tech, intervention_id, CHOIX_PRE, machine_id="00000000-0000-0000-0000-000000000001"
    )
    assert inconnue.status_code == 400


def test_choix_invalide_ne_cree_aucune_demande(client, admin, make_user, instance):
    tech = make_user("TECH")
    intervention_id, _ = _intervention(client, admin)
    avant = instance.sql("SELECT count(*) FROM intervention_request")[0][0]
    for choix in (["INCONNU"], ["TASK", "SIGNAL_NONE", "PART_PLC"], []):
        assert _constat(client, tech, intervention_id, choix).status_code == 400
    assert instance.sql("SELECT count(*) FROM intervention_request")[0][0] == avant


def test_acheteur_et_cle_mcp_refuses(client, admin, make_user):
    intervention_id, _ = _intervention(client, admin)
    acheteur = make_user("ACHETEUR")
    assert _constat(client, acheteur, intervention_id, CHOIX_PRE).status_code == 403
    cle = client.post(
        "/api-keys", headers=admin.headers, json={"name": f"it-{secrets.token_hex(3)}"}
    )
    r = client.post(
        f"/interventions/{intervention_id}/constats",
        json={"choices": CHOIX_PRE},
        headers={"X-API-Key": cle.json()["secret"]},
    )
    assert r.status_code == 403


def test_constat_accepte_apres_la_cloture_refuse_si_archivee(client, admin, make_user, instance):
    tech = make_user("TECH")
    intervention_id, _ = _intervention(client, admin, type_inter="PRE")
    assert _fermer(client, admin, intervention_id).status_code == 200
    assert _constat(client, tech, intervention_id, CHOIX_PRE).status_code == 201
    instance.sql("UPDATE intervention SET printed_fiche = true WHERE id = %s", (intervention_id,))
    assert _constat(client, tech, intervention_id, CHOIX_PRE).status_code == 400


def test_cloture_refusee_sans_constat_puis_acceptee(
    client, admin, make_user, instance, cur_exige_un_constat
):
    tech = make_user("TECH")
    intervention_id, _ = _intervention(client, admin)
    refus = _fermer(client, admin, intervention_id)
    assert refus.status_code == 400 and "constat" in refus.text
    _constat(client, tech, intervention_id, CHOIX_PRE)
    assert _fermer(client, admin, intervention_id).status_code == 200


def test_cloture_par_changement_de_type_vers_un_type_exigeant(
    client, admin, instance, cur_exige_un_constat
):
    intervention_id, _ = _intervention(client, admin, type_inter="PRE")
    r = client.put(
        f"/interventions/{intervention_id}",
        json={"status_actual": "ferme", "type_inter": "CUR", "reason_code": "ROUTINE"},
        headers=admin.headers,
    )
    assert r.status_code == 400, r.text


def test_type_sans_exigence_ferme_comme_avant(client, admin, cur_exige_un_constat):
    intervention_id, _ = _intervention(client, admin, type_inter="PRE")
    assert _fermer(client, admin, intervention_id).status_code == 200


def test_creation_deja_fermee_refusee_si_le_type_exige_un_constat(
    client, admin, cur_exige_un_constat
):
    machine_id = _machine(client, admin)
    demande = client.post(
        "/intervention-requests",
        json={"machine_id": machine_id, "demandeur_nom": "A", "description": "x"},
        headers=admin.headers,
    )
    r = client.post(
        "/interventions",
        json={
            "machine_id": machine_id,
            "type_inter": "CUR",
            "tech_id": admin.id,
            "status_actual": "ferme",
            "request_id": _data(demande)["id"],
        },
        headers=admin.headers,
    )
    assert r.status_code == 400, r.text


def _corriger(client, account, constat_id, choices, reason_code="CONSTAT_CORRECTION", **extra):
    corps = {"choices": choices, **extra}
    if reason_code:
        corps["reason_code"] = reason_code
    return client.post(f"/constats/{constat_id}/corrections", json=corps, headers=account.headers)


def test_correction_cree_une_version_et_recalcule_le_type(client, admin, make_user, instance):
    tech = make_user("TECH")
    intervention_id, _ = _intervention(client, admin)
    constat = _data(_constat(client, tech, intervention_id, CHOIX_PRE))
    sans_motif = _corriger(client, tech, constat["id"], CHOIX_PRO, reason_code=None)
    assert sans_motif.status_code == 400
    assert [m["code"] for m in sans_motif.json()["audit"]["reasons"]] == ["CONSTAT_CORRECTION"]
    r = _corriger(client, tech, constat["id"], CHOIX_PRO)
    assert r.status_code == 201, r.text
    nouveau = _data(r)
    assert (
        nouveau["supersedes_id"] == constat["id"] and nouveau["request_id"] == constat["request_id"]
    )
    assert nouveau["suggested_type_inter"] == "PRO"
    liste = client.get(f"/interventions/{intervention_id}/constats", headers=tech.headers).json()
    assert [c["id"] for c in liste] == [nouveau["id"]]
    ligne = instance.sql(
        "SELECT r.code, l.changed_by::text FROM audit_log l JOIN audit_reason_code r "
        "ON r.id = l.reason_code_id WHERE l.entity_id = %s AND l.decision_type = 'constat_corrected'",
        (constat["id"],),
    )
    assert [tuple(x) for x in ligne] == [("CONSTAT_CORRECTION", tech.id)]
    # L'ancienne version ne se corrige plus
    assert _corriger(client, tech, constat["id"], CHOIX_PRE).status_code == 409
    # Le constat est lisible par sa demande
    lu = client.get(f"/constats/by-request/{constat['request_id']}", headers=tech.headers)
    assert _data(lu)["id"] == nouveau["id"]


def test_correction_reservee_a_l_auteur_ou_au_referent(client, admin, make_user):
    auteur, autre, resp = make_user("TECH"), make_user("TECH"), make_user("RESP")
    intervention_id, _ = _intervention(client, admin)
    constat = _data(_constat(client, auteur, intervention_id, CHOIX_PRE))
    assert _corriger(client, autre, constat["id"], CHOIX_PRO).status_code == 403
    r = _corriger(client, resp, constat["id"], CHOIX_PRO)
    assert r.status_code == 201, r.text
    # created_by de la version = l'auteur de la correction
    assert _data(r)["created_by"] == resp.id


def test_correction_refusee_une_fois_la_demande_traitee(client, admin, make_user, instance):
    tech = make_user("TECH")
    intervention_id, _ = _intervention(client, admin)
    constat = _data(_constat(client, tech, intervention_id, CHOIX_PRE))
    liste = client.get(f"/interventions/{intervention_id}/constats", headers=tech.headers).json()
    assert liste[0]["can_correct"] is True
    instance.sql(
        "UPDATE intervention_request SET statut = 'en_attente' WHERE id = %s",
        (constat["request_id"],),
    )
    assert _corriger(client, admin, constat["id"], CHOIX_PRO).status_code == 400
    liste = client.get(f"/interventions/{intervention_id}/constats", headers=tech.headers).json()
    assert liste[0]["can_correct"] is False


def _idee(client, admin, machine_id, type_inter="PRO"):
    r = client.post(
        "/intervention-requests",
        json={
            "machine_id": machine_id,
            "demandeur_nom": "Atelier",
            "description": "Idée",
            "suggested_type_inter": type_inter,
        },
        headers=admin.headers,
    )
    return _data(r)["id"]


def test_rattachement_rejette_la_demande_en_doublon(client, admin, make_user, instance):
    tech, resp = make_user("TECH"), make_user("RESP")
    intervention_id, machine_id = _intervention(client, admin)
    constat = _data(_constat(client, tech, intervention_id, CHOIX_PRO))
    idee = _idee(client, admin, machine_id)
    _idee(client, admin, machine_id, type_inter="PRE")  # pas une idée d'amélioration
    _idee(client, admin, _machine(client, admin), type_inter="PRO")  # autre machine
    liste = client.get(f"/constats/{constat['id']}/improvement-ideas", headers=resp.headers)
    assert [i["id"] for i in liste.json()] == [idee]

    assert (
        client.post(
            f"/constats/{constat['id']}/link", json={"request_id": idee}, headers=tech.headers
        ).status_code
        == 403
    )
    r = client.post(
        f"/constats/{constat['id']}/link", json={"request_id": idee}, headers=resp.headers
    )
    assert r.status_code == 200, r.text
    assert _data(r)["linked_request_id"] == idee and _data(r)["request_status"] == "rejetee"
    ligne = instance.sql(
        "SELECT r.code, l.changed_by::text FROM audit_log l JOIN audit_reason_code r "
        "ON r.id = l.reason_code_id WHERE l.entity_id = %s AND l.decision_type = 'statut_changed'",
        (constat["request_id"],),
    )
    assert [tuple(x) for x in ligne] == [("REJECT_DUPLICATE", resp.id)]
    # Déjà rattaché, et la demande rejetée ne se corrige plus
    assert (
        client.post(
            f"/constats/{constat['id']}/link", json={"request_id": idee}, headers=resp.headers
        ).status_code
        == 400
    )
    assert _corriger(client, resp, constat["id"], CHOIX_PRE).status_code == 400


def test_rattachement_refuse_hors_idee_ouverte_de_la_machine(client, admin, make_user):
    resp = make_user("RESP")
    intervention_id, machine_id = _intervention(client, admin)
    constat = _data(_constat(client, make_user("TECH"), intervention_id, CHOIX_PRO))
    for cible in (
        _idee(client, admin, machine_id, type_inter="PRE"),
        _idee(client, admin, _machine(client, admin)),
        constat["request_id"],
    ):
        r = client.post(
            f"/constats/{constat['id']}/link", json={"request_id": cible}, headers=resp.headers
        )
        assert r.status_code == 400, r.text


def test_constat_required_lisible_et_modifiable_dans_le_referentiel(client, admin, make_user):
    resp = make_user("RESP")
    types = client.get("/admin/intervention-types", headers=resp.headers).json()
    pre = next(t for t in types if t["code"] == "PRE")
    assert pre["constat_required"] is False
    try:
        r = client.patch(
            f"/admin/intervention-types/{pre['id']}",
            json={"constat_required": True, "reason_code": "ROUTINE"},
            headers=resp.headers,
        )
        assert r.status_code == 200, r.text
        publics = client.get("/interventions/types", headers=resp.headers).json()
        assert next(t for t in publics if t["id"] == "PRE")["constat_required"] is True
    finally:
        client.patch(
            f"/admin/intervention-types/{pre['id']}",
            json={"constat_required": False, "reason_code": "ROUTINE"},
            headers=admin.headers,
        )
