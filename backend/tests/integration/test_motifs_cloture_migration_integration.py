"""Migration 0013 : motifs de clôture sur une base installée avant leur seed (BASC-03)."""

import importlib.util
from pathlib import Path

import pytest

pytestmark = pytest.mark.integration

_MIGRATION = Path(__file__).resolve().parents[2] / "alembic/versions/0013_motifs_cloture.py"
_CODES = (
    "TASK_DONE_UNRECORDED",
    "TASK_HANDLED_ELSEWHERE",
    "TASK_NO_LONGER_NEEDED",
    "TASK_DUPLICATE",
)
_ETAT = (
    "SELECT code, label, category, entity_types, decision_types, color, description, is_active "
    "FROM audit_reason_code WHERE code = ANY(%s) OR code = 'LEGACY_STATUS_CHANGE' ORDER BY code"
)


def _migration():
    spec = importlib.util.spec_from_file_location("migration_0013", _MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _jouer(instance, statements):
    for statement in statements:
        instance.sql(statement)


def test_revision_et_parent():
    module = _migration()
    assert module.revision == "0013_motifs_cloture"
    assert module.down_revision == "0012_audit_entites_etape_4"


def test_base_neuve_a_deja_l_etat_attendu_et_rejouer_ne_change_rien(instance):
    module = _migration()
    avant = instance.sql(_ETAT, (list(_CODES),))
    assert [ligne[0] for ligne in avant if ligne[0] != "LEGACY_STATUS_CHANGE"] == sorted(_CODES)
    legacy = [ligne for ligne in avant if ligne[0] == "LEGACY_STATUS_CHANGE"]
    assert legacy and legacy[0][7] is False
    _jouer(instance, module.upgrade_statements())
    assert instance.sql(_ETAT, (list(_CODES),)) == avant


def test_base_ancienne_rattrapee_et_retour_arriere_respecte_audit_log(instance):
    module = _migration()
    reference = instance.sql(_ETAT, (list(_CODES),))
    # La clé étrangère audit_log -> audit_reason_code (0018) empêche de supprimer un motif déjà
    # cité par d'autres tests de la session : on retire d'abord leurs traces d'audit.
    instance.sql(
        "DELETE FROM audit_log WHERE reason_code_id IN "
        "(SELECT id FROM audit_reason_code WHERE code = ANY(%s))",
        (list(_CODES),),
    )
    # État d'une base 3.57.0 : motifs absents, LEGACY_STATUS_CHANGE actif.
    instance.sql("DELETE FROM audit_reason_code WHERE code = ANY(%s)", (list(_CODES),))
    instance.sql(
        "UPDATE audit_reason_code SET is_active = true WHERE code = 'LEGACY_STATUS_CHANGE'"
    )
    # Un motif personnalisé depuis l'administration ne doit pas être écrasé.
    instance.sql(
        "INSERT INTO audit_reason_code (id, code, label, category, is_active) SELECT "
        "COALESCE(MAX(id), 0) + 1, 'TASK_DUPLICATE', 'Mon doublon', 'user', false "
        "FROM audit_reason_code"
    )
    _jouer(instance, module.upgrade_statements())
    apres = {ligne[0]: ligne for ligne in instance.sql(_ETAT, (list(_CODES),))}
    attendu = {ligne[0]: ligne for ligne in reference}
    for code in _CODES:
        if code == "TASK_DUPLICATE":
            assert apres[code][1] == "Mon doublon"
        else:
            assert apres[code] == attendu[code]
    assert apres["LEGACY_STATUS_CHANGE"][7] is False
    # La séquence ne heurte aucun id existant.
    suivant = instance.sql(
        "SELECT nextval('audit_reason_code_id_seq') > (SELECT MAX(id) FROM audit_reason_code)"
    )
    assert suivant == [(True,)]

    # Retour arrière : un motif référencé par audit_log reste, les autres partent.
    instance.sql(
        "INSERT INTO audit_log (entity_type, entity_id, decision_type, reason_code_id) "
        "SELECT 'task', gen_random_uuid(), 'task_skipped', id FROM audit_reason_code "
        "WHERE code = 'TASK_NO_LONGER_NEEDED'"
    )
    _jouer(instance, module.downgrade_statements())
    restants = instance.sql(
        "SELECT code FROM audit_reason_code WHERE code = ANY(%s)", (list(_CODES),)
    )
    assert restants == [("TASK_NO_LONGER_NEEDED",)]
    assert instance.sql(
        "SELECT is_active FROM audit_reason_code WHERE code = 'LEGACY_STATUS_CHANGE'"
    ) == [(True,)]

    # Remise de la base de test dans son état de départ.
    instance.sql(
        "DELETE FROM audit_log WHERE reason_code_id = "
        "(SELECT id FROM audit_reason_code WHERE code = 'TASK_NO_LONGER_NEEDED')"
    )
    instance.sql("DELETE FROM audit_reason_code WHERE code = ANY(%s)", (list(_CODES),))
    _jouer(instance, module.upgrade_statements())
    assert instance.sql(_ETAT, (list(_CODES),)) == reference
