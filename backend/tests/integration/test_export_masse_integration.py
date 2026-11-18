"""Export de masse des fiches fermées avec vrais middlewares et vraie base (EXPM-01)."""

import io
import zipfile

import pytest

from api.limiter import limiter
from tests.integration.etape2_helpers import intervention_liee

pytestmark = pytest.mark.integration

URL = "/exports/interventions/closed"


def _fermer(client, admin, intervention_id, date):
    resp = client.post(
        "/intervention-status-log",
        headers=admin.headers,
        json={
            "intervention_id": intervention_id,
            "status_to": "ferme",
            "technician_id": admin.id,
            "date": date,
        },
    )
    assert resp.status_code == 201, resp.text


def _code(instance, intervention_id):
    return instance.sql("SELECT code FROM intervention WHERE id = %s", (intervention_id,))[0][0]


def test_seules_les_fermees_de_la_periode_sont_exportees_et_les_droits_s_appliquent(
    client, admin, make_user, instance, monkeypatch
):
    # La limite de débit (2/minute) est vérifiée à part : ici on désactive le limiteur.
    monkeypatch.setattr(limiter, "enabled", False)
    dans_periode, _ = intervention_liee(client, admin, instance)
    hors_periode, _ = intervention_liee(client, admin, instance)
    ouverte, _ = intervention_liee(client, admin, instance)
    _fermer(client, admin, dans_periode, "2031-03-15T10:00:00")
    _fermer(client, admin, hors_periode, "2031-05-02T10:00:00")

    params = {"date_from": "2031-03-01", "date_to": "2031-03-15", "format": "zip"}
    r = client.get(URL, params=params, headers=admin.headers)
    assert r.status_code == 200, r.text
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        # Borne de fin incluse : la fermeture du 15 à 10 h est retenue
        assert z.namelist() == [f"{_code(instance, dans_periode)}.pdf"]
    assert _code(instance, ouverte) and _code(instance, hors_periode)

    pdf = client.get(URL, params={**params, "format": "pdf"}, headers=admin.headers)
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF")

    vide = client.get(
        URL,
        params={"date_from": "2031-04-01", "date_to": "2031-04-30", "format": "zip"},
        headers=admin.headers,
    )
    assert vide.status_code == 404

    resp_user = make_user("RESP")
    assert client.get(URL, params=params, headers=resp_user.headers).status_code == 200
    for role in ("TECH", "ACHETEUR"):
        refuse = client.get(URL, params=params, headers=make_user(role).headers)
        assert refuse.status_code == 403, role


def test_marquage_imprimees_idempotent_sans_toucher_au_statut(
    client, admin, make_user, instance, monkeypatch
):
    monkeypatch.setattr(limiter, "enabled", False)
    url = URL + "/mark-printed"
    a, _ = intervention_liee(client, admin, instance)
    b, _ = intervention_liee(client, admin, instance)
    hors, _ = intervention_liee(client, admin, instance)
    _fermer(client, admin, a, "2032-03-10T10:00:00")
    _fermer(client, admin, b, "2032-03-12T10:00:00")
    _fermer(client, admin, hors, "2032-06-12T10:00:00")
    instance.sql("UPDATE intervention SET printed_fiche = TRUE WHERE id = %s", (b,))
    logs_avant = instance.sql(
        "SELECT COUNT(*) FROM intervention_status_log WHERE intervention_id = ANY(%s::uuid[])",
        ([a, b, hors],),
    )[0][0]

    body = {"date_from": "2032-03-01", "date_to": "2032-03-31"}
    for role in ("TECH", "ACHETEUR"):
        assert client.post(url, json=body, headers=make_user(role).headers).status_code == 403
    r = client.post(url, json=body, headers=admin.headers)
    assert r.status_code == 200, r.text
    assert r.json()["data"] == {"marked": 1, "total": 2}
    # Idempotent : deuxième appel, plus rien à marquer
    again = client.post(url, json=body, headers=make_user("RESP").headers)
    assert again.json()["data"] == {"marked": 0, "total": 2}

    rows = dict(
        instance.sql(
            "SELECT id::text, printed_fiche FROM intervention WHERE id = ANY(%s::uuid[])",
            ([a, b, hors],),
        )
    )
    assert rows[a] and rows[b] and not rows[hors]
    assert (
        instance.sql(
            "SELECT COUNT(*) FROM intervention_status_log WHERE intervention_id = ANY(%s::uuid[])",
            ([a, b, hors],),
        )[0][0]
        == logs_avant
    )
    statuts = instance.sql(
        "SELECT DISTINCT status_actual FROM intervention WHERE id = ANY(%s::uuid[])",
        ([a, b, hors],),
    )
    assert len(statuts) == 1

    # Audit : une ligne par fiche réellement marquée (a), auteur = jeton ; rien pour b
    # (déjà imprimée) ni pour hors (hors période), et pas de second marquage de a.
    lignes = instance.sql(
        "SELECT entity_id::text, decision_type, changed_by::text, old_value, new_value "
        "FROM audit_log WHERE entity_type = 'intervention' AND decision_type = 'printed_fiche_changed' "
        "AND entity_id = ANY(%s::uuid[])",
        ([a, b, hors],),
    )
    assert len(lignes) == 1
    entity_id, _, changed_by, old_value, new_value = lignes[0]
    assert entity_id == a and changed_by == admin.id
    assert old_value == {"printed_fiche": False} and new_value == {"printed_fiche": True}
