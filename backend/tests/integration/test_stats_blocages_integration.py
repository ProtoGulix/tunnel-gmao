"""Interventions bloquées sur vraie base (ADT-03, ADR 0047).

Chaque test travaille dans un site neuf : le filtre `site_id` isole le jeu. Les dates du journal
sont posées par SQL, relatives à l'heure locale de la session (comme le calcul de l'API).
"""

import itertools
import secrets

import pytest

from api.limiter import limiter
from api.settings import settings
from tests.integration.test_stats_demandes_integration import _equipement

pytestmark = pytest.mark.integration

URL = "/stats/blocages"
_COMPTEUR = itertools.count()
_CREEES = []


@pytest.fixture(autouse=True, scope="module")
def _nettoyage(instance):
    """Retire les interventions du module : des dates de journal reculées fausseraient les
    comptes d'état courant des autres tests de la base jetable."""
    yield
    for iid in _CREEES:
        instance.sql("DELETE FROM intervention_status_log WHERE intervention_id = %s", (iid,))
        instance.sql(
            "DELETE FROM intervention_action_purchase_request WHERE intervention_action_id "
            "IN (SELECT id FROM intervention_action WHERE intervention_id = %s)",
            (iid,),
        )
        instance.sql("DELETE FROM intervention_action WHERE intervention_id = %s", (iid,))
        instance.sql("DELETE FROM intervention WHERE id = %s", (iid,))


@pytest.fixture(autouse=True)
def _sans_limiteur(monkeypatch):
    monkeypatch.setattr(limiter, "enabled", False)


def _intervention(instance, machine_id, statut, ago, priorite="normal", note=None, journal=True):
    """Intervention passée à `statut` il y a `ago` (expression d'intervalle SQL).

    La ligne du journal est écrite par le déclencheur (note système), puis datée ; `note`
    la remplace par une note humaine. Sans `journal`, la ligne est supprimée : repli sur
    `reported_date`, posée à la même date.
    """
    initiales = f"B{next(_COMPTEUR)}"
    iid = instance.sql(
        "INSERT INTO intervention (title, machine_id, type_inter, tech_initials, priority, "
        "reported_date) VALUES ('Essai ADT', %s, 'CUR', %s, %s, "
        "(localtimestamp - %s::interval)::date) RETURNING id::text",
        (machine_id, initiales, priorite, ago),
    )[0][0]
    _CREEES.append(iid)
    instance.sql("UPDATE intervention SET status_actual = %s WHERE id = %s", (statut, iid))
    if journal:
        instance.sql(
            "UPDATE intervention_status_log SET date = localtimestamp - %s::interval, "
            "notes = COALESCE(%s, notes) WHERE intervention_id = %s AND status_to = %s",
            (ago, note, iid, statut),
        )
    else:
        instance.sql("DELETE FROM intervention_status_log WHERE intervention_id = %s", (iid,))
    return iid


def _blocages(client, admin, **params):
    r = client.get(URL, params=params, headers=admin.headers)
    assert r.status_code == 200, r.text
    return r.json()


def _site(client, admin):
    site = _equipement(client, admin)
    return site, _equipement(client, admin, site)


def test_seuil_renvoye_et_borne_incluse(client, admin, instance):
    site, machine = _site(client, admin)
    n = settings.BLOCKED_ALERT_DAYS
    juste = _intervention(instance, machine, "attente_prod", f"{n} days")
    _intervention(instance, machine, "attente_prod", f"{n - 1} days 23 hours")
    data = _blocages(client, admin, site_id=site)
    assert data["threshold_days"] == n
    assert [i["id"] for i in data["production"]] == [juste]
    assert data["production"][0]["days_in_status"] == n
    assert data["parts"] == []


def test_groupes_par_statut_et_autres_statuts_exclus(client, admin, instance):
    site, machine = _site(client, admin)
    p = _intervention(instance, machine, "attente_pieces", "30 days")
    q = _intervention(instance, machine, "attente_prod", "30 days")
    _intervention(instance, machine, "ouvert", "30 days")
    _intervention(instance, machine, "ferme", "30 days")
    data = _blocages(client, admin, site_id=site)
    assert [i["id"] for i in data["parts"]] == [p]
    assert [i["id"] for i in data["production"]] == [q]
    # Chaque groupe ne porte que sa cause
    assert data["parts"][0]["purchase_requests"] is not None and data["parts"][0]["note"] is None
    assert data["production"][0]["purchase_requests"] is None


def test_repli_sur_reported_date_sans_journal(client, admin, instance):
    site, machine = _site(client, admin)
    iid = _intervention(instance, machine, "attente_prod", "20 days", journal=False)
    (item,) = _blocages(client, admin, site_id=site)["production"]
    assert item["id"] == iid and item["days_in_status"] in (19, 20)
    assert item["note"] is None


