"""Migration 0021 : motifs de réouverture d'une intervention, base neuve et ancienne (REO-01)."""

import importlib.util
from pathlib import Path

import pytest

pytestmark = pytest.mark.integration

_MIGRATION = Path(__file__).resolve().parents[2] / "alembic/versions/0021_motifs_reouverture.py"
_CODES = ("INTERVENTION_CLOSED_BY_MISTAKE", "INTERVENTION_REWORK")
_ETAT = (
    "SELECT code, label, category, entity_types, decision_types, is_active "
    "FROM audit_reason_code WHERE code = ANY(%s) OR code = 'OTHER' ORDER BY code"
)


def _references(instance):
    """Motifs de la migration déjà cités par le journal : le retour arrière les garde (FK)."""
    lignes = instance.sql(
        "SELECT DISTINCT r.code FROM audit_log l JOIN audit_reason_code r "
        "ON r.id = l.reason_code_id WHERE r.code = ANY(%s)",
        (list(_CODES),),
    )
    return {code for (code,) in lignes}


def _etat(instance):
    """État des motifs ; l'ordre des décisions d'un tableau n'a pas de sens, on le normalise."""
    lignes = instance.sql(_ETAT, (list(_CODES),))
    return [(*ligne[:4], sorted(ligne[4] or []), ligne[5]) for ligne in lignes]


def _migration():
    spec = importlib.util.spec_from_file_location("migration_0021", _MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_revision_et_parent():
    module = _migration()
    assert module.revision == "0021_motifs_reouverture"
    assert module.down_revision == "0020_types_intervention_en_base"


def test_base_neuve_a_l_etat_attendu_et_rejouer_ne_change_rien(instance):
    module = _migration()
    avant = instance.sql(_ETAT, (list(_CODES),))
    assert [ligne[0] for ligne in avant if ligne[0] != "OTHER"] == sorted(_CODES)
    erreur = [ligne for ligne in avant if ligne[0] == "INTERVENTION_CLOSED_BY_MISTAKE"][0]
    assert erreur[1:] == (
        "Clôturée par erreur",
        "user",
        ["intervention"],
        ["intervention_reopened"],
        True,
    )
    autre = [ligne for ligne in avant if ligne[0] == "OTHER"][0]
    assert "intervention_reopened" in autre[4]
    for statement in module.upgrade_statements():
        instance.sql(statement)
    assert instance.sql(_ETAT, (list(_CODES),)) == avant


def test_retour_arriere_puis_remontee(instance):
    module = _migration()
    reference = _etat(instance)
    gardes = _references(instance)
    for statement in module.downgrade_statements():
        instance.sql(statement)
    apres = {ligne[0]: ligne for ligne in instance.sql(_ETAT, (list(_CODES),))}
    assert set(apres) == {"OTHER"} | gardes
    assert "intervention_reopened" not in apres["OTHER"][4]
    for statement in module.upgrade_statements():
        instance.sql(statement)
    assert _etat(instance) == reference
