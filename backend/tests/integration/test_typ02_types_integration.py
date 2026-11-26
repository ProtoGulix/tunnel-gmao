"""Types d'intervention lus en base (TYP-02, ADR 0026) : API, validations, administration."""

import secrets

import psycopg2
import pytest

pytestmark = pytest.mark.integration

RAISON = "ROUTINE"


def _data(r):
    body = r.json()
    return body.get("data", body) if isinstance(body, dict) else body


def _nouveau_type(client, admin, **extra) -> tuple[int, str]:
    code = f"T{secrets.token_hex(3)}".upper()
    r = client.post(
        "/admin/intervention-types",
        headers=admin.headers,
        json={"code": code, "label": f"Type {code}", **extra},
    )
    assert r.status_code == 201, r.text
    return r.json()["id"], code


def _machine(client, admin) -> str:
    r = client.post("/equipements", json={"name": "Presse"}, headers=admin.headers)
    return _data(r)["id"]


def _demande(client, admin, machine_id, **extra) -> object:
    return client.post(
        "/intervention-requests",
        json={
            "machine_id": machine_id,
            "demandeur_nom": "Atelier",
            "description": "Bruit",
            "reason_code": RAISON,
            **extra,
        },
        headers=admin.headers,
    )


def _intervention(client, admin, machine_id, type_inter):
    request_id = _data(_demande(client, admin, machine_id))["id"]
    return client.post(
        "/interventions",
        json={
            "machine_id": machine_id,
            "type_inter": type_inter,
            "tech_id": admin.id,
            "title": "Test",
            "request_id": request_id,
            "reason_code": RAISON,
        },
        headers=admin.headers,
    )


def test_liste_des_types_actifs_avec_description_triee_par_libelle(client, admin, instance):
    r = client.get("/interventions/types", headers=admin.headers)
    assert r.status_code == 200, r.text
    items = _data(r)
    assert {"CUR", "PRE", "PRO"} <= {t["id"] for t in items}
    assert set(items[0]) == {"id", "title", "color", "description", "is_active", "constat_required"}
    titres = [t["title"] for t in items]
    assert titres.index("Batiment") < titres.index("Curatif") < titres.index("Projet")
    assert all(t["is_active"] for t in items)
    cur = next(t for t in items if t["id"] == "CUR")
    assert cur["title"] == "Curatif" and cur["description"]


def test_un_type_inactif_n_apparait_que_sur_demande(client, admin, instance):
    type_id, code = _nouveau_type(client, admin, description="Test")
    client.patch(
        f"/admin/intervention-types/{type_id}/active",
        headers=admin.headers,
        json={"is_active": False},
    )
    actifs = {t["id"] for t in _data(client.get("/interventions/types", headers=admin.headers))}
    tous = _data(client.get("/interventions/types?include_inactive=true", headers=admin.headers))
    assert code not in actifs
    assert next(t for t in tous if t["id"] == code)["is_active"] is False


def test_creation_intervention_type_inconnu_et_inactif_refuses(client, admin, instance):
    machine_id = _machine(client, admin)
    inconnu = _intervention(client, admin, machine_id, "ZZZ")
    assert inconnu.status_code == 400, inconnu.text
    type_id, code = _nouveau_type(client, admin)
    client.patch(
        f"/admin/intervention-types/{type_id}/active",
        headers=admin.headers,
        json={"is_active": False},
    )
    inactif = _intervention(client, admin, machine_id, code)
    assert inactif.status_code == 400 and "désactivé" in inactif.text


def test_type_suggere_par_la_demande_accepte_meme_desactive(client, admin, instance):
    """Décision du 2026-11-20 : une demande garde son type suggéré, même désactivé depuis."""
    machine_id = _machine(client, admin)
    type_id, code = _nouveau_type(client, admin)
    demande = _demande(client, admin, machine_id, suggested_type_inter=code)
    assert demande.status_code in (200, 201), demande.text
    request_id = _data(demande)["id"]
    client.patch(
        f"/admin/intervention-types/{type_id}/active",
        headers=admin.headers,
        json={"is_active": False},
    )
    payload = {
        "machine_id": machine_id,
        "tech_id": admin.id,
        "title": "Test",
        "request_id": request_id,
        "reason_code": RAISON,
    }
    autre_inactif = _nouveau_type(client, admin)
    client.patch(
        f"/admin/intervention-types/{autre_inactif[0]}/active",
        headers=admin.headers,
        json={"is_active": False},
    )
    refuse = client.post(
        "/interventions", json={**payload, "type_inter": autre_inactif[1]}, headers=admin.headers
    )
    assert refuse.status_code == 400 and "désactivé" in refuse.text
    accepte = client.post(
        "/interventions", json={**payload, "type_inter": code}, headers=admin.headers
    )
    assert accepte.status_code == 201, accepte.text
    assert _data(accepte)["type_inter"] == code


