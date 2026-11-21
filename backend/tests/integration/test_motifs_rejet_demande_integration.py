"""Migration 0024 : motifs de rejet d'une demande (REJ-01, ADR 0038)."""

import importlib.util
from pathlib import Path

import pytest

pytestmark = pytest.mark.integration

_MIGRATION = Path(__file__).resolve().parents[2] / "alembic/versions/0024_motifs_rejet_demande.py"
_MOTIFS = {
    "REJECT_OUT_OF_SCOPE": "Hors du périmètre de la maintenance",
    "REJECT_DUPLICATE": "Doublon d'une demande existante",
    "REJECT_ALREADY_HANDLED": "Déjà traité",
    "REJECT_INCOMPLETE": "Demande incomplète ou incompréhensible",
}
_ETAT = (
    "SELECT code, label, category, entity_types, decision_types, is_active "
    "FROM audit_reason_code WHERE code LIKE 'REJECT\\_%%' OR code = 'OTHER' ORDER BY code"
)
_PROPOSES = (
    "SELECT code FROM audit_reason_code WHERE is_active AND %s = ANY(decision_types) "
    "AND (entity_types IS NULL OR 'request' = ANY(entity_types)) ORDER BY code"
)


def _migration():
    spec = importlib.util.spec_from_file_location("migration_0024", _MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_revision_et_parent():
    module = _migration()
    assert module.revision == "0024_motifs_rejet_demande"
    assert module.down_revision == "0023_types_par_classe"


def test_motifs_de_rejet_presents_avec_leur_decision(instance):
    lignes = instance.sql(
        "SELECT code, label, category, entity_types, decision_types, is_active "
        "FROM audit_reason_code WHERE code LIKE 'REJECT\\_%%' ORDER BY code"
    )
    assert {ligne[0]: ligne[1] for ligne in lignes} == _MOTIFS
    for _, _, categorie, entites, decisions, actif in lignes:
        assert (categorie, entites, decisions, actif) == (
            "user",
            ["request"],
            ["request_rejected"],
            True,
        )


def test_proposes_au_rejet_et_pas_a_l_acceptation(instance):
    rejet = {ligne[0] for ligne in instance.sql(_PROPOSES, ("request_rejected",))}
    assert rejet == set(_MOTIFS) | {"OTHER"}
    for decision in ("updated", "created", "task_done"):
        acceptation = {ligne[0] for ligne in instance.sql(_PROPOSES, (decision,))}
        assert not acceptation & set(_MOTIFS)


def test_rejouer_ne_cree_ni_doublon_ni_changement(instance):
    avant = instance.sql(_ETAT)
    for statement in _migration().upgrade_statements():
        instance.sql(statement)
    assert instance.sql(_ETAT) == avant
    assert instance.sql("SELECT count(*) FROM audit_reason_code WHERE code LIKE 'REJECT\\_%%'") == [
        (4,)
    ]
