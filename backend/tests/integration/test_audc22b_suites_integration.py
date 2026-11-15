"""Suites d'AUDC-22 : préventif, création à l'acceptation, /repair (AUDC-22b).

Une demande liée à une occurrence préventive (preventive_occurrence.di_id, sans clé
étrangère) ne se supprime pas en cascade ; sa réouverture remet l'occurrence à « generated ».
L'intervention créée en acceptant une demande reçoit sa ligne `created`.
"""

import secrets

import pytest
from fastapi.routing import APIRoute

from api.app import app
from api.audits.declaration import find_declaration
from tests.integration.etape2_helpers import (
    MOTIF,
    demande,
    intervention_liee,
    lignes_audit,
    machine,
)

pytestmark = pytest.mark.integration


def _supprimer(client, admin, intervention_id, issue):
    return client.request(
        "DELETE",
        f"/interventions/{intervention_id}",
        headers=admin.headers,
        params={"request_outcome": issue},
        json={"reason_code": MOTIF},
    )


def _occurrence_liee(instance, intervention_id, request_id) -> str:
    """Occurrence préventive en cours, liée à la demande et à l'intervention."""
    machine_id = instance.sql(
        "SELECT machine_id FROM intervention WHERE id = %s", (intervention_id,)
    )[0][0]
    # Classe sans machine : la génération préventive des autres tests ne doit pas trébucher
    # sur ce plan (un plan sans classe fait échouer le chargement de ses machines).
    classe = instance.sql(
        "INSERT INTO equipement_class (code, label) VALUES (%s, 'Classe AUDC-22b') RETURNING id",
        (f"CL-{secrets.token_hex(3)}",),
    )[0][0]
    plan = instance.sql(
        "INSERT INTO preventive_plan (code, label, equipement_class_id, trigger_type, "
        "periodicity_days) VALUES (%s, 'Plan AUDC-22b', %s, 'periodicity', 30) RETURNING id",
        (f"PL-{secrets.token_hex(3)}", classe),
    )[0][0]
    return str(
        instance.sql(
            "INSERT INTO preventive_occurrence "
            "(plan_id, machine_id, scheduled_date, status, di_id, intervention_id) "
            "VALUES (%s, %s, CURRENT_DATE, 'in_progress', %s, %s) RETURNING id",
            (plan, machine_id, request_id, intervention_id),
        )[0][0]
    )


def test_supprimer_en_cascade_une_demande_liee_a_une_occurrence_est_refuse(client, admin, instance):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    occurrence_id = _occurrence_liee(instance, intervention_id, request_id)

    resp = _supprimer(client, admin, intervention_id, "delete")

    assert resp.status_code == 400, f"{resp.status_code} : {resp.text}"
    assert "préventi" in resp.text.lower()
    assert instance.sql("SELECT 1 FROM intervention WHERE id = %s", (intervention_id,))
    assert instance.sql("SELECT 1 FROM intervention_request WHERE id = %s", (request_id,))
    assert instance.sql(
        "SELECT status FROM preventive_occurrence WHERE id = %s", (occurrence_id,)
    ) == [("in_progress",)]
    assert [ligne[1] for ligne in lignes_audit(instance, intervention_id)] == ["created"]


def test_rouvrir_une_demande_liee_a_une_occurrence_remet_l_occurrence_a_generated(
    client, admin, instance
):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    occurrence_id = _occurrence_liee(instance, intervention_id, request_id)

    resp = _supprimer(client, admin, intervention_id, "reopen")

    assert resp.status_code == 200, f"{resp.status_code} : {resp.text}"
    assert instance.sql(
        "SELECT status, intervention_id, di_id::text FROM preventive_occurrence WHERE id = %s",
        (occurrence_id,),
    ) == [("generated", None, request_id)]
    assert instance.sql(
        "SELECT statut, intervention_id FROM intervention_request WHERE id = %s", (request_id,)
    ) == [("nouvelle", None)]
    lignes = lignes_audit(instance, occurrence_id)
    assert len(lignes) == 1, lignes
    entite, _decision, motif, systeme, auteur = lignes[0]
    assert (entite, motif, systeme, auteur) == (
        "preventive_occurrence",
        "SYSTEM_CASCADE",
        True,
        admin.id,
    )


def test_accepter_une_demande_ecrit_la_ligne_created_de_l_intervention_creee(
    client, admin, instance
):
    request_id = demande(client, admin, machine(instance))
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
    intervention_id = instance.sql(
        "SELECT intervention_id::text FROM intervention_request WHERE id = %s", (request_id,)
    )[0][0]

    lignes = lignes_audit(instance, intervention_id)

    # Motif de la règle d'audit de l'entité intervention (règle par défaut, champ NULL).
    attendu = instance.sql(
        "SELECT default_reason_code FROM audit_rule "
        "WHERE entity_type = 'intervention' AND field IS NULL"
    )[0][0]
    assert lignes == [("intervention", "created", attendu, False, admin.id)]


def test_la_route_repair_est_declaree_events_only():
    route = next(
        r
        for r in app.routes
        if isinstance(r, APIRoute) and r.path == "/intervention-requests/repair"
    )
    declaration = find_declaration(route)
    assert declaration is not None
    assert declaration.events_only is True
