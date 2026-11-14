"""Middleware d'audit sur le socle (ADR 0018, AUDC-13) : routes déclarées et événements.

Les routes de test sont montées sur l'application réelle le temps du test (add_api_route),
avec une vraie déclaration d'audit : le middleware, la transaction et la base sont les vrais.
"""

import secrets

import pytest
from fastapi import HTTPException, Request

from api.audits.declaration import audit, declare_created_id
from api.audits.events import record_audit_event
from api.db import get_connection, release_connection

pytestmark = pytest.mark.integration

DECLARATION = audit("intervention", id_from_path="intervention_id", table="intervention")


@pytest.fixture
def monter():
    """Monte une route déclarée sur l'application réelle ; la retire en fin de test."""
    from api.app import app

    ajoutees = []

    def _monter(chemin, endpoint, methodes=("POST",), declaration=DECLARATION):
        app.add_api_route(chemin, endpoint, methods=list(methodes), dependencies=[declaration])
        ajoutees.append(app.router.routes[-1])

    yield _monter
    for route in ajoutees:
        app.router.routes.remove(route)


@pytest.fixture
def intervention(instance, make_user):
    pilote = make_user("TECH")
    machine_id = instance.sql(
        "INSERT INTO machine (code, name) VALUES (%s, 'Presse middleware') RETURNING id",
        (f"MW-{secrets.token_hex(3)}",),
    )[0][0]
    return str(
        instance.sql(
            "INSERT INTO intervention (title, machine_id, type_inter, tech_id, tech_initials) "
            "VALUES ('Titre initial', %s, 'CUR', %s, 'MW') RETURNING id",
            (machine_id, pilote.id),
        )[0][0]
    )


def _lignes(instance, entity_id):
    return instance.sql(
        "SELECT l.decision_type, l.changed_by::text, l.is_system, r.code, l.old_value, l.new_value "
        "FROM audit_log l JOIN audit_reason_code r ON r.id = l.reason_code_id "
        "WHERE l.entity_id = %s ORDER BY l.logged_at",
        (entity_id,),
    )


# ── Événements d'audit déposés par un repo ──────────────────────────────────


def test_un_evenement_depose_est_ecrit_avec_le_motif_de_la_requete_et_l_auteur_du_jeton(
    instance, client, admin, intervention, monter
):
    def depose(intervention_id: str):
        record_audit_event("intervention", intervention_id, "evenement_test", {"a": 1}, {"a": 2})
        return {"ok": True}

    monter("/test-audc13/{intervention_id}/evenement", depose)
    resp = client.post(
        f"/test-audc13/{intervention}/evenement",
        headers=admin.headers,
        json={"reason_code": "ROUTINE"},
    )
    assert resp.status_code == 200, resp.text
    assert _lignes(instance, intervention) == [
        ("evenement_test", admin.id, False, "ROUTINE", {"a": 1}, {"a": 2})
    ]


def test_un_evenement_du_systeme_est_ecrit_avec_un_motif_system(
    instance, client, admin, intervention, monter
):
    def depose(intervention_id: str):
        record_audit_event(
            "intervention",
            intervention_id,
            "auto_test",
            new_value={"x": 1},
            is_system=True,
            reason_code="PURCHASE_RECEIVED",
        )

    monter("/test-audc13/{intervention_id}/systeme", depose)
    resp = client.post(
        f"/test-audc13/{intervention}/systeme",
        headers=admin.headers,
        json={"reason_code": "ROUTINE"},
    )
    assert resp.status_code == 200, resp.text
    assert _lignes(instance, intervention) == [
        ("auto_test", admin.id, True, "PURCHASE_RECEIVED", None, {"x": 1})
    ]


def test_un_evenement_n_est_pas_ecrit_si_la_route_echoue(
    instance, client, admin, intervention, monter
):
    def depose_puis_echoue(intervention_id: str):
        record_audit_event("intervention", intervention_id, "perdu", {"a": 1}, {"a": 2})
        raise HTTPException(status_code=409, detail="conflit")

    monter("/test-audc13/{intervention_id}/echec", depose_puis_echoue)
    resp = client.post(
        f"/test-audc13/{intervention}/echec", headers=admin.headers, json={"reason_code": "ROUTINE"}
    )
    assert resp.status_code == 409, resp.text
    assert _lignes(instance, intervention) == []


# ── Routes déclarées : suppression, sous-ressource, création ────────────────


def test_suppression_sans_motif_est_refusee_meme_si_la_regle_de_l_entite_est_routiniere(
    instance, client, admin, intervention
):
    resp = client.delete(f"/interventions/{intervention}", headers=admin.headers)
    corps = resp.json()
    etat = f"code {resp.status_code} : {corps}"
    assert resp.status_code == 400, etat
    # Jamais d'envoi silencieux pour une suppression : le sélecteur de motifs est proposé.
    assert corps["audit"]["silent"] is False, etat
    assert corps["audit"]["reasons"], etat


