"""Socle de l'audit centralisé (ADR 0018, AUDC-10) : tests écrits avant le correctif.

Chaque test décrit le comportement voulu par l'ADR 0018. Ceux qui échouent aujourd'hui
portent xfail(strict=True) et la tâche qui les corrigera (AUDC-11 : transaction et ordre
des middlewares, AUDC-13 : middleware d'audit). Le jour du correctif le test passe, le
xfail strict échoue : on retire alors le marqueur.

Échec d'écriture d'audit : un déclencheur (trigger) posé par le propriétaire sur la base
jetable refuse l'insertion dans audit_log pour une entité donnée. Le moyen ne dépend pas
de la façon dont l'audit sera écrit (repo, middleware, fonction SQL)."""

import secrets
from contextlib import contextmanager

import pytest

pytestmark = pytest.mark.integration

PNG_NOM = "demandes.csv"


def _data(resp):
    corps = resp.json()
    return corps.get("data", corps)


@pytest.fixture
def intervention(instance, make_user):
    pilote = make_user("TECH")
    machine_id = instance.sql(
        "INSERT INTO machine (code, name) VALUES (%s, 'Presse socle') RETURNING id",
        (f"SO-{secrets.token_hex(3)}",),
    )[0][0]
    inter_id = instance.sql(
        "INSERT INTO intervention (title, machine_id, type_inter, tech_id, tech_initials) "
        "VALUES ('Titre initial', %s, 'CUR', %s, 'SO') RETURNING id",
        (machine_id, pilote.id),
    )[0][0]
    return str(inter_id)


def _lignes(instance, entity_id):
    return instance.sql(
        "SELECT decision_type, changed_by::text, old_value, new_value FROM audit_log "
        "WHERE entity_id = %s ORDER BY logged_at",
        (entity_id,),
    )


def _titre(instance, intervention):
    return instance.sql("SELECT title FROM intervention WHERE id = %s", (intervention,))[0][0]


# ── Authentification et droits avant le motif (ADR 0018 point 2) ────────────


@pytest.fixture
def demande(instance, client, admin, intervention):
    """Demande d'intervention au statut `nouvelle`, sur la machine de l'intervention."""
    machine_id = instance.sql("SELECT machine_id FROM intervention WHERE id = %s", (intervention,))[
        0
    ][0]
    resp = client.post(
        "/intervention-requests",
        headers=admin.headers,
        json={
            "machine_id": str(machine_id),
            "demandeur_nom": "Atelier",
            "description": "Demande socle",
            "reason_code": "ROUTINE",
        },
    )
    assert resp.status_code == 201, resp.text
    return _data(resp)["id"]


def _historique(instance, demande):
    return instance.sql(
        "SELECT status_to FROM request_status_log WHERE request_id = %s", (demande,)
    )


# status_to est un champ non routinier : sans reason_code, le middleware répond 400
# « motif obligatoire » (avec `audit`) avant toute authentification.
CORPS_SANS_MOTIF = {"status_to": "en_attente"}


def test_mutation_non_authentifiee_sans_motif_renvoie_401(instance, client, demande):
    avant = _historique(instance, demande)
    resp = client.post(f"/intervention-requests/{demande}/transition", json=CORPS_SANS_MOTIF)
    etat = f"code {resp.status_code}, historique {_historique(instance, demande)}"
    assert resp.status_code == 401, etat
    assert _historique(instance, demande) == avant, etat


def test_role_sans_le_droit_sans_motif_renvoie_403(instance, client, make_user, grant, demande):
    tech = make_user("TECH")
    grant("TECH", "POST", "/intervention-requests/{request_id}/transition", allowed=False)
    avant = _historique(instance, demande)
    resp = client.post(
        f"/intervention-requests/{demande}/transition",
        headers=tech.headers,
        json=CORPS_SANS_MOTIF,
    )
    etat = f"code {resp.status_code}, historique {_historique(instance, demande)}"
    assert resp.status_code == 403, etat
    assert _historique(instance, demande) == avant, etat


# ── Suppressions (ADR 0018 point 5) ─────────────────────────────────────────


def test_suppression_sans_motif_demande_le_motif_standard(instance, client, admin, intervention):
    resp = client.delete(f"/interventions/{intervention}", headers=admin.headers)
    existe = instance.sql("SELECT count(*) FROM intervention WHERE id = %s", (intervention,))[0][0]
    etat = f"code {resp.status_code}, intervention présente : {existe}"
    assert resp.status_code == 400, etat
    assert "reason_code" in resp.json()["detail"], etat
    assert "audit" in resp.json(), etat
    assert existe == 1, etat


