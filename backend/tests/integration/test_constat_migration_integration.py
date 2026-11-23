"""Migration 0028 : constat après intervention, base neuve et retour arrière (CST-01)."""

import importlib.util
from pathlib import Path

import psycopg2
import pytest

pytestmark = pytest.mark.integration

_BACKEND = Path(__file__).resolve().parents[2]
_MIGRATION = _BACKEND / "alembic/versions/0028_constat_intervention.py"
_SEED = _BACKEND / "db/seed_reference.sql"
_TABLES = ("constat", "constat_answer", "constat_choice", "constat_question")
_QUESTIONS = (
    "SELECT q.code, q.is_multiple, p.code, q.sort_order, q.is_active FROM constat_question q "
    "LEFT JOIN constat_choice p ON p.id = q.parent_choice_id ORDER BY q.sort_order"
)
_CHOIX = (
    "SELECT q.code, c.code, c.label, c.sort_order, c.is_active, c.suggested_type_inter "
    "FROM constat_choice c JOIN constat_question q ON q.id = c.question_id "
    "ORDER BY q.sort_order, c.sort_order"
)
_REGLES = (
    "SELECT entity_type, is_routine, default_reason_code FROM audit_rule "
    "WHERE entity_type LIKE 'constat%' ORDER BY entity_type"
)


