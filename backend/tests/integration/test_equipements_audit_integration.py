"""Audit des modifications d'équipement (migration 0004, ADR 0011 décision 3.4).

Vrai JWT, vrai AuditMiddleware : chaque champ modifié donne une ligne audit_log signée
par l'utilisateur du jeton, avec le motif routine EQUIPMENT_UPDATE posé sans saisie.
"""

import secrets

import pytest

pytestmark = pytest.mark.integration


def _machine(instance, nom, mere=None):
    return instance.sql(
        "INSERT INTO machine (code, name, equipement_mere) VALUES (%s, %s, %s) RETURNING id::text",
        (f"AU-{secrets.token_hex(3)}", nom, mere),
    )[0][0]


def _journal(instance, equipement_id):
    return instance.sql(
        "SELECT l.decision_type, l.entity_type, l.changed_by::text, r.code, "
        "l.old_value::text, l.new_value::text FROM audit_log l "
        "JOIN audit_reason_code r ON r.id = l.reason_code_id WHERE l.entity_id = %s "
        "ORDER BY l.decision_type",
        (equipement_id,),
    )


def test_patch_par_un_tech_trace_un_log_par_champ_modifie(instance, client, make_user, grant):
    grant("TECH", "PATCH", "/equipements/{equipement_id}")
    tech = make_user("TECH")
    eq = _machine(instance, "Presse")

    r = client.patch(
        f"/equipements/{eq}",
        headers=tech.headers,
        json={"name": "Presse 2", "notes": "révisée"},
    )
    assert r.status_code == 200, r.text

    lignes = _journal(instance, eq)
    assert [ligne[0] for ligne in lignes] == ["name_changed", "notes_changed"]
    for _, entite, auteur, motif, _, _ in lignes:
        assert entite == "equipement"
        assert auteur == tech.id
        assert motif == "EQUIPMENT_UPDATE"
    assert '"Presse 2"' in lignes[0][5]


def test_patch_sans_changement_effectif_ne_trace_rien(instance, client, make_user, grant):
    grant("TECH", "PATCH", "/equipements/{equipement_id}")
    tech = make_user("TECH")
    eq = _machine(instance, "Tour")
    r = client.patch(f"/equipements/{eq}", headers=tech.headers, json={"name": "Tour"})
    assert r.status_code == 200, r.text
    assert _journal(instance, eq) == []


def test_changement_de_parent_est_trace(instance, client, make_user, grant):
    grant("TECH", "PATCH", "/equipements/{equipement_id}")
    tech = make_user("TECH")
    mere = _machine(instance, "Ligne")
    fille = _machine(instance, "Poste")

    r = client.patch(f"/equipements/{fille}", headers=tech.headers, json={"parent_id": mere})
    assert r.status_code == 200, r.text

    lignes = _journal(instance, fille)
    assert [ligne[0] for ligne in lignes] == ["equipement_mere_changed"]
    assert lignes[0][2] == tech.id
    assert lignes[0][3] == "EQUIPMENT_UPDATE"
    assert mere in lignes[0][5]


def test_classe_ou_statut_inexistant_donne_400_pas_500(instance, client, make_user, grant):
    grant("TECH", "PATCH", "/equipements/{equipement_id}")
    tech = make_user("TECH")
    eq = _machine(instance, "Four")

    r = client.patch(
        f"/equipements/{eq}",
        headers=tech.headers,
        json={"equipement_class_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert r.status_code == 400, r.text
    r = client.patch(f"/equipements/{eq}", headers=tech.headers, json={"statut_id": 999999})
    assert r.status_code == 400, r.text
    assert _journal(instance, eq) == []


def test_creation_avec_statut_inexistant_donne_400(client, admin):
    r = client.post(
        "/equipements", json={"name": "Scie", "statut_id": 999999}, headers=admin.headers
    )
    assert r.status_code == 400, r.text
