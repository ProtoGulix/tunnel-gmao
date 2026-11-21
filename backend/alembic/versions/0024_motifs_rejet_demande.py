"""Motifs de rejet d'une demande d'intervention (REJ-01, ADR 0038)

Rejeter une demande est une décision hors du travail normal : elle exige un motif choisi
dans la fenêtre commune. Une transition de demande n'a pas de type de décision propre
(toute transition est tracée « updated ») ; cette migration pose donc le type de décision
`request_rejected`, que la route de transition (REJ-02) utilisera pour filtrer et valider
le motif, comme `intervention_reopened` pour la réouverture. Elle :
- ajoute quatre motifs de catégorie user, entité request, décision request_rejected ;
- ajoute la décision request_rejected à OTHER (texte libre obligatoire).
Idempotent.

Effet sur les données : jusqu'à quatre lignes ajoutées dans audit_reason_code ; OTHER reçoit
une décision de plus. Aucune donnée utilisateur modifiée. Retour arrière : le downgrade retire
la décision de OTHER et supprime les motifs seulement si aucun audit_log ne les référence
(clé étrangère audit_log_reason_code_id_fkey : une trace doit garder un motif lisible).

Revision ID: 0024_motifs_rejet_demande
Revises: 0023_types_par_classe
Create Date: 2026-11-21
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0024_motifs_rejet_demande"
down_revision: Union[str, None] = "0023_types_par_classe"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

# (code, libellé, couleur, description) : littéraux fixes, quotes doublées.
_MOTIFS = (
    (
        "REJECT_OUT_OF_SCOPE",
        "Hors du périmètre de la maintenance",
        "#6b7280",
        "La demande ne relève pas de la maintenance.",
    ),
    (
        "REJECT_DUPLICATE",
        "Doublon d''une demande existante",
        "#d97706",
        "Une demande existante couvre déjà ce besoin.",
    ),
    (
        "REJECT_ALREADY_HANDLED",
        "Déjà traité",
        "#16a34a",
        "Le problème signalé a déjà été traité.",
    ),
    (
        "REJECT_INCOMPLETE",
        "Demande incomplète ou incompréhensible",
        "#dc2626",
        "La demande ne permet pas de savoir quoi faire : informations manquantes ou peu claires.",
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
            f"'{code}', '{label}', 'user', '{{request}}', "
            f"'{{request_rejected}}', '{color}', '{description}', true WHERE NOT EXISTS "
            f"(SELECT 1 FROM public.audit_reason_code WHERE code = '{code}') "
            "ON CONFLICT (code) DO NOTHING"
        )
    statements += [
        "UPDATE public.audit_reason_code SET decision_types = "
        "array_append(COALESCE(decision_types, '{}'), 'request_rejected') "
        "WHERE code = 'OTHER' AND decision_types IS NOT NULL "
        "AND NOT ('request_rejected' = ANY(decision_types))",
        # Séquence recalée (nommée explicitement : pas de OWNED BY, voir 0004) sans reculer.
        f"SELECT setval('{_SEQ}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM "
        f"public.audit_reason_code), (SELECT last_value FROM {_SEQ})))",
    ]
    return statements


def downgrade_statements() -> list[str]:
    codes = ", ".join(f"'{motif[0]}'" for motif in _MOTIFS)
    return [
        "UPDATE public.audit_reason_code SET decision_types = "
        "array_remove(decision_types, 'request_rejected') WHERE code = 'OTHER' "
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