def test_suppression_avec_motif_inconnu_est_refusee_avant_la_route(
    instance, client, admin, intervention
):
    resp = client.request(
        "DELETE",
        f"/interventions/{intervention}",
        headers=admin.headers,
        json={"reason_code": "MOTIF_INEXISTANT"},
    )
    existe = instance.sql("SELECT count(*) FROM intervention WHERE id = %s", (intervention,))[0][0]
    assert resp.status_code == 400, resp.text
    assert existe == 1


def test_post_de_sous_ressource_declare_sans_changement_n_ecrit_aucune_ligne(
    instance, client, admin, intervention, monter
):
    monter("/test-audc13/{intervention_id}/lecture", lambda intervention_id: {"ok": True})
    resp = client.post(f"/test-audc13/{intervention}/lecture", headers=admin.headers)
    assert resp.status_code == 200, resp.text
    assert _lignes(instance, intervention) == []


def test_post_de_sous_ressource_declare_ne_trace_que_le_champ_modifie(
    instance, client, admin, intervention, monter
):
    def renomme(intervention_id: str):
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE intervention SET title = 'Titre modifié' WHERE id = %s",
                    (intervention_id,),
                )
        finally:
            release_connection(conn)
        return {"ok": True}

    monter("/test-audc13/{intervention_id}/renomme", renomme)
    resp = client.post(f"/test-audc13/{intervention}/renomme", headers=admin.headers)
    assert resp.status_code == 200, resp.text
    lignes = _lignes(instance, intervention)
    assert [(ligne[0], ligne[1], ligne[3]) for ligne in lignes] == [
        ("title_changed", admin.id, "ROUTINE")
    ]
    assert lignes[0][4] == {"title": "Titre initial"}
    assert lignes[0][5] == {"title": "Titre modifié"}


def _insere_machine(code: str):
    """Crée une machine dans la transaction de la requête, retourne son id."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO machine (code, name) VALUES (%s, 'Créée par test') RETURNING id",
                (code,),
            )
            return cur.fetchone()[0]
    finally:
        release_connection(conn)


# L'équipement (table machine) a son propre motif : ROUTINE ne s'applique pas à lui.
CREATION = audit("equipement", id_from_created=True, table="machine")
CORPS_EQUIPEMENT = {"reason_code": "EQUIPMENT_UPDATE"}


def test_route_de_creation_declaree_sans_id_depose_annule_la_requete(
    instance, client, admin, monter
):
    """Une création validée sans trace est pire qu'une erreur : la requête est annulée."""
    code = f"OUB-{secrets.token_hex(3)}"

    def cree_sans_declarer(request: Request):
        _insere_machine(code)
        return {"ok": True}

    monter("/test-audc13/creation-oubliee", cree_sans_declarer, declaration=CREATION)
    resp = client.post(
        "/test-audc13/creation-oubliee", headers=admin.headers, json=CORPS_EQUIPEMENT
    )
    nb = instance.sql("SELECT count(*) FROM machine WHERE code = %s", (code,))[0][0]
    assert resp.status_code >= 500, resp.text
    assert nb == 0


def test_route_de_creation_declaree_ecrit_created_avec_l_etat_apres(
    instance, client, admin, monter
):
    code = f"CRE-{secrets.token_hex(3)}"
    cree = {}

    def cree_et_declare(request: Request):
        cree["id"] = _insere_machine(code)
        declare_created_id(request, cree["id"])
        return {"ok": True}

    monter("/test-audc13/creation", cree_et_declare, declaration=CREATION)
    resp = client.post("/test-audc13/creation", headers=admin.headers, json=CORPS_EQUIPEMENT)
    assert resp.status_code == 200, resp.text
    lignes = _lignes(instance, str(cree["id"]))
    assert [(ligne[0], ligne[1]) for ligne in lignes] == [("created", admin.id)]
    assert lignes[0][5]["code"] == code
    assert lignes[0][4] is None


# ── Corps de requête jamais réécrit ─────────────────────────────────────────


def test_le_motif_routinier_injecte_ne_reecrit_pas_le_corps(
    instance, client, admin, intervention, monter
):
    """Sans reason_code, la route reçoit exactement les octets envoyés."""
    recu = {}

    async def echo(intervention_id: str, request: Request):
        recu["corps"] = await request.body()
        return {"ok": True}

    monter("/test-audc13/{intervention_id}/echo", echo)
    envoye = b'{"title": "x"}'
    resp = client.post(
        f"/test-audc13/{intervention}/echo",
        headers={**admin.headers, "Content-Type": "application/json"},
        content=envoye,
    )
    assert resp.status_code == 200, resp.text
    assert recu["corps"] == envoye
