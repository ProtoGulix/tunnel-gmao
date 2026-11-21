"""Motifs de réouverture d'une intervention (REO-01, ADR 0028, CLAUDE.md 2.4)

Rouvrir une intervention fermée est une décision hors du travail normal : elle exige un motif
choisi dans la fenêtre commune. Cette migration :
- ajoute deux motifs de catégorie user, entité intervention, décision intervention_reopened
  (clôturée par erreur, travail à reprendre) ;
- ajoute la décision intervention_reopened à OTHER (texte libre obligatoire).
Idempotent.

Effet sur les données : jusqu'à deux lignes ajoutées dans audit_reason_code ; OTHER modifié
(une décision ajoutée). Aucune intervention, aucun audit_log touché. Retour arrière : le
downgrade retire la décision de OTHER et supprime les motifs seulement si aucun audit_log ne
les référence (la clé étrangère audit_log_reason_code_id_fkey, posée par 0018, refuserait la
suppression ; et une trace doit garder un motif lisible).

Revision ID: 0021_motifs_reouverture
Revises: 0020_types_intervention_en_base
Create Date: 2026-11-20
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0021_motifs_reouverture"
down_revision: Union[str, None] = "0020_types_intervention_en_base"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

# (code, libellé, couleur, description) : littéraux fixes, quotes doublées.
_MOTIFS = (
    (
        "INTERVENTION_CLOSED_BY_MISTAKE",
        "Clôturée par erreur",
        "#d97706",
        "L''intervention a été fermée par erreur : elle n''était pas terminée.",
    ),
    (
        "INTERVENTION_REWORK",
        "Travail à reprendre",
        "#dc2626",
        "Le travail est à reprendre : le défaut est revenu ou la réparation est incomplète.",
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
            f"'{code}', '{label}', 'user', '{{intervention}}', "
            f"'{{intervention_reopened}}', '{color}', '{description}', true WHERE NOT EXISTS "
            f"(SELECT 1 FROM public.audit_reason_code WHERE code = '{code}') "
            "ON CONFLICT (code) DO NOTHING"
        )
    statements += [
        "UPDATE public.audit_reason_code SET decision_types = "
        "array_append(COALESCE(decision_types, '{}'), 'intervention_reopened') "
        "WHERE code = 'OTHER' AND decision_types IS NOT NULL "
        "AND NOT ('intervention_reopened' = ANY(decision_types))",
        # Séquence recalée (nommée explicitement : pas de OWNED BY, voir 0004) sans reculer.
        f"SELECT setval('{_SEQ}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM "
        f"public.audit_reason_code), (SELECT last_value FROM {_SEQ})))",
    ]
    return statements


def downgrade_statements() -> list[str]:
    codes = ", ".join(f"'{motif[0]}'" for motif in _MOTIFS)
    return [
        "UPDATE public.audit_reason_code SET decision_types = "
        "array_remove(decision_types, 'intervention_reopened') WHERE code = 'OTHER' "
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
