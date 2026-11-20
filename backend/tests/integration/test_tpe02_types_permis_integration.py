"""Types d'intervention permis par classe d'équipement (TPE-02, ADR 0031)."""

import secrets

import pytest

from .etape2_helpers import MOTIF, demande, lignes_audit

pytestmark = pytest.mark.integration


def _data(r):
    body = r.json()
    return body.get("data", body) if isinstance(body, dict) else body


def _classe(client, admin, types=None) -> str:
    code = f"TP{secrets.token_hex(3)}".upper()
    r = client.post(
        "/equipement-class",
        headers=admin.headers,
        json={"code": code, "label": f"Classe {code}", "reason_code": MOTIF},
    )
    assert r.status_code == 201, r.text
    class_id = _data(r)["id"]
    if types is not None:
        _regler(client, admin, class_id, types)
    return class_id


def _regler(client, admin, class_id, types, headers=None):
    return client.put(
        f"/equipement-class/{class_id}/intervention-types",
        headers=headers or admin.headers,
        json={"intervention_types": types},
    )


def _machine(instance, class_id=None) -> str:
    return str(
        instance.sql(
            "INSERT INTO machine (code, name, equipement_class_id) "
            "VALUES (%s, 'Machine TPE-02', %s) RETURNING id",
            (f"TP-{secrets.token_hex(3)}", class_id),
        )[0][0]
    )


def _creer(client, admin, machine_id, type_inter, request_id=None):
    return client.post(
        "/interventions",
        headers=admin.headers,
        json={
            "machine_id": machine_id,
            "type_inter": type_inter,
            "tech_id": admin.id,
            "title": "Test",
            "request_id": request_id or demande(client, admin, machine_id),
            "reason_code": MOTIF,
        },
    )


def _modifier(client, admin, intervention_id, **champs):
    return client.put(
        f"/interventions/{intervention_id}",
        headers=admin.headers,
        json={**champs, "reason_code": MOTIF},
    )


def _ids_types(r):
    return {t["id"] for t in _data(r)}


# ── Création ─────────────────────────────────────────────────────────────────


def test_classe_sans_liste_permet_tous_les_types(client, admin, instance):
    machine_id = _machine(instance, _classe(client, admin))
    assert _creer(client, admin, machine_id, "PRO").status_code == 201


def test_equipement_sans_classe_permet_tous_les_types(client, admin, instance):
    assert _creer(client, admin, _machine(instance), "PRO").status_code == 201


def test_classe_avec_liste_refuse_un_type_non_permis_et_liste_les_permis(client, admin, instance):
    machine_id = _machine(instance, _classe(client, admin, ["CUR", "PRE"]))
    refuse = _creer(client, admin, machine_id, "PRO")
    assert refuse.status_code == 400, refuse.text
    assert "n'est pas permis" in refuse.text
    assert "(CUR)" in refuse.text and "(PRE)" in refuse.text
    assert _creer(client, admin, machine_id, "CUR").status_code == 201


def test_creation_atomique_refuse_aussi_et_n_ecrit_rien(client, admin, instance):
    machine_id = _machine(instance, _classe(client, admin, ["CUR"]))
    avant = instance.sql(
        "SELECT count(*) FROM intervention_request WHERE machine_id = %s", (machine_id,)
    )
    r = client.post(
        "/interventions",
        headers=admin.headers,
        json={
            "machine_id": machine_id,
            "type_inter": "PRO",
            "tech_id": admin.id,
            "title": "Atomique",
            "request": {"demandeur_nom": "Atelier", "description": "Bruit"},
            "reason_code": MOTIF,
        },
    )
    assert r.status_code == 400, r.text
    apres = instance.sql(
        "SELECT count(*) FROM intervention_request WHERE machine_id = %s", (machine_id,)
    )
    assert avant == apres


# ── Modification ─────────────────────────────────────────────────────────────


