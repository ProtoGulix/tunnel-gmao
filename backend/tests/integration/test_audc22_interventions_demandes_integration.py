"""Interventions et demandes sous l'audit centralisé (AUDC-22, ADR 0018 et 0019).

Une intervention vient toujours d'une demande ; la supprimer oblige à choisir l'issue de la
demande (`request_outcome` = reopen | delete) ; fermer une intervention est tout ou rien
avec sa cascade.
"""

import contextlib
import secrets

import pytest

from tests.integration.etape2_helpers import (
    MOTIF,
    demande,
    intervention_liee,
    lignes_audit,
    machine,
)

pytestmark = pytest.mark.integration

# Événements de la demande à sa création puis à son acceptation par POST /interventions.
_ACCEPTATION = ("created", "statut_changed", "intervention_id_changed")

CORPS_SUPPRESSION = {"reason_code": MOTIF}


def _supprimer(client, admin, intervention_id, issue=None):
    params = {"request_outcome": issue} if issue else None
    return client.request(
        "DELETE",
        f"/interventions/{intervention_id}",
        headers=admin.headers,
        params=params,
        json=CORPS_SUPPRESSION,
    )


def _intervention_existe(instance, intervention_id) -> bool:
    return bool(instance.sql("SELECT 1 FROM intervention WHERE id = %s", (intervention_id,)))


def _demande(instance, request_id):
    """(statut, intervention_id) de la demande, ou None si elle n'existe plus."""
    rows = instance.sql(
        "SELECT statut, intervention_id::text FROM intervention_request WHERE id = %s",
        (request_id,),
    )
    return rows[0] if rows else None


def _nb_status_log(instance, request_id) -> int:
    return instance.sql(
        "SELECT count(*) FROM request_status_log WHERE request_id = %s", (request_id,)
    )[0][0]


@contextlib.contextmanager
def _panne(instance, operation: str, condition: str = "TRUE"):
    """Fait échouer toute écriture `operation` (UPDATE ou DELETE) sur intervention_request."""
    nom = f"it_panne_{secrets.token_hex(3)}"
    instance.sql(
        f"CREATE FUNCTION {nom}() RETURNS trigger LANGUAGE plpgsql AS $$ "
        "BEGIN RAISE EXCEPTION 'panne simulée' USING ERRCODE = 'XX000'; END $$"
    )
    instance.sql(
        f"CREATE TRIGGER {nom} BEFORE {operation} ON intervention_request "
        f"FOR EACH ROW WHEN ({condition}) EXECUTE FUNCTION {nom}()"
    )
    try:
        yield
    finally:
        instance.sql(f"DROP TRIGGER IF EXISTS {nom} ON intervention_request")
        instance.sql(f"DROP FUNCTION IF EXISTS {nom}()")


# ── Création : la demande est obligatoire ───────────────────────────────────


def test_creer_une_intervention_sans_request_id_est_refuse_et_rien_n_est_ecrit(
    client, admin, instance
):
    titre = f"Sans demande {secrets.token_hex(3)}"
    resp = client.post(
        "/interventions",
        headers=admin.headers,
        json={
            "machine_id": machine(instance),
            "type_inter": "CUR",
            "tech_id": admin.id,
            "title": titre,
            "priority": "normal",
            "reason_code": MOTIF,
        },
    )
    assert resp.status_code in (400, 422), resp.text
    assert instance.sql("SELECT count(*) FROM intervention WHERE title = %s", (titre,))[0][0] == 0


# ── Suppression : issue de la demande obligatoire ───────────────────────────


def test_supprimer_une_intervention_liee_sans_issue_est_refuse_et_rien_n_est_ecrit(
    client, admin, instance
):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    avant = _nb_status_log(instance, request_id)
    resp = _supprimer(client, admin, intervention_id)
    assert resp.status_code == 400, f"{resp.status_code} : {resp.text}"
    assert _intervention_existe(instance, intervention_id)
    assert _demande(instance, request_id) == ("acceptee", intervention_id)
    assert _nb_status_log(instance, request_id) == avant
    assert [ligne[1] for ligne in lignes_audit(instance, intervention_id)] == ["created"]