def test_modification_du_type_inactif_refusee_sauf_s_il_est_inchange(client, admin, instance):
    machine_id = _machine(client, admin)
    type_id, code = _nouveau_type(client, admin)
    created = _intervention(client, admin, machine_id, code)
    assert created.status_code in (200, 201), created.text
    inter_id = _data(created)["id"]
    client.patch(
        f"/admin/intervention-types/{type_id}/active",
        headers=admin.headers,
        json={"is_active": False},
    )
    corps = {"title": "Renommée", "tech_id": admin.id, "reason_code": RAISON}
    # Inchangé : accepté même si le type est désactivé depuis.
    meme = client.put(
        f"/interventions/{inter_id}",
        json={**corps, "type_inter": code, "machine_id": machine_id},
        headers=admin.headers,
    )
    assert meme.status_code == 200, meme.text
    # Nouvelle valeur inconnue ou inactive : refusée (400 lisible, pas de 500).
    inconnu = client.put(
        f"/interventions/{inter_id}", json={**corps, "type_inter": "ZZZ"}, headers=admin.headers
    )
    assert inconnu.status_code == 400 and "ZZZ" in inconnu.text
    autre_id, autre = _nouveau_type(client, admin)
    client.patch(
        f"/admin/intervention-types/{autre_id}/active",
        headers=admin.headers,
        json={"is_active": False},
    )
    inactif = client.put(
        f"/interventions/{inter_id}", json={**corps, "type_inter": autre}, headers=admin.headers
    )
    assert inactif.status_code == 400, inactif.text
    # Une nouvelle valeur active est acceptée.
    ok = client.put(
        f"/interventions/{inter_id}", json={**corps, "type_inter": "PRE"}, headers=admin.headers
    )
    assert ok.status_code == 200, ok.text


def test_suggested_type_inter_inconnu_ou_inactif_refuse(client, admin, instance):
    machine_id = _machine(client, admin)
    inconnu = _demande(client, admin, machine_id, suggested_type_inter="ZZZ")
    assert inconnu.status_code == 400, inconnu.text
    type_id, code = _nouveau_type(client, admin)
    ok = _demande(client, admin, machine_id, suggested_type_inter=code)
    assert ok.status_code in (200, 201), ok.text
    client.patch(
        f"/admin/intervention-types/{type_id}/active",
        headers=admin.headers,
        json={"is_active": False},
    )
    inactif = _demande(client, admin, machine_id, suggested_type_inter=code)
    assert inactif.status_code == 400 and "désactivé" in inactif.text


def test_filtre_par_type_inconnu_refuse_et_type_inactif_filtrable(client, admin, instance):
    inconnu = client.get("/interventions?type_inter=ZZZ", headers=admin.headers)
    assert inconnu.status_code == 400, inconnu.text
    type_id, code = _nouveau_type(client, admin)
    client.patch(
        f"/admin/intervention-types/{type_id}/active",
        headers=admin.headers,
        json={"is_active": False},
    )
    assert client.get(f"/interventions?type_inter={code}", headers=admin.headers).status_code == 200


def test_dashboard_garde_le_libelle_d_un_type_inactif_utilise(client, admin, instance):
    machine_id = _machine(client, admin)
    type_id, code = _nouveau_type(client, admin)
    assert _intervention(client, admin, machine_id, code).status_code in (200, 201)
    client.patch(
        f"/admin/intervention-types/{type_id}/active",
        headers=admin.headers,
        json={"is_active": False},
    )
    r = client.get(f"/equipements/{machine_id}/dashboard", headers=admin.headers)
    assert r.status_code == 200, r.text
    ligne = next(t for t in _data(r)["by_type"] if t["code"] == code)
    assert ligne["count"] == 1 and ligne["label"] == f"Type {code}"
    assert all(t["code"] is not None for t in _data(r)["by_type"])


def test_admin_modifie_libelle_couleur_description_mais_pas_le_code(client, admin, instance):
    type_id, code = _nouveau_type(client, admin, description="Avant", color="green")
    r = client.patch(
        f"/admin/intervention-types/{type_id}",
        headers=admin.headers,
        json={"code": "AUTRE", "label": "Nouveau", "description": "Après", "color": "red"},
    )
    assert r.status_code == 200, r.text
    ligne = next(
        t
        for t in _data(client.get("/admin/intervention-types", headers=admin.headers))
        if t["id"] == type_id
    )
    assert ligne["code"] == code
    assert (ligne["label"], ligne["description"], ligne["color"]) == ("Nouveau", "Après", "red")
    vide = client.patch(f"/admin/intervention-types/{type_id}", headers=admin.headers, json={})
    assert vide.status_code == 400


def test_admin_code_en_double_refuse_sans_message_brut(client, admin, instance):
    _, code = _nouveau_type(client, admin)
    r = client.post(
        "/admin/intervention-types", headers=admin.headers, json={"code": code, "label": "Bis"}
    )
    assert r.status_code == 409, r.text
    assert "psycopg" not in r.text and "violates" not in r.text


def test_un_type_utilise_ne_se_supprime_pas_en_base(client, admin, instance):
    """La clé étrangère protège un type utilisé ; aucune route de suppression n'existe."""
    machine_id = _machine(client, admin)
    _, code = _nouveau_type(client, admin)
    assert _intervention(client, admin, machine_id, code).status_code in (200, 201)
    with pytest.raises(psycopg2.errors.ForeignKeyViolation):
        instance.sql("DELETE FROM intervention_type WHERE code = %s", (code,))
    assert client.delete("/admin/intervention-types/1", headers=admin.headers).status_code in (
        404,
        405,
    )


@pytest.mark.parametrize(
    ("method", "path", "body"),
    [
        ("POST", "/admin/intervention-types", {"code": "NOPE", "label": "Non"}),
        ("PATCH", "/admin/intervention-types/1", {"label": "Non"}),
        ("PATCH", "/admin/intervention-types/1/active", {"is_active": False}),
    ],
)
def test_ecriture_des_types_refusee_a_un_technicien(client, make_user, method, path, body):
    tech = make_user("TECH")
    r = client.request(method, path, headers=tech.headers, json=body)
    assert r.status_code == 403, r.text
