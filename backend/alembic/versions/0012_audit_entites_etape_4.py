"""Règles d'audit des entités de l'étape 4 (ADR 0018, AUDC-42)

Les routes de l'étape 4 (référentiels, administration, clés d'API, utilisateurs, accueil)
déclarent chacune une entité d'audit : utilisateur, permission, endpoint, blocage d'IP, règle
de domaine de courriel, clé d'API, classe d'équipement, service, vue d'accueil par rôle,
catégorie et sous-catégorie d'action, type et statut d'intervention, motif d'audit, règle
d'audit. Sans règle audit_rule ni place dans les entity_types du motif ROUTINE, la route
répond 400. Cette migration ajoute, pour chaque entité, la règle routinière (entité, field
NULL, ROUTINE) et l'entité dans les entity_types de ROUTINE (décision 9 : tout est routinier,
sauf la suppression qui exige un motif explicite ; les motifs de suppression ont entity_types
NULL et s'appliquent déjà à toutes les entités).
Idempotent : sans effet pour une règle ou une entité déjà présente.

Effet sur les données : jusqu'à quinze lignes ajoutées dans audit_rule, entity_types de ROUTINE
complété d'autant de valeurs ; aucune autre ligne modifiée. Retour arrière : le downgrade
retire ces règles et ces entités de ROUTINE ; les séquences ne sont pas reculées.

Revision ID: 0012_audit_entites_etape_4
Revises: 0011_audit_famille_stock
Create Date: 2026-11-14
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0012_audit_entites_etape_4"
down_revision: Union[str, None] = "0011_audit_famille_stock"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

_ENTITES = (
    "user",
    "permission",
    "endpoint",
    "ip_block",
    "email_domain_rule",
    "api_key",
    "equipement_class",
    "service",
    "role_home_view",
    "action_category",
    "action_subcategory",
    "intervention_type",
    "intervention_status",
    "audit_reason",
    "audit_rule",
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