def test_changement_de_type_est_verifie(client, admin, instance):
    machine_id = _machine(instance, _classe(client, admin, ["CUR", "PRE"]))
    intervention_id = _data(_creer(client, admin, machine_id, "CUR"))["id"]
    assert _modifier(client, admin, intervention_id, type_inter="PRO").status_code == 400
    assert _modifier(client, admin, intervention_id, type_inter="PRE").status_code == 200


def test_changement_d_equipement_est_verifie(client, admin, instance):
    libre = _machine(instance)
    restreint = _machine(instance, _classe(client, admin, ["CUR"]))
    intervention_id = _data(_creer(client, admin, libre, "PRO"))["id"]
    refuse = _modifier(client, admin, intervention_id, machine_id=restreint)
    assert refuse.status_code == 400 and "n'est pas permis" in refuse.text
    assert (
        _modifier(
            client, admin, intervention_id, machine_id=restreint, type_inter="CUR"
        ).status_code
        == 200
    )


def test_intervention_existante_non_permise_reste_modifiable(client, admin, instance):
    class_id = _classe(client, admin)
    machine_id = _machine(instance, class_id)
    intervention_id = _data(_creer(client, admin, machine_id, "PRO"))["id"]
    assert _regler(client, admin, class_id, ["CUR"]).status_code == 200
    assert _modifier(client, admin, intervention_id, title="Nouveau titre").status_code == 200
    # Ni le type ni l'équipement ne changent : renvoyer les mêmes valeurs reste accepté.
    memes = _modifier(client, admin, intervention_id, type_inter="PRO", machine_id=machine_id)
    assert memes.status_code == 200, memes.text
    assert _modifier(client, admin, intervention_id, type_inter="PRE").status_code == 400


# ── Type suggéré par la demande ──────────────────────────────────────────────


def _demande_suggeree(client, admin, instance, machine_id, suggere, systeme=False) -> str:
    r = client.post(
        "/intervention-requests",
        headers=admin.headers,
        json={
            "machine_id": machine_id,
            "demandeur_nom": "Atelier",
            "description": "Suggestion",
            "suggested_type_inter": suggere,
            "reason_code": MOTIF,
        },
    )
    assert r.status_code == 201, r.text
    request_id = _data(r)["id"]
    if systeme:
        instance.sql(
            "UPDATE intervention_request SET is_system = true WHERE id = %s", (request_id,)
        )
    return request_id


def _accepter(client, admin, request_id, type_inter):
    return client.post(
        f"/intervention-requests/{request_id}/transition",
        headers=admin.headers,
        json={
            "status_to": "acceptee",
            "type_inter": type_inter,
            "tech_id": admin.id,
            "tech_initials": "AD",
            "reason_code": MOTIF,
        },
    )


def test_type_suggere_non_permis_n_est_pas_impose(client, admin, instance):
    class_id = _classe(client, admin)
    machine_id = _machine(instance, class_id)
    request_id = _demande_suggeree(client, admin, instance, machine_id, "PRO", systeme=True)
    assert _regler(client, admin, class_id, ["CUR"]).status_code == 200
    # Le type suggéré (PRO) n'est plus permis : ni imposé ni accepté, le type choisi décide.
    assert _accepter(client, admin, request_id, "PRO").status_code == 400
    ok = _accepter(client, admin, request_id, "CUR")
    assert ok.status_code == 200, ok.text


def test_creation_depuis_une_demande_au_type_suggere_non_permis_est_refusee(
    client, admin, instance
):
    class_id = _classe(client, admin)
    machine_id = _machine(instance, class_id)
    request_id = _demande_suggeree(client, admin, instance, machine_id, "PRO")
    _regler(client, admin, class_id, ["CUR"])
    assert _creer(client, admin, machine_id, "PRO", request_id).status_code == 400
    assert _creer(client, admin, machine_id, "CUR", request_id).status_code == 201


