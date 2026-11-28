"""Migration 0030 : contrainte CHECK sur intervention_request.priorite (ADT-01, ADR 0047)."""

import importlib.util
import uuid
from pathlib import Path

import psycopg2
import pytest

pytestmark = pytest.mark.integration

_MIGRATION = Path(__file__).resolve().parents[2] / "alembic/versions/0030_priorite_demande.py"
_CONTRAINTE = "intervention_request_priorite_check"


def _migration():
    spec = importlib.util.spec_from_file_location("migration_0030", _MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _contraintes(instance):
    return instance.sql("SELECT count(*) FROM pg_constraint WHERE conname = %s", (_CONTRAINTE,))[0][
        0
    ]


def _demande(instance, priorite):
    machine_id = str(uuid.uuid4())
    instance.sql(
        "INSERT INTO machine (id, code, name) VALUES (%s, %s, 'Machine ADT-01')",
        (machine_id, f"A{machine_id[:6]}"),
    )
    instance.sql(
        "INSERT INTO intervention_request (code, machine_id, demandeur_nom, description, statut, priorite) "
        "VALUES (%s, %s, 'Test', 'Demande ADT-01', 'nouvelle', %s)",
        (f"DI-{machine_id[:8]}", machine_id, priorite),
    )


def test_revision_et_parent():
    module = _migration()
    assert module.revision == "0030_priorite_demande"
    assert module.down_revision == "0029_constat_reglages_des_choix"


@pytest.mark.parametrize("valeur", [None, "faible", "normal", "important", "urgent"])
def test_valeurs_acceptees(instance, valeur):
    assert _contraintes(instance) == 1
    _demande(instance, valeur)


@pytest.mark.parametrize("valeur", ["normale", "bizarre", ""])
def test_valeur_hors_liste_refusee(instance, valeur):
    with pytest.raises(psycopg2.errors.CheckViolation):
        _demande(instance, valeur)


def test_garde_rejouable_et_downgrade(instance):
    module = _migration()
    for statement in module.upgrade_statements():
        instance.sql(statement)
    assert _contraintes(instance) == 1

    for statement in module.downgrade_statements():
        instance.sql(statement)
    assert _contraintes(instance) == 0
    _demande(instance, "bizarre")  # sans contrainte, la base accepte
    with pytest.raises(psycopg2.Error, match="bizarre"):
        for statement in module.upgrade_statements():
            instance.sql(statement)
    assert _contraintes(instance) == 0

    instance.sql("DELETE FROM intervention_request WHERE priorite = 'bizarre'")
    for statement in module.upgrade_statements():
        instance.sql(statement)
    assert _contraintes(instance) == 1