def _migration():
    spec = importlib.util.spec_from_file_location("migration_0028", _MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _tables(instance):
    return [
        t
        for t in _TABLES
        if instance.sql("SELECT to_regclass(%s) IS NOT NULL", (f"public.{t}",))[0][0]
    ]


def _fixture(instance, tag):
    """Une machine, une intervention, un utilisateur et une demande, pour les clés étrangères."""
    machine = instance.sql(
        "INSERT INTO machine (code, name) VALUES (%s, %s) RETURNING id::text", (tag, tag)
    )[0][0]
    intervention = instance.sql(
        "INSERT INTO intervention (title, machine_id, type_inter, tech_initials) "
        "VALUES (%s, %s, 'CUR', 'IT') RETURNING id::text",
        (tag, machine),
    )[0][0]
    user = instance.sql("SELECT id::text FROM tunnel_user LIMIT 1")[0][0]
    return machine, intervention, user


def _demande(instance, machine, code, source=None):
    return instance.sql(
        "INSERT INTO intervention_request (code, machine_id, demandeur_nom, description, "
        "statut, source_intervention_id) VALUES (%s, %s, 'A', 'B', 'nouvelle', %s) "
        "RETURNING id::text",
        (code, machine, source),
    )[0][0]


def _constat(instance, ids, request, supersedes=None):
    machine, intervention, user = ids
    return instance.sql(
        "INSERT INTO constat (intervention_id, machine_id, created_by, request_id, "
        "supersedes_id) VALUES (%s, %s, %s, %s, %s) RETURNING id::text",
        (intervention, machine, user, request, supersedes),
    )[0][0]


def test_revision_et_parent():
    module = _migration()
    assert module.revision == "0028_constat_intervention"
    assert module.down_revision == "0027_motifs_remise_a_faire"


def test_instructions_du_seed_identiques_a_la_migration():
    seed = _SEED.read_text(encoding="utf-8")
    for statement in _migration().upgrade_statements():
        assert statement + ";" in seed


def test_base_neuve_a_l_etat_attendu(instance):
    assert _tables(instance) == sorted(_TABLES)
    assert instance.sql(_QUESTIONS) == [
        ("LEVER", True, None, 1, True),
        ("FREQUENCY", False, "TASK", 2, True),
        ("KNOWN_SINCE", False, "PROJECT", 3, True),
        ("DOMAIN", True, "TRAINING", 4, True),
        ("PARAMETER", True, "MONITORING", 5, True),
        ("SIGNAL", False, None, 6, True),
        ("PART", True, None, 7, True),
    ]
    choix = instance.sql(_CHOIX)
    assert [c[1] for c in choix if c[0] == "LEVER"] == [
        "TASK",
        "PROJECT",
        "TRAINING",
        "MONITORING",
        "OTHER",
    ]
    assert {c[1]: c[5] for c in choix if c[5]} == {"TASK": "PRE", "PROJECT": "PRO"}
    assert len(choix) == 34 and all(c[4] for c in choix)
    types = dict(instance.sql("SELECT code, constat_required FROM intervention_type"))
    assert types["CUR"] is True
    assert all(v is False for k, v in types.items() if k != "CUR")
    motif = instance.sql(
        "SELECT label, category, entity_types, decision_types FROM audit_reason_code "
        "WHERE code = 'CONSTAT_CORRECTION'"
    )
    assert motif == [("Correction", "user", ["constat"], ["constat_corrected"])]
    other = instance.sql("SELECT decision_types FROM audit_reason_code WHERE code = 'OTHER'")
    assert "constat_corrected" not in other[0][0]
    routine = instance.sql("SELECT entity_types FROM audit_reason_code WHERE code = 'ROUTINE'")
    assert {"constat", "constat_question", "constat_choice"} <= set(routine[0][0])
    assert instance.sql(_REGLES) == [
        ("constat", True, "ROUTINE"),
        ("constat_choice", True, "ROUTINE"),
        ("constat_question", True, "ROUTINE"),
    ]


def test_rejouer_ne_change_rien_ni_n_ecrase(instance):
    module = _migration()
    instance.sql("UPDATE constat_choice SET label = 'Mon libellé' WHERE code = 'OTHER'")
    instance.sql("UPDATE intervention_type SET constat_required = false WHERE code = 'CUR'")
    avant = (instance.sql(_QUESTIONS), instance.sql(_CHOIX), instance.sql(_REGLES))
    nb = instance.sql("SELECT count(*) FROM audit_reason_code")
    for statement in module.upgrade_statements():
        instance.sql(statement)
    assert (instance.sql(_QUESTIONS), instance.sql(_CHOIX), instance.sql(_REGLES)) == avant
    assert instance.sql("SELECT count(*) FROM audit_reason_code") == nb
    assert instance.sql("SELECT constat_required FROM intervention_type WHERE code = 'CUR'") == [
        (False,)
    ]
    instance.sql("UPDATE constat_choice SET label = 'Autre' WHERE code = 'OTHER'")
    instance.sql("UPDATE intervention_type SET constat_required = true WHERE code = 'CUR'")


def test_contraintes_constat_et_pas_de_cascade(instance):
    ids = _fixture(instance, "CST-CONTRAINTES")
    machine, intervention, _ = ids
    di1 = _demande(instance, machine, "DI-CST-1", intervention)
    premier = _constat(instance, ids, di1)
    instance.sql(
        "INSERT INTO constat_answer (constat_id, choice_code) VALUES (%s, 'TASK')", (premier,)
    )
    with pytest.raises(psycopg2.errors.ForeignKeyViolation):
        instance.sql(
            "INSERT INTO constat_answer (constat_id, choice_code) VALUES (%s, 'INCONNU')",
            (premier,),
        )
    # Les versions d'un constat partagent sa demande ; une version n'est remplacée qu'une fois.
    _constat(instance, ids, di1, supersedes=premier)
    with pytest.raises(psycopg2.errors.UniqueViolation):
        _constat(instance, ids, di1, supersedes=premier)
    # Aucune cascade : ni l'intervention, ni la demande, ni le constat ne s'effacent.
    for requete, valeur in (
        ("DELETE FROM intervention WHERE id = %s", intervention),
        ("DELETE FROM intervention_request WHERE id = %s", di1),
        ("DELETE FROM constat WHERE id = %s", premier),
    ):
        with pytest.raises(psycopg2.errors.ForeignKeyViolation):
            instance.sql(requete, (valeur,))


def test_retour_arriere_refuse_avec_des_constats_puis_remontee(instance):
    module = _migration()
    # Constats laissés par le test précédent : le retour arrière refuse.
    with pytest.raises(psycopg2.errors.AssertFailure):
        for statement in module.downgrade_statements():
            instance.sql(statement)
    assert _tables(instance) == sorted(_TABLES)


def test_retour_arriere_puis_remontee_sans_constat(instance):
    module = _migration()
    instance.sql("UPDATE intervention_request SET source_intervention_id = NULL")
    instance.sql("DELETE FROM constat_answer")
    instance.sql("UPDATE constat SET supersedes_id = NULL")
    instance.sql("DELETE FROM constat")
    reference = (instance.sql(_QUESTIONS), instance.sql(_CHOIX), instance.sql(_REGLES))
    for statement in module.downgrade_statements():
        instance.sql(statement)
    assert _tables(instance) == []
    colonnes = instance.sql(
        "SELECT table_name, column_name FROM information_schema.columns WHERE "
        "column_name IN ('constat_required', 'source_intervention_id')"
    )
    assert colonnes == []
    assert instance.sql(_REGLES) == []
    assert instance.sql("SELECT 1 FROM audit_reason_code WHERE code = 'CONSTAT_CORRECTION'") == []
    routine = instance.sql("SELECT entity_types FROM audit_reason_code WHERE code = 'ROUTINE'")
    assert not {"constat", "constat_question", "constat_choice"} & set(routine[0][0])
    for statement in module.upgrade_statements():
        instance.sql(statement)
    assert (instance.sql(_QUESTIONS), instance.sql(_CHOIX), instance.sql(_REGLES)) == reference
    assert instance.sql("SELECT constat_required FROM intervention_type WHERE code = 'CUR'") == [
        (True,)
    ]
