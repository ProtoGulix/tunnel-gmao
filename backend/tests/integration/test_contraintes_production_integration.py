"""Migration 0018 (CONT-01, ADR 0024) : contraintes et index de la production sur une base neuve."""

import importlib.util
from pathlib import Path

import psycopg2
import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine

from tests.integration.test_taches_ignorer_integration import _intervention

pytestmark = pytest.mark.integration

_MIGRATION = Path(__file__).resolve().parents[2] / "alembic/versions/0018_contraintes_production.py"
_ZERO = "00000000-0000-0000-0000-000000000000"
# Posée par 0018 puis retirée par 0020 (la clé étrangère vers intervention_type la remplace).
_RETIREES_PAR_0020 = {"chk_suggested_type_inter"}


def _migration():
    spec = importlib.util.spec_from_file_location("migration_0018", _MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _objets(instance):
    contraintes = instance.sql(
        "SELECT conname FROM pg_constraint WHERE connamespace = 'public'::regnamespace "
        "AND contype IN ('f', 'c')"
    )
    index = instance.sql("SELECT indexname FROM pg_indexes WHERE schemaname = 'public'")
    return {r[0] for r in contraintes} - _RETIREES_PAR_0020, {r[0] for r in index}


def test_inventaire_complet_present_par_nom(instance):
    migration = _migration()
    assert (len(migration._FOREIGN_KEYS), len(migration._CHECKS), len(migration._INDEXES)) == (
        72,
        15,
        65,
    )
    contraintes, index = _objets(instance)
    attendues = {n for _t, n, _d in migration._FOREIGN_KEYS + migration._CHECKS}
    attendues -= _RETIREES_PAR_0020
    assert attendues <= contraintes
    assert {n for _t, n, _c in migration._INDEXES} <= index


def test_migration_rejouee_sans_effet(instance):
    avant = _objets(instance)
    engine = create_engine(instance.owner_url.replace("postgresql://", "postgresql+psycopg2://"))
    try:
        with engine.begin() as conn:
            with Operations.context(MigrationContext.configure(conn)):
                _migration().upgrade()
    finally:
        engine.dispose()
        # Rejouer 0018 repose le CHECK que 0020 a retiré : on rétablit l'état de la session,
        # sinon les tests suivants (types ajoutés en administration) seraient refusés.
        instance.sql(
            "ALTER TABLE public.intervention_request DROP CONSTRAINT IF EXISTS "
            "chk_suggested_type_inter"
        )
    assert _objets(instance) == avant


def test_cle_etrangere_refuse_une_demande_sur_machine_inconnue(instance):
    with pytest.raises(psycopg2.errors.ForeignKeyViolation):
        instance.sql(
            "INSERT INTO intervention_request (machine_id, demandeur_nom, description, statut) "
            "VALUES (%s, 'Atelier', 'Fuite', 'nouvelle')",
            (_ZERO,),
        )


def test_check_tache_ignoree_sans_motif_refusee(client, admin, instance):
    intervention_id, _ = _intervention(client, admin, instance)
    with pytest.raises(psycopg2.errors.CheckViolation):
        instance.sql(
            "INSERT INTO intervention_task (intervention_id, label, origin, status) "
            "VALUES (%s, 'Graisser', 'tech', 'skipped')",
            (intervention_id,),
        )


def test_check_quantite_nulle_refusee(instance):
    with pytest.raises(psycopg2.errors.CheckViolation):
        instance.sql(
            "INSERT INTO purchase_request (code, item_label, quantity) VALUES ('DA-TEST', 'Roulement', 0)"
        )
