"""Audit : motif validé avant la mutation, erreurs visibles (ADR 0017, AUD-01).

Écrits avant les correctifs AUD-02 à AUD-04, contre lesquels ils échouaient ; ils
gardent le comportement voulu : motif refusé avant la mutation, erreur d'audit visible,
une seule ligne d'audit par champ de tâche."""

import secrets

import psycopg2
import pytest

from tests.integration.test_taches_cloture_integration import _cloturer, _intervention, _tache

pytestmark = pytest.mark.integration


@pytest.fixture
def intervention(instance, make_user):
    pilote = make_user("TECH")
    machine_id = instance.sql(
        "INSERT INTO machine (code, name) VALUES (%s, 'Presse audit') RETURNING id",
        (f"AU-{secrets.token_hex(3)}",),
    )[0][0]
    inter_id = instance.sql(
        "INSERT INTO intervention (title, machine_id, type_inter, tech_id, tech_initials) "
        "VALUES ('Titre initial', %s, 'COR', %s, 'AU') RETURNING id",
        (machine_id, pilote.id),
    )[0][0]
    return str(inter_id)


def _modifier_titre(client, admin, intervention, **motif):
    return client.put(
        f"/interventions/{intervention}",
        headers=admin.headers,
        json={"title": "Titre modifié", **motif},
    )


def _titre(instance, intervention):
    return instance.sql("SELECT title FROM intervention WHERE id = %s", (intervention,))[0][0]


def _nb_audits(instance, entity_id):
    return instance.sql("SELECT count(*) FROM audit_log WHERE entity_id = %s", (entity_id,))[0][0]


def _assert_refuse(instance, resp, intervention):
    etat = (
        f"code {resp.status_code}, titre {_titre(instance, intervention)!r}, "
        f"{_nb_audits(instance, intervention)} ligne(s) d'audit"
    )
    assert resp.status_code == 400, etat
    assert _titre(instance, intervention) == "Titre initial", etat
    assert _nb_audits(instance, intervention) == 0, etat


def test_motif_other_sans_texte_est_refuse_sans_mutation(instance, client, admin, intervention):
    resp = _modifier_titre(client, admin, intervention, reason_code="OTHER")
    _assert_refuse(instance, resp, intervention)


def test_motif_dune_autre_entite_est_refuse_sans_mutation(instance, client, admin, intervention):
    # SUPPLIER_DELAY ne vaut que pour purchase_request
    resp = _modifier_titre(client, admin, intervention, reason_code="SUPPLIER_DELAY")
    _assert_refuse(instance, resp, intervention)


def test_motif_system_envoye_par_un_utilisateur_est_refuse_sans_mutation(
    instance, client, admin, intervention
):
    # PURCHASE_RECEIVED : catégorie system, entité intervention
    resp = _modifier_titre(client, admin, intervention, reason_code="PURCHASE_RECEIVED")
    _assert_refuse(instance, resp, intervention)


def test_fn_audit_log_decision_leve_une_erreur_sur_motif_inconnu(instance, intervention):
    with pytest.raises(psycopg2.Error):
        instance.sql(
            "SELECT fn_audit_log_decision('intervention', %s, 'title_changed', NULL, NULL, "
            "'MOTIF_QUI_N_EXISTE_PAS', NULL, NULL, true)",
            (intervention,),
        )
    assert _nb_audits(instance, intervention) == 0


def test_cloture_de_tache_ecrit_une_seule_ligne_status_changed(client, admin, instance, make_user):
    task_id = _tache(instance, _intervention(client, admin, instance))
    resp = _cloturer(client, make_user("RESP").headers, task_id)
    assert resp.status_code == 200, resp.text
    nb = instance.sql(
        "SELECT count(*) FROM audit_log WHERE entity_id = %s AND decision_type = 'status_changed'",
        (task_id,),
    )[0][0]
    assert nb == 1


def test_mutation_tracee_par_le_seul_middleware_garde_sa_ligne_daudit(
    client, admin, instance, intervention
):
    """Une intervention n'a pas d'audit dans son repo : le middleware reste sa seule source."""
    resp = _modifier_titre(client, admin, intervention, reason_code="CLIENT_REQUEST")
    assert resp.status_code == 200, resp.text
    lignes = instance.sql(
        "SELECT changed_by::text FROM audit_log "
        "WHERE entity_id = %s AND decision_type = 'title_changed'",
        (intervention,),
    )
    assert [r[0] for r in lignes] == [admin.id]


def test_cloture_de_tache_garde_la_ligne_closed_by_changed(client, admin, instance, make_user):
    """closed_by était tracé par le seul middleware : le repo le trace désormais, une fois."""
    task_id = _tache(instance, _intervention(client, admin, instance))
    resp_user = make_user("RESP")
    assert _cloturer(client, resp_user.headers, task_id).status_code == 200
    lignes = instance.sql(
        "SELECT new_value->>'closed_by', changed_by::text FROM audit_log "
        "WHERE entity_id = %s AND decision_type = 'closed_by_changed'",
        (task_id,),
    )
    assert [tuple(r) for r in lignes] == [(resp_user.id, resp_user.id)]