def test_type_suggere_permis_garde_l_adr_0026(client, admin, instance):
    machine_id = _machine(instance, _classe(client, admin, ["CUR", "PRE"]))
    request_id = _demande_suggeree(client, admin, instance, machine_id, "CUR", systeme=True)
    refuse = _accepter(client, admin, request_id, "PRE")
    assert refuse.status_code == 400 and "impose le type 'CUR'" in refuse.text
    assert _accepter(client, admin, request_id, "CUR").status_code == 200


# ── Lecture filtrée ─────────────────────────────────────────────────────────


def test_lecture_des_types_filtree_par_equipement(client, admin, instance):
    machine_id = _machine(instance, _classe(client, admin, ["CUR", "PRE"]))
    filtre = client.get(f"/interventions/types?machine_id={machine_id}", headers=admin.headers)
    assert filtre.status_code == 200, filtre.text
    assert _ids_types(filtre) == {"CUR", "PRE"}
    complet = _ids_types(client.get("/interventions/types", headers=admin.headers))
    assert {"CUR", "PRE", "PRO"} <= complet
    libre = _ids_types(
        client.get(f"/interventions/types?machine_id={_machine(instance)}", headers=admin.headers)
    )
    assert libre == complet


def test_lecture_filtree_n_expose_pas_les_types_inactifs(client, admin, instance):
    code = f"T{secrets.token_hex(3)}".upper()
    cree = client.post(
        "/admin/intervention-types", headers=admin.headers, json={"code": code, "label": code}
    )
    assert cree.status_code == 201, cree.text
    machine_id = _machine(instance, _classe(client, admin, ["CUR", code]))
    client.patch(
        f"/admin/intervention-types/{cree.json()['id']}/active",
        headers=admin.headers,
        json={"is_active": False},
    )
    r = client.get(f"/interventions/types?machine_id={machine_id}", headers=admin.headers)
    assert _ids_types(r) == {"CUR"}


# ── Administration de la classe ─────────────────────────────────────────────


def test_la_classe_porte_ses_types_permis(client, admin, instance):
    class_id = _classe(client, admin)
    assert (
        _data(client.get(f"/equipement-class/{class_id}", headers=admin.headers))[
            "allowed_intervention_types"
        ]
        == []
    )
    r = _regler(client, admin, class_id, ["PRE", "CUR", "CUR"])
    assert r.status_code == 200, r.text
    assert _data(r)["allowed_intervention_types"] == ["CUR", "PRE"]
    lu = client.get(f"/equipement-class/{class_id}/intervention-types", headers=admin.headers)
    assert _data(lu) == {"intervention_types": ["CUR", "PRE"]}
    liste = client.get("/equipement-class", headers=admin.headers).json()
    assert next(c for c in liste if c["id"] == class_id)["allowed_intervention_types"] == [
        "CUR",
        "PRE",
    ]
    assert _data(_regler(client, admin, class_id, []))["allowed_intervention_types"] == []


def test_code_inconnu_refuse_et_classe_inconnue_404(client, admin, instance):
    class_id = _classe(client, admin, ["CUR"])
    r = _regler(client, admin, class_id, ["CUR", "ZZZ"])
    assert r.status_code == 400 and "ZZZ" in r.text
    assert _data(client.get(f"/equipement-class/{class_id}", headers=admin.headers))[
        "allowed_intervention_types"
    ] == ["CUR"]
    inconnue = _regler(client, admin, "00000000-0000-0000-0000-000000000000", ["CUR"])
    assert inconnue.status_code == 404


def test_changement_de_liste_est_audite_avec_l_auteur_du_jeton(client, admin, instance):
    class_id = _classe(client, admin)
    _regler(client, admin, class_id, ["CUR"])
    lignes = [
        ligne
        for ligne in lignes_audit(instance, class_id)
        if ligne[1] == "intervention_types_changed"
    ]
    assert len(lignes) == 1
    assert lignes[0][0] == "equipement_class" and lignes[0][4] == admin.id
    _regler(client, admin, class_id, ["CUR"])  # identique : aucune nouvelle trace
    assert (
        len(
            [
                ligne
                for ligne in lignes_audit(instance, class_id)
                if ligne[1] == "intervention_types_changed"
            ]
        )
        == 1
    )


