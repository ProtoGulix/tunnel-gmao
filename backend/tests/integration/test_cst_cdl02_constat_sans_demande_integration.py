"""Demande selon le levier, constat sans demande (CDL-02, ADR 0045)."""

import pytest

from tests.integration.test_cst02_constat_integration import (
    CHOIX_PRE,
    CHOIX_PRO,
    CHOIX_SANS_TYPE,
    _constat,
    _corriger,
    _data,
    _idee,
    _intervention,
)

pytestmark = pytest.mark.integration

CHOIX_RIEN = ["NOTHING", "SIGNAL_NONE", "PART_PLC"]


def _nb_demandes(instance):
    return instance.sql("SELECT count(*) FROM intervention_request")[0][0]


def test_formulaire_expose_les_reglages_de_chaque_choix(client, make_user):
    r = client.get("/constats/questions", headers=make_user("TECH").headers)
    lever = next(q for q in r.json() if q["code"] == "LEVER")
    choix = {c["code"]: c for c in lever["choices"]}
    assert choix["TASK"]["creates_request"] is True and choix["PROJECT"]["creates_request"] is True
    assert choix["TRAINING"]["creates_request"] is False
    assert choix["NOTHING"]["is_exclusive"] is True and choix["NOTHING"]["creates_request"] is False
    assert choix["TASK"]["is_exclusive"] is False


def test_rien_donne_un_constat_sans_demande(client, admin, make_user, instance):
    tech = make_user("TECH")
    intervention_id, _ = _intervention(client, admin)
    avant = _nb_demandes(instance)
    r = _constat(client, tech, intervention_id, CHOIX_RIEN)
    assert r.status_code == 201, r.text
    constat = _data(r)
    assert constat["request_id"] is None and constat["request_status"] is None
    assert constat["suggested_type_inter"] is None and constat["can_correct"] is True
    assert _nb_demandes(instance) == avant
    # Lecture : liste de l'intervention et détail par la liste (pas de route par id)
    liste = client.get(f"/interventions/{intervention_id}/constats", headers=tech.headers).json()
    assert [c["id"] for c in liste] == [constat["id"]]
    assert liste[0]["request_code"] is None and liste[0]["request_status_label"] is None
    assert (
        client.get(f"/constats/by-request/{constat['id']}", headers=tech.headers).status_code == 404
    )


def test_formation_seule_sans_demande_et_tache_reguliere_avec_demande(
    client, admin, make_user, instance
):
    tech = make_user("TECH")
    intervention_id, _ = _intervention(client, admin)
    avant = _nb_demandes(instance)
    formation = _data(_constat(client, tech, intervention_id, CHOIX_SANS_TYPE))
    assert formation["request_id"] is None and _nb_demandes(instance) == avant
    tache = _data(_constat(client, tech, intervention_id, CHOIX_PRE))
    assert tache["request_id"] and tache["suggested_type_inter"] == "PRE"
    assert _nb_demandes(instance) == avant + 1


def test_choix_exclusif_combine_refuse_sans_rien_creer(client, admin, make_user, instance):
    tech = make_user("TECH")
    intervention_id, _ = _intervention(client, admin)
    avant = _nb_demandes(instance)
    r = _constat(
        client, tech, intervention_id, ["NOTHING", "TRAINING", "DOM_ELECTRICAL"] + CHOIX_RIEN[1:]
    )
    assert r.status_code == 400 and "Choix exclusif" in r.text
    assert _nb_demandes(instance) == avant
    assert (
        client.get(f"/interventions/{intervention_id}/constats", headers=tech.headers).json() == []
    )


def test_correction_sans_demande_vers_levier_generateur_cree_la_demande(
    client, admin, make_user, instance
):
    auteur = make_user("TECH")
    intervention_id, _ = _intervention(client, admin)
    ancien = _data(_constat(client, auteur, intervention_id, CHOIX_RIEN))
    avant = _nb_demandes(instance)
    r = _corriger(client, auteur, ancien["id"], CHOIX_PRE)
    assert r.status_code == 201, r.text
    nouveau = _data(r)
    assert nouveau["supersedes_id"] == ancien["id"] and nouveau["request_id"]
    assert nouveau["request_status"] == "nouvelle" and nouveau["suggested_type_inter"] == "PRE"
    assert _nb_demandes(instance) == avant + 1
    ligne = instance.sql(
        "SELECT created_by::text, source_intervention_id::text FROM intervention_request "
        "WHERE id = %s",
        (nouveau["request_id"],),
    )
    assert [tuple(x) for x in ligne] == [(auteur.id, intervention_id)]
    # La création de la demande est tracée comme celle d'un constat
    creation = instance.sql(
        "SELECT count(*) FROM audit_log WHERE entity_id = %s AND decision_type = 'created'",
        (nouveau["request_id"],),
    )
    assert creation[0][0] == 1


