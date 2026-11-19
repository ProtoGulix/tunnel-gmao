"""QR code d'intervention : réservé aux utilisateurs connectés, comme tous les exports.

L'ancienne exception « /qrcode public » du middleware JWT laissait passer la requête sans
lire le jeton, puis le routeur des exports la refusait : la route répondait 401 à tous.
"""

from uuid import uuid4

import pytest

from tests.integration.etape2_helpers import intervention_liee

pytestmark = pytest.mark.integration


def test_qrcode_refuse_sans_jeton_et_servi_avec(client, admin, instance):
    intervention_id, _ = intervention_liee(client, admin, instance)
    url = f"/exports/interventions/{intervention_id}/qrcode"

    assert client.get(url).status_code == 401

    r = client.get(url, headers=admin.headers)
    assert r.status_code == 200, r.text
    assert r.headers["content-type"] == "image/png"
    inconnue = client.get(f"/exports/interventions/{uuid4()}/qrcode", headers=admin.headers)
    assert inconnue.status_code == 404
