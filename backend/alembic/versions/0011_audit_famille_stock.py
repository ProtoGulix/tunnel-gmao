"""Règle d'audit de la famille de stock (ADR 0018, AUDC-34)

Une famille de stock n'a qu'un code texte comme clé ; ses routes sont tracées sous un uuid
déterministe du code (api/audits/entity_ids.py). Comme pour les entités de 0010, la route
répond 400 sans règle audit_rule ni place dans les entity_types du motif ROUTINE. Cette
migration ajoute la règle routinière (stock_family, field NULL, ROUTINE) et l'entité dans les
entity_types de ROUTINE. Idempotent : sans effet si déjà présent.

Effet sur les données : une ligne ajoutée dans audit_rule, entity_types de ROUTINE complété
d'une valeur ; aucune autre ligne modifiée. Retour arrière : le downgrade retire la règle et
l'entité de ROUTINE ; la séquence n'est pas reculée.

Revision ID: 0011_audit_famille_stock
Revises: 0010_audit_entites_etape_3
Create Date: 2026-11-14
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0011_audit_famille_stock"
down_revision: Union[str, None] = "0010_audit_entites_etape_3"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

_ENTITE = "stock_family"


def upgrade() -> None:
    op.execute(
        "UPDATE public.audit_reason_code SET entity_types = "
        f"array_append(COALESCE(entity_types, '{{}}'), '{_ENTITE}') "
        "WHERE code = 'ROUTINE' AND entity_types IS NOT NULL "
        f"AND NOT ('{_ENTITE}' = ANY(entity_types))"
    )
    op.execute(
        # Identifiant par sous-requête : voir 0010 (un agrégat sans GROUP BY renvoie toujours
        # une ligne, le WHERE NOT EXISTS seul ne rendrait pas l'insertion idempotente).
        "INSERT INTO public.audit_rule (id, entity_type, field, is_routine, "
        "default_reason_code) "
        "SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), "
        f"'{_ENTITE}', NULL, true, 'ROUTINE' "
        "WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule "
        f"WHERE entity_type = '{_ENTITE}' AND field IS NULL)"
    )
    # Séquence recalée sans jamais reculer (voir 0004).
    seq = "public.audit_rule_id_seq"
    op.execute(
        f"SELECT setval('{seq}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM "
        f"public.audit_rule), (SELECT last_value FROM {seq})))"
    )


def downgrade() -> None:
    op.execute(f"DELETE FROM public.audit_rule WHERE entity_type = '{_ENTITE}' AND field IS NULL")
    op.execute(
        "UPDATE public.audit_reason_code SET entity_types = "
        f"array_remove(entity_types, '{_ENTITE}') WHERE code = 'ROUTINE'"
    )
