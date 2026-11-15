"""Règles d'audit des entités de l'étape 3 (ADR 0018, AUDC-32)

Les routes de l'étape 3 déclarent chacune une entité d'audit : plan préventif, pièce et ses
références fabricant et fournisseur, article fabricant, article de stock, sous-famille de
stock, lien article-fournisseur, fournisseur, ligne de commande fournisseur. Sans règle
audit_rule ni place dans les entity_types du motif ROUTINE, la route répond 400. Cette
migration ajoute, pour chaque entité, la règle routinière (entité, field NULL, ROUTINE) et
l'entité dans les entity_types de ROUTINE (décision utilisateur du 2026-11-14 : tout est
routinier, sauf la suppression qui exige un motif explicite).
Idempotent : sans effet pour une règle ou une entité déjà présente.

Effet sur les données : jusqu'à dix lignes ajoutées dans audit_rule, entity_types de ROUTINE
complété d'autant de valeurs ; aucune autre ligne modifiée. Retour arrière : le downgrade
retire ces règles et ces entités de ROUTINE ; les séquences ne sont pas reculées.

Revision ID: 0010_audit_entites_etape_3
Revises: 0009_motifs_suppression
Create Date: 2026-11-14
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0010_audit_entites_etape_3"
down_revision: Union[str, None] = "0009_motifs_suppression"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

_ENTITES = (
    "preventive_plan",
    "part",
    "part_manufacturer_ref",
    "part_supplier_ref",
    "manufacturer_item",
    "stock_item",
    "stock_sub_family",
    "stock_item_supplier",
    "supplier",
    "supplier_order_line",
)


def upgrade() -> None:
    for entite in _ENTITES:
        op.execute(
            "UPDATE public.audit_reason_code SET entity_types = "
            f"array_append(COALESCE(entity_types, '{{}}'), '{entite}') "
            "WHERE code = 'ROUTINE' AND entity_types IS NOT NULL "
            f"AND NOT ('{entite}' = ANY(entity_types))"
        )
        op.execute(
            # Identifiant par sous-requête : un agrégat sans GROUP BY renvoie toujours une
            # ligne, le WHERE NOT EXISTS ne suffirait pas à rendre l'insertion idempotente.
            "INSERT INTO public.audit_rule (id, entity_type, field, is_routine, "
            "default_reason_code) "
            "SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), "
            f"'{entite}', NULL, true, 'ROUTINE' "
            "WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule "
            f"WHERE entity_type = '{entite}' AND field IS NULL)"
        )
    # Séquence recalée sans jamais reculer (voir 0004).
    seq = "public.audit_rule_id_seq"
    op.execute(
        f"SELECT setval('{seq}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM "
        f"public.audit_rule), (SELECT last_value FROM {seq})))"
    )


def downgrade() -> None:
    for entite in _ENTITES:
        op.execute(
            f"DELETE FROM public.audit_rule WHERE entity_type = '{entite}' AND field IS NULL"
        )
        op.execute(
            "UPDATE public.audit_reason_code SET entity_types = "
            f"array_remove(entity_types, '{entite}') WHERE code = 'ROUTINE'"
        )
