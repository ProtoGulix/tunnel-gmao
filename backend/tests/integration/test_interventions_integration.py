"""Parcours de base sur une installation neuve : équipement, demande d'intervention, intervention.

Règle métier : une intervention est toujours rattachée à une demande d'intervention."""

import pytest

pytestmark = pytest.mark.integration


def test_parcours_demande_puis_intervention_sur_une_installation_neuve(client, admin, instance):
    equipement = client.post("/equipements", json={"name": "Presse neuve"}, headers=admin.headers)
    assert equipement.status_code in (200, 201), equipement.text
    machine_id = equipement.json().get("data", equipement.json())["id"]
    raison = instance.sql("SELECT code FROM audit_reason_code WHERE is_active LIMIT 1")[0][0]

    demande = client.post(
        "/intervention-requests",
        json={
            "machine_id": machine_id,
            "demandeur_nom": "Atelier",
            "description": "Fuite sur le vérin principal",
            "reason_code": raison,
        },
        headers=admin.headers,
    )
    assert demande.status_code in (200, 201), demande.text
    request_id = demande.json().get("data", demande.json())["id"]

    r = client.post(
        "/interventions",
        json={
            "machine_id": machine_id,
            "type_inter": "CUR",
            "tech_id": admin.id,
            "title": "Fuite hydraulique",
            "priority": "normale",
            "request_id": request_id,
            "reason_code": raison,
        },
        headers=admin.headers,
    )
    assert r.status_code in (200, 201), r.text


def test_un_type_d_intervention_inconnu_renvoie_une_erreur_metier_pas_une_500(
    client, admin, instance
):
    """La validation métier levée dans le dépôt ne doit pas être convertie en 500."""
    equipement = client.post("/equipements", json={"name": "Tour"}, headers=admin.headers)
    machine_id = equipement.json().get("data", equipement.json())["id"]
    raison = instance.sql("SELECT code FROM audit_reason_code WHERE is_active LIMIT 1")[0][0]
    demande = client.post(
        "/intervention-requests",
        json={
            "machine_id": machine_id,
            "demandeur_nom": "Atelier",
            "description": "Bruit",
            "reason_code": raison,
        },
        headers=admin.headers,
    )
    request_id = demande.json().get("data", demande.json())["id"]
    r = client.post(
        "/interventions",
        json={
            "machine_id": machine_id,
            "type_inter": "XYZ",
            "tech_id": admin.id,
            "title": "Test",
            "request_id": request_id,
            "reason_code": raison,
        },
        headers=admin.headers,
    )
    assert 400 <= r.status_code < 500, r.text
    assert "XYZ" in r.text
