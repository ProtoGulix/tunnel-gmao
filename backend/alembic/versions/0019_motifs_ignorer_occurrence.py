"""Motifs pour ignorer une occurrence préventive (CONT-03, CLAUDE.md 2.4)

Ignorer une occurrence est une décision hors du travail normal : elle exige un motif choisi
dans la fenêtre commune, plus une raison libre injectée en ROUTINE. Cette migration :
- ajoute trois motifs de catégorie user, entité preventive_occurrence, décision
  occurrence_skipped (machine arrêtée, fait hors de l'outil, plan obsolète) ;
- ajoute la décision occurrence_skipped à OTHER (texte libre obligatoire, déjà applicable
  à toutes les entités) ;
- rend la règle d'audit de l'entité non routinière et retire l'entité des entity_types de
  ROUTINE : plus d'injection automatique, le motif est demandé (400 sans motif).
Idempotent.

Effet sur les données : jusqu'à trois lignes ajoutées dans audit_reason_code ; OTHER, ROUTINE
et la règle de preventive_occurrence modifiés. Retour arrière : le downgrade restaure la
règle routinière et les entity_types/decision_types, et retire les motifs seulement si aucun
audit_log ne les référence (la clé étrangère audit_log_reason_code_id_fkey, posée par 0018,
refuserait la suppression ; et une trace doit garder un motif lisible).

Revision ID: 0019_motifs_ignorer_occurrence
Revises: 0018_contraintes_production
Create Date: 2026-11-19
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0019_motifs_ignorer_occurrence"
down_revision: Union[str, None] = "0018_contraintes_production"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

# (code, libellé, couleur, description) : littéraux fixes, quotes doublées.
_MOTIFS = (
    (
        "OCCURRENCE_MACHINE_DOWN",
        "Machine arrêtée",
        "#d97706",
        "L''équipement est à l''arrêt : le préventif ne peut pas être réalisé à cette échéance.",
    ),
    (
        "OCCURRENCE_DONE_OFFLINE",
        "Fait hors de l''outil",
        "#16a34a",
        "Le préventif a été réalisé sans être saisi dans l''outil.",
    ),
    (
        "OCCURRENCE_PLAN_OBSOLETE",
        "Plan obsolète",
        "#6b7280",
        "Le plan préventif ne correspond plus à l''équipement ou à son usage.",
    ),
)

_SEQ = "public.audit_reason_code_id_seq"


def upgrade_statements() -> list[str]:
    """Instructions de upgrade, exposées pour que les tests les rejouent sur une base."""
    statements = []
    for code, label, color, description in _MOTIFS:
        statements.append(
            "INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, "
            "decision_types, color, description, is_active) SELECT "
            "(SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), "
            f"'{code}', '{label}', 'user', '{{preventive_occurrence}}', "
            f"'{{occurrence_skipped}}', '{color}', '{description}', true WHERE NOT EXISTS "
            f"(SELECT 1 FROM public.audit_reason_code WHERE code = '{code}') "
            "ON CONFLICT (code) DO NOTHING"
        )
    statements += [
        "UPDATE public.audit_reason_code SET decision_types = "
        "array_append(COALESCE(decision_types, '{}'), 'occurrence_skipped') "
        "WHERE code = 'OTHER' AND decision_types IS NOT NULL "
        "AND NOT ('occurrence_skipped' = ANY(decision_types))",
        "UPDATE public.audit_reason_code SET "
        "entity_types = array_remove(entity_types, 'preventive_occurrence') "
        "WHERE code = 'ROUTINE' AND entity_types IS NOT NULL",
        "UPDATE public.audit_rule SET is_routine = false, default_reason_code = NULL "
        "WHERE entity_type = 'preventive_occurrence' AND field IS NULL AND is_routine",
        # Séquence recalée (nommée explicitement : pas de OWNED BY, voir 0004) sans reculer.
        f"SELECT setval('{_SEQ}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM "
        f"public.audit_reason_code), (SELECT last_value FROM {_SEQ})))",
    ]
    return statements


def downgrade_statements() -> list[str]:
    codes = ", ".join(f"'{motif[0]}'" for motif in _MOTIFS)
    return [
        "UPDATE public.audit_rule SET is_routine = true, default_reason_code = 'ROUTINE' "
        "WHERE entity_type = 'preventive_occurrence' AND field IS NULL AND NOT is_routine",
        "UPDATE public.audit_reason_code SET entity_types = "
        "array_append(entity_types, 'preventive_occurrence') WHERE code = 'ROUTINE' "
        "AND entity_types IS NOT NULL AND NOT ('preventive_occurrence' = ANY(entity_types))",
        "UPDATE public.audit_reason_code SET decision_types = "
        "array_remove(decision_types, 'occurrence_skipped') WHERE code = 'OTHER' "
        "AND decision_types IS NOT NULL",
        f"DELETE FROM public.audit_reason_code r WHERE r.code IN ({codes}) "
        "AND NOT EXISTS (SELECT 1 FROM public.audit_log l WHERE l.reason_code_id = r.id)",
    ]


def upgrade() -> None:
    for statement in upgrade_statements():
        op.execute(statement)


def downgrade() -> None:
    for statement in downgrade_statements():
        op.execute(statement)
