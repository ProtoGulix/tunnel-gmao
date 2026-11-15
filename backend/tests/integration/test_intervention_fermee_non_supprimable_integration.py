"""Une intervention fermée ne se supprime pas (règle de l'utilisateur, 2026-11-14).

Avant : seules les actions et demandes d'achat liées bloquaient la suppression ; une
intervention fermée sans action pouvait disparaître (4 cas en base de dev le 2026-11-14)."""

import pytest

from tests.integration.etape2_helpers import intervention_liee
from tests.integration.test_audc22_interventions_demandes_integration import _supprimer

pytestmark = pytest.mark.integration


@pytest.mark.parametrize("issue", ["reopen", "delete"])
def test_une_intervention_fermee_ne_se_supprime_pas(client, admin, instance, issue):
    intervention_id, request_id = intervention_liee(client, admin, instance)
    instance.sql(
        "UPDATE intervention SET status_actual = 'ferme' WHERE id = %s", (intervention_id,)
    )
    resp = _supprimer(client, admin, intervention_id, issue=issue)
    assert resp.status_code == 400, f"{resp.status_code} : {resp.text}"
    assert "fermée" in resp.text
    restantes = instance.sql("SELECT count(*) FROM intervention WHERE id = %s", (intervention_id,))
    assert restantes == [(1,)]
    assert instance.sql(
        "SELECT count(*) FROM intervention_request WHERE id = %s", (request_id,)
    ) == [(1,)]
