"""Export courriel d'une commande fournisseur : aucune trace d'audit (CONT-02).

La route compose le sujet, le corps et le lien mailto depuis des SELECT : elle n'envoie aucun
courriel et ne modifie rien. Une route qui ne modifie rien n'écrit rien dans audit_log.
"""

import pytest

from tests.integration.etape2_helpers import MOTIF, lignes_audit
from tests.integration.test_audc25_achats_integration import _data, _fournisseur

pytestmark = pytest.mark.integration


def _commande(instance, client, admin) -> str:
    resp = client.post(
        "/supplier-orders",
        headers=admin.headers,
        json={"supplier_id": _fournisseur(instance), "reason_code": MOTIF},
    )
    assert resp.status_code in (200, 201), resp.text
    return _data(resp)["id"]


def _compte_audit(instance) -> int:
    return instance.sql("SELECT count(*) FROM audit_log")[0][0]


def test_export_courriel_sans_motif_ne_demande_rien_et_n_ecrit_rien_dans_audit_log(
    instance, client, admin
):
    commande = _commande(instance, client, admin)
    avant = _compte_audit(instance)

    resp = client.post(f"/supplier-orders/{commande}/export/email", headers=admin.headers)

    assert resp.status_code == 200, resp.text
    assert "subject" in resp.json()
    assert [lg[1] for lg in lignes_audit(instance, commande)] == ["created"], [
        lg[1] for lg in lignes_audit(instance, commande)
    ]
    assert _compte_audit(instance) == avant
    assert [lg[1] for lg in lignes_audit(instance, commande)] == ["created"]


def test_export_courriel_avec_motif_n_ecrit_rien_non_plus(instance, client, admin):
    commande = _commande(instance, client, admin)
    avant = _compte_audit(instance)

    resp = client.post(
        f"/supplier-orders/{commande}/export/email",
        headers=admin.headers,
        json={"reason_code": MOTIF},
    )

    assert resp.status_code == 200, resp.text
    assert _compte_audit(instance) == avant