def test_correction_sans_demande_vers_levier_sans_demande_n_en_cree_pas(
    client, admin, make_user, instance
):
    tech = make_user("TECH")
    intervention_id, _ = _intervention(client, admin)
    ancien = _data(_constat(client, tech, intervention_id, CHOIX_RIEN))
    avant = _nb_demandes(instance)
    nouveau = _data(_corriger(client, tech, ancien["id"], CHOIX_SANS_TYPE))
    assert nouveau["request_id"] is None and _nb_demandes(instance) == avant


def test_correction_avec_demande_vers_rien_garde_la_demande(client, admin, make_user, instance):
    tech = make_user("TECH")
    intervention_id, _ = _intervention(client, admin)
    ancien = _data(_constat(client, tech, intervention_id, CHOIX_PRE))
    avant = _nb_demandes(instance)
    r = _corriger(client, tech, ancien["id"], CHOIX_RIEN)
    assert r.status_code == 201, r.text
    nouveau = _data(r)
    assert nouveau["request_id"] == ancien["request_id"]
    assert nouveau["request_status"] == "nouvelle" and nouveau["suggested_type_inter"] == "PRE"
    assert _nb_demandes(instance) == avant
    description = instance.sql(
        "SELECT description FROM intervention_request WHERE id = %s", (ancien["request_id"],)
    )[0][0]
    assert "Rien ne l'aurait évité" in description


def test_droits_de_correction_sans_demande(client, admin, make_user, instance):
    auteur, autre, resp = make_user("TECH"), make_user("TECH"), make_user("RESP")
    intervention_id, _ = _intervention(client, admin)
    constat = _data(_constat(client, auteur, intervention_id, CHOIX_RIEN))

    def peut(compte):
        liste = client.get(f"/interventions/{intervention_id}/constats", headers=compte.headers)
        return liste.json()[0]["can_correct"]

    assert peut(auteur) is True and peut(resp) is True and peut(autre) is False
    assert _corriger(client, autre, constat["id"], CHOIX_SANS_TYPE).status_code == 403
    resp_corrige = _corriger(client, resp, constat["id"], CHOIX_SANS_TYPE)
    assert resp_corrige.status_code == 201, resp_corrige.text
    assert _data(resp_corrige)["created_by"] == resp.id

    autre_constat = _data(_constat(client, auteur, intervention_id, CHOIX_RIEN))
    instance.sql("UPDATE intervention SET printed_fiche = true WHERE id = %s", (intervention_id,))
    assert _corriger(client, auteur, autre_constat["id"], CHOIX_PRE).status_code == 400
    liste = client.get(f"/interventions/{intervention_id}/constats", headers=auteur.headers).json()
    assert all(c["can_correct"] is False for c in liste)


def test_rattachement_refuse_sans_demande(client, admin, make_user):
    resp = make_user("RESP")
    intervention_id, machine_id = _intervention(client, admin)
    constat = _data(_constat(client, make_user("TECH"), intervention_id, CHOIX_RIEN))
    idee = _idee(client, admin, machine_id)
    r = client.post(
        f"/constats/{constat['id']}/link", json={"request_id": idee}, headers=resp.headers
    )
    assert r.status_code == 400 and "sans demande" in r.text
    # Les idées restent listées pour ce constat, sans erreur
    ideas = client.get(f"/constats/{constat['id']}/improvement-ideas", headers=resp.headers)
    assert ideas.status_code == 200 and [i["id"] for i in ideas.json()] == [idee]
    # Rien n'a été rattaché
    # Un constat avec demande reste rattachable
    avec = _data(_constat(client, make_user("TECH"), intervention_id, CHOIX_PRO))
    ok = client.post(
        f"/constats/{avec['id']}/link", json={"request_id": idee}, headers=resp.headers
    )
    assert ok.status_code == 200, ok.text