# Conforme aujourd'hui (test normal) : un DELETE avec motif dans le corps est déjà tracé.
def test_suppression_avec_motif_ecrit_une_ligne_deleted_avec_letat_avant(
    instance, client, admin, intervention
):
    resp = client.request(
        "DELETE",
        f"/interventions/{intervention}",
        headers=admin.headers,
        json={"reason_code": "ROUTINE"},
    )
    lignes = _lignes(instance, intervention)
    etat = f"code {resp.status_code}, lignes d'audit : {[ligne[0] for ligne in lignes]}"
    assert resp.status_code == 200, etat
    assert [ligne[0] for ligne in lignes] == ["deleted"], etat
    assert lignes[0][2]["title"] == "Titre initial", etat
    assert lignes[0][1] == admin.id, etat


# ── Créations (ADR 0018 point 5) ────────────────────────────────────────────


def test_creation_dintervention_ecrit_une_ligne_created_avec_lid_cree(
    instance, client, admin, intervention, demande
):
    machine_id = instance.sql("SELECT machine_id FROM intervention WHERE id = %s", (intervention,))[
        0
    ][0]
    resp = client.post(
        "/interventions",
        headers=admin.headers,
        json={
            "machine_id": str(machine_id),
            "type_inter": "CUR",
            "tech_id": admin.id,
            "title": "Créée par le test",
            "priority": "normale",
            "request_id": demande,
            "reason_code": "ROUTINE",
        },
    )
    assert resp.status_code == 201, resp.text
    cree = _data(resp)["id"]
    lignes = _lignes(instance, cree)
    etat = f"code {resp.status_code}, lignes d'audit : {[ligne[0] for ligne in lignes]}"
    assert [(ligne[0], ligne[1]) for ligne in lignes] == [("created", admin.id)], etat


# ── POST de sous-ressource : pas de bruit (ADR 0018 point 5) ────────────────


@pytest.fixture
def commande(client, admin):
    fournisseur = client.post(
        "/suppliers", headers=admin.headers, json={"name": f"Fourn {secrets.token_hex(3)}"}
    )
    assert fournisseur.status_code in (200, 201), fournisseur.text
    resp = client.post(
        "/supplier-orders",
        headers=admin.headers,
        json={"supplier_id": _data(fournisseur)["id"], "reason_code": "ROUTINE"},
    )
    assert resp.status_code in (200, 201), resp.text
    return _data(resp)["id"]


def test_export_de_commande_nécrit_aucune_ligne_pour_une_colonne_non_modifiee(
    instance, client, admin, commande
):
    avant = len(_lignes(instance, commande))
    resp = client.post(f"/supplier-orders/{commande}/export/csv", headers=admin.headers)
    apres = _lignes(instance, commande)
    etat = f"code {resp.status_code}, lignes ajoutées : {[ligne[0] for ligne in apres[avant:]]}"
    assert resp.status_code == 200, etat
    assert len(apres) == avant, etat


def test_transition_de_demande_ne_trace_que_les_colonnes_modifiees(
    instance, client, admin, intervention
):
    machine_id = instance.sql("SELECT machine_id FROM intervention WHERE id = %s", (intervention,))[
        0
    ][0]
    demande = client.post(
        "/intervention-requests",
        headers=admin.headers,
        json={
            "machine_id": str(machine_id),
            "demandeur_nom": "Atelier",
            "description": "Transition",
            "reason_code": "ROUTINE",
        },
    )
    assert demande.status_code == 201, demande.text
    request_id = _data(demande)["id"]
    colonnes = [
        r[0]
        for r in instance.sql(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'intervention_request'"
        )
    ]
    avant = instance.sql(
        "SELECT to_jsonb(r) FROM intervention_request r WHERE id = %s", (request_id,)
    )[0][0]
    nb_avant = len(_lignes(instance, request_id))
    resp = client.post(
        f"/intervention-requests/{request_id}/transition",
        headers=admin.headers,
        json={"status_to": "en_attente", "reason_code": "ROUTINE"},
    )
    assert resp.status_code == 200, resp.text
    apres = instance.sql(
        "SELECT to_jsonb(r) FROM intervention_request r WHERE id = %s", (request_id,)
    )[0][0]
    modifiees = {c for c in colonnes if avant.get(c) != apres.get(c)}
    inventees = []
    for decision, _par, _old, _new in _lignes(instance, request_id)[nb_avant:]:
        if decision.endswith("_changed"):
            inventees.append(decision.removesuffix("_changed"))
    en_trop = sorted(set(inventees) - modifiees)
    assert not en_trop, f"colonnes tracées sans changement : {en_trop}"


# ── Import CSV (multipart) ──────────────────────────────────────────────────