def test_une_issue_inconnue_est_refusee_et_rien_n_est_ecrit(client, admin, instance):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    resp = _supprimer(client, admin, intervention_id, issue="archiver")
    assert resp.status_code in (400, 422), f"{resp.status_code} : {resp.text}"
    assert _intervention_existe(instance, intervention_id)
    assert _demande(instance, request_id) == ("acceptee", intervention_id)


def test_issue_rouvrir_supprime_l_intervention_et_remet_la_demande_a_nouvelle_sans_lien(
    client, admin, instance
):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    avant = _nb_status_log(instance, request_id)
    resp = _supprimer(client, admin, intervention_id, issue="reopen")
    assert resp.status_code == 200, f"{resp.status_code} : {resp.text}"
    assert not _intervention_existe(instance, intervention_id)
    assert _demande(instance, request_id) == ("nouvelle", None)
    transitions = instance.sql(
        "SELECT status_from, status_to FROM request_status_log WHERE request_id = %s "
        "ORDER BY date DESC LIMIT 1",
        (request_id,),
    )
    assert transitions == [("acceptee", "nouvelle")]
    assert _nb_status_log(instance, request_id) == avant + 1
    auteur = instance.sql(
        "SELECT changed_by::text FROM request_status_log WHERE request_id = %s "
        "AND status_to = 'nouvelle' AND status_from = 'acceptee'",
        (request_id,),
    )
    assert auteur == [(str(admin.id),)]


def test_issue_rouvrir_ecrit_deleted_pour_l_intervention_et_un_evenement_pour_la_demande(
    client, admin, instance
):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    resp = _supprimer(client, admin, intervention_id, issue="reopen")
    assert resp.status_code == 200, f"{resp.status_code} : {resp.text}"
    supprimee = [
        ligne for ligne in lignes_audit(instance, intervention_id) if ligne[1] == "deleted"
    ]
    assert supprimee == [("intervention", "deleted", MOTIF, False, admin.id)]
    # La demande n'est pas supprimée : un événement d'audit (pas « deleted ») avec le même motif.
    # Hors création et acceptation (statut_changed, intervention_id_changed : AUDC-22c).
    evenements = [
        ligne for ligne in lignes_audit(instance, request_id) if ligne[1] not in _ACCEPTATION
    ]
    assert len(evenements) == 1, evenements
    entite, decision, motif, systeme, auteur = evenements[0]
    assert (entite, motif, systeme, auteur) == ("request", MOTIF, False, admin.id)
    assert decision != "deleted"


def test_issue_cascade_supprime_l_intervention_et_la_demande_avec_deux_lignes_deleted(
    client, admin, instance
):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    resp = _supprimer(client, admin, intervention_id, issue="delete")
    assert resp.status_code == 200, f"{resp.status_code} : {resp.text}"
    assert not _intervention_existe(instance, intervention_id)
    assert _demande(instance, request_id) is None
    assert [
        ligne for ligne in lignes_audit(instance, intervention_id) if ligne[1] == "deleted"
    ] == [("intervention", "deleted", MOTIF, False, admin.id)]
    assert [ligne for ligne in lignes_audit(instance, request_id) if ligne[1] == "deleted"] == [
        ("request", "deleted", MOTIF, False, admin.id)
    ]


def test_issue_cascade_qui_echoue_sur_la_demande_annule_aussi_la_suppression_de_l_intervention(
    client, admin, instance
):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    with _panne(instance, "DELETE"):
        resp = _supprimer(client, admin, intervention_id, issue="delete")
    assert resp.status_code >= 400, f"{resp.status_code} : {resp.text}"
    assert _intervention_existe(instance, intervention_id)
    assert _demande(instance, request_id) == ("acceptee", intervention_id)
    assert [
        ligne for ligne in lignes_audit(instance, intervention_id) if ligne[1] == "deleted"
    ] == []


