"""L'archivage d'une intervention est irrévocable, garanti par la base (IRR-01, ADR 0041)."""

import psycopg2
import pytest

from tests.integration.etape2_helpers import intervention_liee

# Ces tests portent sur la clôture, pas sur le constat (ADR 0043) : CUR n'en exige pas ici.
pytestmark = [pytest.mark.integration, pytest.mark.usefixtures("cur_sans_constat")]

IRREVOCABLE = "L'archivage d'une intervention est irrévocable"
PAS_ROUVRABLE = "Une intervention archivée ne peut pas être rouverte"


def _put(client, admin, intervention_id, **corps):
    return client.put(f"/interventions/{intervention_id}", headers=admin.headers, json=corps)


def _archivee(client, admin, instance, fermee=False):
    intervention_id, _ = intervention_liee(client, admin, instance)
    if fermee:
        assert _put(client, admin, intervention_id, status_actual="ferme").status_code == 200
    instance.sql("UPDATE intervention SET printed_fiche = true WHERE id = %s", (intervention_id,))
    return intervention_id


def _etat(instance, intervention_id):
    return instance.sql(
        "SELECT printed_fiche, status_actual FROM intervention WHERE id = %s", (intervention_id,)
    )[0]


def _sql_applicatif(instance, query, params):
    conn = psycopg2.connect(instance.app_url)
    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
        conn.commit()
    finally:
        conn.close()


def test_defaire_l_archive_par_l_api_est_refuse(client, admin, instance):
    intervention_id = _archivee(client, admin, instance)
    resp = _put(client, admin, intervention_id, printed_fiche=False)
    assert resp.status_code == 400, resp.text
    assert IRREVOCABLE in resp.text
    assert _etat(instance, intervention_id)[0] is True


@pytest.mark.parametrize("valeur", ["false", "NULL"])
def test_defaire_l_archive_en_sql_avec_le_role_applicatif_est_refuse(
    client, admin, instance, valeur
):
    intervention_id = _archivee(client, admin, instance)
    with pytest.raises(psycopg2.errors.RaiseException) as refus:
        _sql_applicatif(
            instance,
            f"UPDATE intervention SET printed_fiche = {valeur} WHERE id = %s",
            (intervention_id,),
        )
    assert IRREVOCABLE in str(refus.value)
    assert _etat(instance, intervention_id)[0] is True


def test_rouvrir_une_intervention_archivee_fermee_est_refuse(client, admin, instance):
    intervention_id = _archivee(client, admin, instance, fermee=True)
    resp = _put(
        client, admin, intervention_id, status_actual="ouvert", reason_code="INTERVENTION_REWORK"
    )
    assert resp.status_code == 400, resp.text
    assert PAS_ROUVRABLE in resp.text
    assert _etat(instance, intervention_id) == (True, "ferme")


def test_rouvrir_en_sql_avec_le_role_applicatif_est_refuse(client, admin, instance):
    intervention_id = _archivee(client, admin, instance, fermee=True)
    with pytest.raises(psycopg2.errors.RaiseException) as refus:
        _sql_applicatif(
            instance,
            "UPDATE intervention SET status_actual = 'ouvert' WHERE id = %s",
            (intervention_id,),
        )
    assert PAS_ROUVRABLE in str(refus.value)
    assert _etat(instance, intervention_id) == (True, "ferme")


def test_marquer_archivee_reste_permis(client, admin, instance):
    intervention_id, _ = intervention_liee(client, admin, instance)
    resp = _put(client, admin, intervention_id, printed_fiche=True)
    assert resp.status_code == 200, resp.text
    assert _etat(instance, intervention_id)[0] is True


def test_modifier_une_intervention_archivee_sans_toucher_aux_champs_reste_permis(
    client, admin, instance
):
    intervention_id = _archivee(client, admin, instance, fermee=True)
    resp = _put(client, admin, intervention_id, title="Titre modifié", printed_fiche=True)
    assert resp.status_code == 200, resp.text
    assert _etat(instance, intervention_id) == (True, "ferme")


def test_une_intervention_non_archivee_se_rouvre_comme_avant(client, admin, instance):
    intervention_id, _ = intervention_liee(client, admin, instance)
    assert _put(client, admin, intervention_id, status_actual="ferme").status_code == 200
    resp = _put(
        client, admin, intervention_id, status_actual="ouvert", reason_code="INTERVENTION_REWORK"
    )
    assert resp.status_code == 200, resp.text
    assert _etat(instance, intervention_id)[1] == "ouvert"


def test_declencheur_present_une_seule_fois(instance):
    assert instance.sql(
        "SELECT count(*) FROM pg_trigger WHERE tgname = 'trg_archivage_irrevocable' "
        "AND NOT tgisinternal"
    ) == [(1,)]
