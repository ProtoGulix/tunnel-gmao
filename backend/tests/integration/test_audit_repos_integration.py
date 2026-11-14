"""Audit des demandes dans la transaction de la mutation (AUD-05, écrit par le middleware
depuis l'ADR 0018).

L'auteur de la ligne d'audit est l'utilisateur du jeton, et un audit qui échoue annule
toute la mutation : aucune demande sans trace."""

import secrets

import pytest

from api.audits import middleware as audit_middleware

pytestmark = pytest.mark.integration


def _machine(instance):
    return str(
        instance.sql(
            "INSERT INTO machine (code, name) VALUES (%s, 'Presse repo') RETURNING id",
            (f"RP-{secrets.token_hex(3)}",),
        )[0][0]
    )


def test_creation_de_demande_ecrit_une_ligne_created_au_nom_du_jeton(
    client, admin, instance, make_user
):
    resp = client.post(
        "/intervention-requests",
        headers=admin.headers,
        json={
            "machine_id": _machine(instance),
            "demandeur_nom": "Atelier",
            "description": "Fuite d'huile",
            "reason_code": "ROUTINE",
        },
    )
    assert resp.status_code == 201, resp.text
    request_id = resp.json().get("data", resp.json())["id"]
    lignes = instance.sql(
        "SELECT decision_type, changed_by, is_system FROM audit_log WHERE entity_id = %s",
        (request_id,),
    )
    assert [(d, str(c), s) for d, c, s in lignes] == [("created", admin.id, False)]


def test_creation_sans_motif_envoie_le_motif_routine_du_middleware(client, admin, instance):
    resp = client.post(
        "/intervention-requests",
        headers=admin.headers,
        json={
            "machine_id": _machine(instance),
            "demandeur_nom": "Atelier",
            "description": "Bruit anormal",
        },
    )
    assert resp.status_code == 201, resp.text
    request_id = resp.json().get("data", resp.json())["id"]
    motif = instance.sql(
        "SELECT r.code FROM audit_log l JOIN audit_reason_code r ON r.id = l.reason_code_id "
        "WHERE l.entity_id = %s",
        (request_id,),
    )
    assert motif == [("ROUTINE",)]


def test_audit_qui_echoue_annule_la_creation(client, admin, instance, monkeypatch):
    """ADR 0018 : l'audit n'est plus écrit par le repo mais par le middleware, dans la même
    transaction. S'il échoue à l'écriture, la demande ne doit pas exister."""

    def _audit_en_panne(self, **kwargs):
        raise RuntimeError("audit indisponible")

    monkeypatch.setattr(
        audit_middleware.AuditRepository, "call_fn_audit_log_decision", _audit_en_panne
    )
    description = f"Demande orpheline {secrets.token_hex(4)}"
    resp = client.post(
        "/intervention-requests",
        headers=admin.headers,
        json={
            "machine_id": _machine(instance),
            "demandeur_nom": "Atelier",
            "description": description,
        },
    )
    assert resp.status_code == 500
    nb = instance.sql(
        "SELECT count(*) FROM intervention_request WHERE description = %s", (description,)
    )[0][0]
    assert nb == 0


@pytest.mark.parametrize("vide", ["", None])
def test_motif_vide_ou_null_dans_le_corps_vaut_un_motif_absent(client, admin, instance, vide):
    """Avec règle routinière : le schéma prend le motif injecté (jamais la chaîne vide) et
    l'audit l'écrit."""
    resp = client.post(
        "/intervention-requests",
        headers=admin.headers,
        json={
            "machine_id": _machine(instance),
            "demandeur_nom": "Atelier",
            "description": "Motif vide",
            "reason_code": vide,
        },
    )
    assert resp.status_code == 201, resp.text
    request_id = resp.json().get("data", resp.json())["id"]
    motif = instance.sql(
        "SELECT r.code FROM audit_log l JOIN audit_reason_code r ON r.id = l.reason_code_id "
        "WHERE l.entity_id = %s",
        (request_id,),
    )
    assert motif == [("ROUTINE",)]