def test_issue_rouvrir_qui_echoue_sur_la_demande_annule_aussi_la_suppression_de_l_intervention(
    client, admin, instance
):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    with _panne(instance, "UPDATE"):
        resp = _supprimer(client, admin, intervention_id, issue="reopen")
    assert resp.status_code >= 400, f"{resp.status_code} : {resp.text}"
    assert _intervention_existe(instance, intervention_id)
    assert _demande(instance, request_id) == ("acceptee", intervention_id)


def test_intervention_ancienne_sans_demande_se_supprime_sans_issue(client, admin, instance):
    """Données d'avant la séparation (ADR 0019 point 3) : aucune issue à choisir."""
    pilote = admin.id
    intervention_id = str(
        instance.sql(
            "INSERT INTO intervention (title, machine_id, type_inter, tech_id, tech_initials) "
            "VALUES ('Ancienne', %s, 'CUR', %s, 'AN') RETURNING id",
            (machine(instance), pilote),
        )[0][0]
    )
    resp = _supprimer(client, admin, intervention_id)
    assert resp.status_code == 200, f"{resp.status_code} : {resp.text}"
    assert not _intervention_existe(instance, intervention_id)
    assert [ligne[1] for ligne in lignes_audit(instance, intervention_id)] == ["deleted"]


# ── Fermeture : tout ou rien avec la cascade ────────────────────────────────


def test_fermer_une_intervention_cloture_la_demande_liee(client, admin, instance):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    resp = _fermer(client, admin, intervention_id)
    assert resp.status_code == 200, resp.text
    assert _demande(instance, request_id)[0] == "cloturee"


def _fermer(client, admin, intervention_id):
    """Fermeture par la seule porte, PUT /interventions/{id} (ADR 0027)."""
    return client.put(
        f"/interventions/{intervention_id}",
        headers=admin.headers,
        json={"status_actual": "ferme", "reason_code": MOTIF},
    )


def test_fermeture_dont_la_cascade_echoue_est_annulee_et_l_intervention_reste_ouverte(
    client, admin, instance
):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    with _panne(instance, "UPDATE", condition="NEW.statut = 'cloturee'"):
        resp = _fermer(client, admin, intervention_id)
    statut = instance.sql(
        "SELECT status_actual FROM intervention WHERE id = %s", (intervention_id,)
    )
    assert resp.status_code >= 500, f"{resp.status_code} : {resp.text}"
    assert statut == [("ouvert",)]
    assert _demande(instance, request_id)[0] == "acceptee"


def test_la_cascade_de_fermeture_ecrit_un_evenement_du_systeme_au_nom_du_jeton(
    client, admin, instance
):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    assert _fermer(client, admin, intervention_id).status_code == 200
    cascade = [
        ligne for ligne in lignes_audit(instance, request_id) if ligne[1] not in _ACCEPTATION
    ]
    assert len(cascade) == 1, cascade
    entite, _decision, motif, systeme, auteur = cascade[0]
    assert (entite, motif, systeme, auteur) == ("request", "SYSTEM_CASCADE", True, admin.id)


def test_une_demande_creee_directement_reste_nouvelle_sans_intervention(client, admin, instance):
    request_id = demande(client, admin, machine(instance))
    assert _demande(instance, request_id) == ("nouvelle", None)


# ── Acceptation d'une demande par transition ────────────────────────────────


def test_accepter_une_demande_par_transition_cree_l_intervention_liee(client, admin, instance):
    """Régression : la transition vers « acceptee » répondait 500 (machine_id absent de la demande lue)."""
    machine_id = machine(instance)
    request_id = demande(client, admin, machine_id)
    resp = client.post(
        f"/intervention-requests/{request_id}/transition",
        headers=admin.headers,
        json={
            "status_to": "acceptee",
            "type_inter": "CUR",
            "tech_id": admin.id,
            "tech_initials": "AD",
            "reason_code": MOTIF,
        },
    )
    assert resp.status_code == 200, f"{resp.status_code} : {resp.text}"
    statut, intervention_id = _demande(instance, request_id)
    assert statut == "acceptee"
    assert intervention_id is not None
    assert _intervention_existe(instance, intervention_id)