def test_import_csv_de_demandes_dachat_nest_pas_casse_par_le_middleware(
    client, admin, intervention
):
    """L'aperçu (dry_run) doit répondre 201 avec un rapport : cassé aujourd'hui."""
    contenu = "ref;qte\nVIS-M8;4\n".encode()
    resp = client.post(
        "/purchase-requests/import",
        headers=admin.headers,
        files={"file": (PNG_NOM, contenu, "text/csv")},
        data={
            "intervention_id": intervention,
            "col_ref": "ref",
            "col_qty": "qte",
            "dry_run": "true",
        },
    )
    assert resp.status_code == 201, f"code {resp.status_code} : {resp.text[:200]}"
    assert resp.json()["total"] == 1


# ── Atomicité (ADR 0018 points 1 et 1 bis) ──────────────────────────────────


@contextmanager
def _audit_refuse_pour(instance, entity_id):
    """Trigger sur la base jetable : toute insertion d'audit pour cette entité échoue."""
    nom = f"audc_refuse_{secrets.token_hex(3)}"
    instance.sql(
        f"CREATE FUNCTION {nom}() RETURNS trigger LANGUAGE plpgsql AS "
        "$$ BEGIN RAISE EXCEPTION 'audit refusé par le test'; END $$"
    )
    instance.sql(
        f"CREATE TRIGGER {nom} BEFORE INSERT ON audit_log FOR EACH ROW "
        f"WHEN (NEW.entity_id = '{entity_id}') EXECUTE FUNCTION {nom}()"
    )
    try:
        yield
    finally:
        instance.sql(f"DROP TRIGGER {nom} ON audit_log")
        instance.sql(f"DROP FUNCTION {nom}()")


def test_echec_decriture_de_laudit_annule_la_mutation(instance, client, admin, intervention):
    with _audit_refuse_pour(instance, intervention):
        resp = client.put(
            f"/interventions/{intervention}",
            headers=admin.headers,
            json={"title": "Titre modifié", "reason_code": "ROUTINE"},
        )
    etat = (
        f"code {resp.status_code}, titre {_titre(instance, intervention)!r}, "
        f"{len(_lignes(instance, intervention))} ligne(s) d'audit"
    )
    assert resp.status_code >= 500, etat
    assert _titre(instance, intervention) == "Titre initial", etat


@pytest.fixture
def route_rollback_avale():
    """Monte POST /test-audc/rollback-avale sur l'application réelle, le temps du test.

    La route écrit une machine (commit de repo), puis exécute une requête en erreur dont
    elle avale l'exception après conn.rollback() (schéma des repos), et répond 200.
    Retirée de app.router.routes en fin de test : aucun fichier de production touché.
    """
    from api.app import app
    from api.db import get_connection, release_connection

    def rollback_avale(code: str):
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("INSERT INTO machine (code, name) VALUES (%s, 'Orpheline')", (code,))
            conn.commit()
        finally:
            release_connection(conn)
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 / 0")
        except Exception:
            conn.rollback()
        finally:
            release_connection(conn)
        return {"ok": True}

    app.add_api_route("/test-audc/rollback-avale", rollback_avale, methods=["POST"])
    ajoutee = app.router.routes[-1]
    try:
        yield
    finally:
        app.router.routes.remove(ajoutee)


def test_rollback_de_repo_dans_une_route_2xx_annule_toute_la_requete(
    instance, client, admin, route_rollback_avale
):
    code = f"RB-{secrets.token_hex(3)}"
    resp = client.post(f"/test-audc/rollback-avale?code={code}", headers=admin.headers)
    nb = instance.sql("SELECT count(*) FROM machine WHERE code = %s", (code,))[0][0]
    etat = f"code {resp.status_code}, machine présente : {nb}"
    assert resp.status_code >= 500, etat
    assert nb == 0, etat


def test_transition_de_demande_routiniere_sans_motif(instance, client, admin, intervention):
    """Accepter ou mettre en attente une demande est du travail normal : aucun motif exigé.

    Le seed livrait la règle request.status_to non routinière ; toute nouvelle installation
    demandait un motif à chaque acceptation (constat DEMO-07, aligné sur la production).
    """
    machine_id = instance.sql("SELECT machine_id FROM intervention WHERE id = %s", (intervention,))[
        0
    ][0]
    demande = client.post(
        "/intervention-requests",
        headers=admin.headers,
        json={"machine_id": str(machine_id), "demandeur_nom": "Atelier", "description": "Routine"},
    )
    assert demande.status_code == 201, demande.text
    resp = client.post(
        f"/intervention-requests/{_data(demande)['id']}/transition",
        headers=admin.headers,
        json={"status_to": "en_attente"},
    )
    assert resp.status_code == 200, resp.text
