"""Migration 0029 : réglages des choix du constat, base neuve et retour arrière (CDL-01)."""

import importlib.util
from pathlib import Path

import psycopg2
import pytest

pytestmark = pytest.mark.integration

_BACKEND = Path(__file__).resolve().parents[2]
_MIGRATION = _BACKEND / "alembic/versions/0029_constat_reglages_des_choix.py"
_SEED = _BACKEND / "db/seed_reference.sql"
_REGLAGES = (
    "SELECT code, creates_request, is_exclusive, sort_order, suggested_type_inter "
    "FROM constat_choice ORDER BY id"
)


def _migration():
    spec = importlib.util.spec_from_file_location("migration_0029", _MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _monter(instance):
    for statement in _migration().upgrade_statements():
        instance.sql(statement)


def _descendre(instance):
    for statement in _migration().downgrade_statements():
        instance.sql(statement)


def _colonnes(instance):
    return instance.sql(
        "SELECT column_name FROM information_schema.columns WHERE table_name = "
        "'constat_choice' AND column_name IN ('creates_request', 'is_exclusive') "
        "ORDER BY column_name"
    )


def _demande_nulle(instance, tag):
    machine = instance.sql(
        "INSERT INTO machine (code, name) VALUES (%s, %s) RETURNING id::text", (tag, tag)
    )[0][0]
    intervention = instance.sql(
        "INSERT INTO intervention (title, machine_id, type_inter, tech_initials) "
        "VALUES (%s, %s, 'CUR', 'IT') RETURNING id::text",
        (tag, machine),
    )[0][0]
    user = instance.sql("SELECT id::text FROM tunnel_user LIMIT 1")[0][0]
    return instance.sql(
        "INSERT INTO constat (intervention_id, machine_id, created_by, request_id) "
        "VALUES (%s, %s, %s, NULL) RETURNING id::text",
        (intervention, machine, user),
    )[0][0]


def test_revision_et_parent():
    module = _migration()
    assert module.revision == "0029_constat_reglages_des_choix"
    assert module.down_revision == "0028_constat_intervention"


def test_instructions_du_seed_identiques_a_la_migration():
    seed = _SEED.read_text(encoding="utf-8")
    for statement in _migration().upgrade_statements():
        assert statement + ";" in seed


def test_base_neuve_a_l_etat_attendu(instance):
    reglages = {r[0]: r for r in instance.sql(_REGLAGES)}
    assert {c for c, r in reglages.items() if r[1]} == {"TASK", "PROJECT"}
    assert {c for c, r in reglages.items() if r[2]} == {"NOTHING"}
    assert reglages["NOTHING"][3:] == (6, None)
    lever = instance.sql(
        "SELECT c.code FROM constat_choice c JOIN constat_question q ON q.id = c.question_id "
        "WHERE q.code = 'LEVER' ORDER BY c.sort_order"
    )
    assert [c[0] for c in lever][-2:] == ["OTHER", "NOTHING"]


def test_upgrade_depuis_0028_puis_rejeu_sans_ecraser(instance):
    _descendre(instance)
    assert _colonnes(instance) == []
    assert instance.sql("SELECT 1 FROM constat_choice WHERE code = 'NOTHING'") == []
    _monter(instance)
    assert _colonnes(instance) == [("creates_request",), ("is_exclusive",)]
    avant = instance.sql(_REGLAGES)
    # Un réglage modifié depuis l'administration survit à une relance.
    instance.sql("UPDATE constat_choice SET creates_request = false WHERE code = 'TASK'")
    instance.sql("UPDATE constat_choice SET creates_request = true WHERE code = 'TRAINING'")
    modifie = instance.sql(_REGLAGES)
    _monter(instance)
    assert instance.sql(_REGLAGES) == modifie != avant
    assert instance.sql("SELECT count(*) FROM constat_choice WHERE code = 'NOTHING'") == [(1,)]
    instance.sql("UPDATE constat_choice SET creates_request = true WHERE code = 'TASK'")
    instance.sql("UPDATE constat_choice SET creates_request = false WHERE code = 'TRAINING'")


def test_constat_sans_demande_accepte_puis_retour_arriere_refuse(instance):
    constat = _demande_nulle(instance, "CDL-SANS-DEMANDE")
    with pytest.raises(psycopg2.errors.AssertFailure):
        _descendre(instance)
    assert _colonnes(instance) == [("creates_request",), ("is_exclusive",)]
    # Une réponse NOTHING bloque aussi, même une fois la demande posée.
    machine = instance.sql("SELECT machine_id::text FROM constat WHERE id = %s", (constat,))[0][0]
    demande = instance.sql(
        "INSERT INTO intervention_request (code, machine_id, demandeur_nom, description, "
        "statut) VALUES ('DI-CDL-1', %s, 'A', 'B', 'nouvelle') RETURNING id::text",
        (machine,),
    )[0][0]
    instance.sql("UPDATE constat SET request_id = %s WHERE id = %s", (demande, constat))
    instance.sql(
        "INSERT INTO constat_answer (constat_id, choice_code) VALUES (%s, 'NOTHING')", (constat,)
    )
    with pytest.raises(psycopg2.errors.AssertFailure):
        _descendre(instance)
    instance.sql("DELETE FROM constat_answer WHERE constat_id = %s", (constat,))


def test_retour_arriere_propre_puis_remontee(instance):
    _descendre(instance)
    assert _colonnes(instance) == []
    assert instance.sql("SELECT 1 FROM constat_choice WHERE code = 'NOTHING'") == []
    nullable = instance.sql(
        "SELECT is_nullable FROM information_schema.columns WHERE table_name = 'constat' "
        "AND column_name = 'request_id'"
    )
    assert nullable == [("NO",)]
    _monter(instance)
    assert instance.sql(
        "SELECT is_nullable FROM information_schema.columns WHERE table_name = 'constat' "
        "AND column_name = 'request_id'"
    ) == [("YES",)]
    assert instance.sql("SELECT is_exclusive FROM constat_choice WHERE code = 'NOTHING'") == [
        (True,)
    ]
