"""Accepter une demande en créant son intervention laisse une trace d'audit (AUDC-22c).

C'est le chemin normal d'acceptation (l'utilisateur, 2026-11-14) : la demande passe à
« acceptee » par POST /interventions avec request_id. Avant : historique des statuts
écrit sans auteur, aucun événement d'audit pour la demande."""

import pytest

from tests.integration.etape2_helpers import MOTIF, intervention_liee, lignes_audit

pytestmark = pytest.mark.integration


def test_creer_l_intervention_trace_l_acceptation_de_la_demande(client, admin, instance):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    acceptation = sorted(
        ligne
        for ligne in lignes_audit(instance, request_id)
        if ligne[1] in ("statut_changed", "intervention_id_changed")
    )
    assert acceptation == [
        ("request", "intervention_id_changed", MOTIF, False, str(admin.id)),
        ("request", "statut_changed", MOTIF, False, str(admin.id)),
    ]
    valeurs = instance.sql(
        "SELECT new_value->>'statut', new_value->>'intervention_id' FROM audit_log "
        "WHERE entity_id = %s AND decision_type IN ('statut_changed', 'intervention_id_changed') "
        "ORDER BY decision_type",
        (request_id,),
    )
    assert valeurs == [(None, intervention_id), ("acceptee", None)]


def test_l_historique_des_statuts_porte_l_auteur_du_jeton(client, admin, instance):
    _, request_id = intervention_liee(client, admin, instance)
    auteur = instance.sql(
        "SELECT changed_by::text FROM request_status_log "
        "WHERE request_id = %s AND status_to = 'acceptee'",
        (request_id,),
    )
    assert auteur == [(str(admin.id),)]