def test_derniere_ligne_vers_le_statut_courant(client, admin, instance):
    site, machine = _site(client, admin)
    iid = _intervention(instance, machine, "attente_prod", "30 days")
    # Retour à ouvert puis nouvel arrêt récent : la durée repart de la dernière entrée
    instance.sql("UPDATE intervention SET status_actual = 'ouvert' WHERE id = %s", (iid,))
    instance.sql("UPDATE intervention SET status_actual = 'attente_prod' WHERE id = %s", (iid,))
    assert _blocages(client, admin, site_id=site)["production"] == []
    instance.sql(
        "UPDATE intervention_status_log SET date = localtimestamp - interval '10 days' "
        "WHERE intervention_id = %s AND status_to = 'attente_prod' AND status_from = 'ouvert'",
        (iid,),
    )
    (item,) = _blocages(client, admin, site_id=site)["production"]
    assert item["days_in_status"] == 10


def test_note_systeme_exclue_note_humaine_gardee(client, admin, instance):
    site, machine = _site(client, admin)
    systeme = _intervention(instance, machine, "attente_prod", "9 days")
    humaine = _intervention(instance, machine, "attente_prod", "8 days", note="Atelier arrêté")
    notes = {i["id"]: i["note"] for i in _blocages(client, admin, site_id=site)["production"]}
    assert notes == {systeme: None, humaine: "Atelier arrêté"}


def test_tri_urgent_puis_duree_decroissante(client, admin, instance):
    site, machine = _site(client, admin)
    vieille = _intervention(instance, machine, "attente_prod", "40 days", "normal")
    urgent_court = _intervention(instance, machine, "attente_prod", "9 days", "urgent")
    urgent_long = _intervention(instance, machine, "attente_prod", "15 days", "urgent")
    milieu = _intervention(instance, machine, "attente_prod", "20 days", "important")
    ordre = [i["id"] for i in _blocages(client, admin, site_id=site)["production"]]
    assert ordre == [urgent_long, urgent_court, vieille, milieu]


def test_compteurs_de_demandes_d_achat(client, admin, instance):
    site, machine = _site(client, admin)
    iid = _intervention(instance, machine, "attente_pieces", "12 days")
    sans = _intervention(instance, machine, "attente_pieces", "11 days")
    action = instance.sql(
        "INSERT INTO intervention_action (intervention_id, description, time_spent) "
        "VALUES (%s, 'Essai', 0.5) RETURNING id::text",
        (iid,),
    )[0][0]
    for libelle in ("a", "b"):
        pr = instance.sql(
            "INSERT INTO purchase_request (item_label, quantity, code) "
            "VALUES (%s, 1, %s) RETURNING id::text",
            (libelle, f"DA-{secrets.token_hex(3)}"),
        )[0][0]
        instance.sql(
            "INSERT INTO intervention_action_purchase_request "
            "(intervention_action_id, purchase_request_id) VALUES (%s, %s)",
            (action, pr),
        )
    par_id = {i["id"]: i for i in _blocages(client, admin, site_id=site)["parts"]}
    compteurs = par_id[iid]["purchase_requests"]
    assert compteurs["total"] == 2 and compteurs["to_qualify"] == 2
    assert all(v == 0 for k, v in compteurs.items() if k not in ("total", "to_qualify"))
    assert par_id[sans]["purchase_requests"]["total"] == 0


def test_filtre_de_site_descendants_compris(client, admin, instance):
    site, machine = _site(client, admin)
    autre_site, autre_machine = _site(client, admin)
    a = _intervention(instance, machine, "attente_prod", "10 days")
    b = _intervention(instance, autre_machine, "attente_prod", "10 days")
    assert [i["id"] for i in _blocages(client, admin, site_id=site)["production"]] == [a]
    assert [i["id"] for i in _blocages(client, admin, site_id=autre_site)["production"]] == [b]
    ids = {i["id"] for i in _blocages(client, admin)["production"]}
    assert {a, b} <= ids
    (item,) = _blocages(client, admin, site_id=site)["production"]
    assert item["equipement"]["id"] == machine


def test_erreur_site_invalide_sans_message_sql(client, admin):
    r = client.get(URL, params={"site_id": "pas-un-uuid"}, headers=admin.headers)
    assert r.status_code == 400
    assert "psycopg2" not in r.text and "SELECT" not in r.text


def test_aucune_donnee_par_personne(client, admin, instance):
    site, machine = _site(client, admin)
    _intervention(instance, machine, "attente_prod", "10 days")
    texte = client.get(URL, params={"site_id": site}, headers=admin.headers).text
    for mot in ("tech", "updated_by", "changed_by", "author", admin.id):
        assert mot not in texte


def test_droits_par_role(client, admin, make_user, grant, instance):
    for role in ("TECH", "RESP", "ACHETEUR"):
        assert client.get(URL, headers=make_user(role).headers).status_code == 200, role
    code = instance.sql(
        "SELECT code FROM tunnel_endpoint WHERE method = 'GET' AND path = '/stats/blocages'"
    )
    assert code == [("stats:get_blocages",)]
    tech = make_user("TECH")
    grant("TECH", "GET", "/stats/blocages", allowed=False)
    assert client.get(URL, headers=tech.headers).status_code == 403


def test_lisible_par_une_cle_mcp(client, admin):
    cle = client.post(
        "/api-keys", headers=admin.headers, json={"name": f"it-{secrets.token_hex(3)}"}
    )
    assert cle.status_code == 201, cle.text
    assert client.get(URL, headers={"X-API-Key": cle.json()["secret"]}).status_code == 200
