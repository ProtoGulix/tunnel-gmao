"""Motifs de remise à faire d'une tâche (REM-01, ADR 0042)

Remettre à faire une tâche terminée ou annulée est une correction hors du travail normal :
elle exige un motif choisi dans la fenêtre commune. Cette migration pose la décision
`task_reopened` (utilisée par REM-02 pour filtrer et valider le motif). Elle :
- ajoute deux motifs de catégorie user, entité task, décision task_reopened ;
- ajoute la décision task_reopened à OTHER (texte libre obligatoire).
Idempotent.

Effet sur les données : jusqu'à deux lignes ajoutées dans audit_reason_code ; OTHER reçoit
une décision de plus. Aucune donnée utilisateur modifiée. Retour arrière : le downgrade retire
la décision de OTHER et supprime les motifs seulement si aucun audit_log ne les référence
(clé étrangère audit_log_reason_code_id_fkey : une trace doit garder un motif lisible).

Revision ID: 0027_motifs_remise_a_faire
Revises: 0026_archivage_irrevocable
Create Date: 2026-11-22
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0027_motifs_remise_a_faire"
down_revision: Union[str, None] = "0026_archivage_irrevocable"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

# (code, libellé, couleur, description) : littéraux fixes, quotes doublées.
_MOTIFS = (
    (
        "TASK_CLOSED_BY_MISTAKE",
        "Clôturée par erreur",
        "#d97706",
        "La tâche a été terminée ou annulée par erreur.",
    ),
    (
        "TASK_REWORK",
        "Travail à reprendre",
        "#dc2626",
        "Le travail de la tâche est à reprendre.",
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
            f"'{code}', '{label}', 'user', '{{task}}', "
            f"'{{task_reopened}}', '{color}', '{description}', true WHERE NOT EXISTS "
            f"(SELECT 1 FROM public.audit_reason_code WHERE code = '{code}') "
            "ON CONFLICT (code) DO NOTHING"
        )
    statements += [
        "UPDATE public.audit_reason_code SET decision_types = "
        "array_append(COALESCE(decision_types, '{}'), 'task_reopened') "
        "WHERE code = 'OTHER' AND decision_types IS NOT NULL "
        "AND NOT ('task_reopened' = ANY(decision_types))",
        # Séquence recalée (nommée explicitement : pas de OWNED BY, voir 0004) sans reculer.
        f"SELECT setval('{_SEQ}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM "
        f"public.audit_reason_code), (SELECT last_value FROM {_SEQ})))",
    ]
    return statements


def downgrade_statements() -> list[str]:
    codes = ", ".join(f"'{motif[0]}'" for motif in _MOTIFS)
    return [
        "UPDATE public.audit_reason_code SET decision_types = "
        "array_remove(decision_types, 'task_reopened') WHERE code = 'OTHER' "
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