def test_droits_de_l_administration_des_types(client, admin, instance, make_user):
    class_id = _classe(client, admin)
    tech, resp = make_user("TECH"), make_user("RESP")
    assert _regler(client, admin, class_id, ["CUR"], tech.headers).status_code == 403
    assert _regler(client, admin, class_id, ["CUR"], resp.headers).status_code == 200
    # Même droit que la modification d'une classe : le retirer à RESP ferme aussi la liste.
    assert (
        client.patch(
            f"/equipement-class/{class_id}", headers=tech.headers, json={"label": "X"}
        ).status_code
        == 403
    )
    # La lecture reste ouverte à tout utilisateur authentifié.
    assert (
        client.get(
            f"/equipement-class/{class_id}/intervention-types", headers=tech.headers
        ).status_code
        == 200
    )


# ── Exemption du préventif (PRE issu d'un plan toujours permis) ──────────────


def _plan_sur_classe_cur(client, admin, instance, auto_accept):
    """Classe qui ne permet que CUR, une machine et un plan périodique ; désactivé par l'appelant."""
    class_id = _classe(client, admin, ["CUR"])
    machine_id = _machine(instance, class_id)
    plan = instance.sql(
        "INSERT INTO preventive_plan (code, label, equipement_class_id, trigger_type, "
        "periodicity_days, auto_accept) VALUES (%s, %s, %s, 'periodicity', 30, %s) RETURNING id",
        (
            f"PL-{secrets.token_hex(3)}",
            f"Plan TPE-02 {secrets.token_hex(3)}",
            class_id,
            auto_accept,
        ),
    )[0][0]
    instance.sql(
        "INSERT INTO preventive_plan_gamme_step (plan_id, label, sort_order) VALUES (%s, 'Étape', 1)",
        (plan,),
    )
    return machine_id, plan


def test_generation_auto_acceptee_cree_pre_sur_une_classe_qui_ne_permet_que_cur(
    client, admin, instance
):
    machine_id, plan = _plan_sur_classe_cur(client, admin, instance, auto_accept=True)
    try:
        r = client.post("/preventive-occurrences/generate", headers=admin.headers)
        assert r.status_code == 200, r.text
        assert r.json()["data"]["errors"] == []
        assert instance.sql(
            "SELECT type_inter FROM intervention WHERE plan_id = %s AND machine_id = %s",
            (plan, machine_id),
        ) == [("PRE",)]
    finally:
        instance.sql("UPDATE preventive_plan SET active = false WHERE id = %s", (plan,))


def test_acceptation_manuelle_d_une_demande_preventive_garde_pre(client, admin, instance):
    machine_id, plan = _plan_sur_classe_cur(client, admin, instance, auto_accept=False)
    try:
        r = client.post("/preventive-occurrences/generate", headers=admin.headers)
        assert r.status_code == 200, r.text
        di_id = str(
            instance.sql(
                "SELECT di_id FROM preventive_occurrence WHERE plan_id = %s AND machine_id = %s",
                (plan, machine_id),
            )[0][0]
        )
        ok = _accepter(client, admin, di_id, "PRE")
        assert ok.status_code == 200, ok.text
        assert instance.sql(
            "SELECT type_inter FROM intervention WHERE plan_id = %s AND machine_id = %s",
            (plan, machine_id),
        ) == [("PRE",)]
    finally:
        instance.sql("UPDATE preventive_plan SET active = false WHERE id = %s", (plan,))


def test_pre_manuel_sans_plan_reste_refuse(client, admin, instance):
    machine_id = _machine(instance, _classe(client, admin, ["CUR"]))
    assert _creer(client, admin, machine_id, "PRE").status_code == 400
