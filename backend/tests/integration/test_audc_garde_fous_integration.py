"""Garde-fous AUDC-15 : routes à succès partiel exclues, réglage du journal des statuts.

Les deux routes temporairement exclues de la transaction de requête gardent leur
comportement d'avant AUDC-11 (succès partiel). Le réglage du trigger de journal des
statuts est remis à sa valeur après l'instruction concernée.
"""

import secrets
import uuid
from datetime import date

import pytest

pytestmark = pytest.mark.integration


def _creer_classe_et_machines(instance, n=2):
    classe = instance.sql(
        "INSERT INTO equipement_class (code, label) VALUES (%s, 'Classe AUDC-15') RETURNING id",
        (f"CL-{secrets.token_hex(3)}",),
    )[0][0]
    machines = []
    for _ in range(n):
        machines.append(
            instance.sql(
                "INSERT INTO machine (code, name, equipement_class_id) "
                "VALUES (%s, 'Machine AUDC-15', %s) RETURNING id",
                (f"M-{secrets.token_hex(3)}", classe),
            )[0][0]
        )
    return classe, machines


def test_generation_avec_conflit_garde_le_succes_partiel(instance, client, admin):
    """Un conflit d'occurrence sur une machine n'empêche ni la réponse 200 ni l'autre machine."""
    classe, (en_conflit, saine) = _creer_classe_et_machines(instance)
    plan = instance.sql(
        "INSERT INTO preventive_plan (code, label, equipement_class_id, trigger_type, "
        "periodicity_days) VALUES (%s, 'Plan AUDC-15', %s, 'periodicity', 30) RETURNING id",
        (f"PL-{secrets.token_hex(3)}", classe),
    )[0][0]
    # Occurrence au statut hors liste « active » mais à la date du jour : l'INSERT de la
    # génération rencontre la contrainte d'unicité (plan, machine, date) → conflit.
    # Même source de date que la génération (date.today(), heure locale de l'API) et non
    # CURRENT_DATE de la base (UTC) : les deux diffèrent juste après minuit.
    instance.sql(
        "INSERT INTO preventive_occurrence (plan_id, machine_id, scheduled_date, status) "
        "VALUES (%s, %s, %s, 'cancelled')",
        (plan, en_conflit, date.today()),
    )

    resp = client.post("/preventive-occurrences/generate", headers=admin.headers)

    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["generated"] == 1
    assert data["skipped_conflicts"] == 1
    assert data["errors"] == []
    cree = instance.sql(
        "SELECT count(*) FROM preventive_occurrence WHERE plan_id = %s AND machine_id = %s "
        "AND status = 'generated'",
        (plan, saine),
    )[0][0]
    assert cree == 1


def test_import_csv_avec_ligne_fautive_garde_le_succes_partiel(instance, client, admin):
    """Une ligne en erreur SQL (entier hors limites) est rapportée, les autres sont créées.

    Vrai POST multipart sur la vraie route : le middleware d'audit ne réécrit plus le corps
    (AUDC-13), la route jetable de l'étape AUDC-15 n'est plus nécessaire. La réponse de la
    vraie route est 201 (response_model ImportResult).
    """
    suffixe = secrets.token_hex(3)
    csv = (f"ref;qte\nOK1-{suffixe};2\nKO-{suffixe};99999999999\nOK2-{suffixe};3\n").encode()

    resp = client.post(
        "/purchase-requests/import",
        headers=admin.headers,
        files={"file": ("demandes.csv", csv, "text/csv")},
        data={
            "intervention_id": str(uuid.uuid4()),
            "col_ref": "ref",
            "col_qty": "qte",
        },
    )

    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert (body["created"], body["errors"], body["total"]) == (2, 1, 3)
    statuts = {ligne["row"]: ligne["status"] for ligne in body["lines"]}
    assert statuts == {1: "created", 2: "error", 3: "created"}
    for libelle, attendu in ((f"OK1-{suffixe}", 1), (f"KO-{suffixe}", 0), (f"OK2-{suffixe}", 1)):
        n = instance.sql("SELECT count(*) FROM purchase_request WHERE item_label = %s", (libelle,))
        assert n[0][0] == attendu


@pytest.fixture
def monter():
    """Monte des routes de test sur l'application réelle ; les retire en fin de test."""
    from api.app import app

    ajoutees = []

    def _monter(chemin, endpoint, methodes=("POST",)):
        app.add_api_route(chemin, endpoint, methods=list(methodes))
        ajoutees.append(app.router.routes[-1])

    yield _monter
    for route in ajoutees:
        app.router.routes.remove(route)


def test_changement_de_statut_apres_un_passage_qui_regle_le_journal_est_journalise(
    instance, client, admin, monter
):
    """Dans une même requête : transition réelle (pose le réglage), puis UPDATE de statut.

    Aucune route n'enchaîne aujourd'hui les deux : le test monte une route jetable qui
    appelle le vrai dépôt puis modifie le statut. Avec un SET LOCAL qui dure jusqu'à la
    fin de la requête, la seconde ligne du journal manquerait.
    """
    machine = instance.sql(
        "INSERT INTO machine (code, name) VALUES (%s, 'Machine AUDC-15') RETURNING id",
        (f"M-{secrets.token_hex(3)}",),
    )[0][0]
    demande = instance.sql(
        "INSERT INTO intervention_request (machine_id, demandeur_nom, description, code, statut) "
        "VALUES (%s, 'Atelier', 'Test AUDC-15', 'PLACEHOLDER', 'nouvelle') RETURNING id",
        (machine,),
    )[0][0]

    def enchainement():
        from api.db import get_connection, release_connection
        from api.intervention_requests.repo import InterventionRequestRepository

        InterventionRequestRepository().transition_status(
            str(demande),
            "en_attente",
            "Mise en attente",
            admin.id,
            reason_code="ROUTINE",
            audit_user_id=admin.id,
        )
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE intervention_request SET statut = 'rejetee' WHERE id = %s",
                    (str(demande),),
                )
        finally:
            release_connection(conn)
        return {"ok": True}

    monter("/test-audc15/enchainement", enchainement)
    resp = client.post("/test-audc15/enchainement", headers=admin.headers)
    assert resp.status_code == 200, resp.text

    lignes = instance.sql(
        "SELECT status_from, status_to FROM request_status_log WHERE request_id = %s "
        "ORDER BY date, status_to",
        (demande,),
    )
    assert (None, "nouvelle") in lignes
    assert ("nouvelle", "en_attente") in lignes
    assert ("en_attente", "rejetee") in lignes
    assert len(lignes) == 3
