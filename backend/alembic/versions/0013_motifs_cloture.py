"""Motifs de clôture d'une tâche sans action (ADR 0016) sur les bases déjà installées

Les quatre motifs TASK_DONE_UNRECORDED, TASK_HANDLED_ELSEWHERE, TASK_NO_LONGER_NEEDED et
TASK_DUPLICATE, avec leurs decision_types, et la désactivation de LEGACY_STATUS_CHANGE
n'étaient posés que par la seed (base neuve) et à la main sur la base de dev. Une base
installée avant la seed de ces motifs (dont la production 3.57.0) ne les avait pas : la
fenêtre de motif n'y proposait que OTHER et « Changement historique » y restait visible.
Les lignes sont identiques à celles de db/seed_reference.sql. Pour OTHER, rien à faire :
la migration 0009 lui pose déjà entity_types NULL et decision_types
{task_done,task_skipped,deleted}, ce qui couvre la clôture et l'annulation de tâche.

Idempotent : sans effet sur une base qui a déjà ces lignes (base neuve, base de dev). Un
motif existant n'est ni modifié ni écrasé (ON CONFLICT (code) DO NOTHING), y compris s'il a
été personnalisé depuis l'administration.

Effet sur les données : jusqu'à quatre lignes ajoutées dans audit_reason_code ;
LEGACY_STATUS_CHANGE passe à inactif (is_active) ; aucune trace d'audit existante touchée
(les traces migrées gardent leur motif, il n'est simplement plus proposé). Retour arrière :
le downgrade réactive LEGACY_STATUS_CHANGE et retire chaque motif ajouté seulement si aucun
audit_log ne le référence (pas de clé étrangère : le supprimer laisserait des traces sans
motif lisible) ; sinon il le laisse. La séquence n'est pas reculée.

Revision ID: 0013_motifs_cloture
Revises: 0012_audit_entites_etape_4
Create Date: 2026-11-15
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0013_motifs_cloture"
down_revision: Union[str, None] = "0012_audit_entites_etape_4"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

# (code, libellé, decision_types, couleur, description) : littéraux fixes, quotes doublées.
_MOTIFS = (
    (
        "TASK_DONE_UNRECORDED",
        "Réalisée sans action saisie",
        "{task_done}",
        "#16a34a",
        "Le travail a été fait mais aucune action n''a été saisie ; constaté en réunion "
        "de coordination.",
    ),
    (
        "TASK_HANDLED_ELSEWHERE",
        "Traitée dans une autre intervention",
        "{task_done,task_skipped}",
        "#0ea5e9",
        "Le besoin a été traité par une autre intervention ou une autre tâche.",
    ),
    (
        "TASK_NO_LONGER_NEEDED",
        "Plus nécessaire",
        "{task_skipped}",
        "#d97706",
        "Le besoin a disparu : situation résolue, équipement remplacé ou arrêté.",
    ),
    (
        "TASK_DUPLICATE",
        "Doublon",
        "{task_skipped}",
        "#6b7280",
        "La même tâche existe déjà.",
    ),
)

_SEQ = "public.audit_reason_code_id_seq"


def upgrade_statements() -> list[str]:
    """Instructions de upgrade, exposées pour que les tests les rejouent sur une base."""
    statements = []
    for code, label, decisions, color, description in _MOTIFS:
        # Identifiant par sous-requête, comme 0009 ; ON CONFLICT couvre le code déjà pris.
        statements.append(
            "INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, "
            "decision_types, color, description, is_active) SELECT "
            "(SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), "
            f"'{code}', '{label}', 'user', '{{task}}', '{decisions}', '{color}', "
            f"'{description}', true WHERE NOT EXISTS (SELECT 1 FROM "
            f"public.audit_reason_code WHERE code = '{code}') ON CONFLICT (code) DO NOTHING"
        )
    statements.append(
        "UPDATE public.audit_reason_code SET is_active = false "
        "WHERE code = 'LEGACY_STATUS_CHANGE' AND is_active"
    )
    # Séquence recalée (nommée explicitement : pas de OWNED BY, voir 0004) sans jamais reculer.
    statements.append(
        f"SELECT setval('{_SEQ}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM "
        f"public.audit_reason_code), (SELECT last_value FROM {_SEQ})))"
    )
    return statements


def downgrade_statements() -> list[str]:
    codes = ", ".join(f"'{motif[0]}'" for motif in _MOTIFS)
    return [
        "UPDATE public.audit_reason_code SET is_active = true "
        "WHERE code = 'LEGACY_STATUS_CHANGE' AND NOT is_active",
        f"DELETE FROM public.audit_reason_code r WHERE r.code IN ({codes}) "
        "AND NOT EXISTS (SELECT 1 FROM public.audit_log l WHERE l.reason_code_id = r.id)",
    ]


def upgrade() -> None:
    for statement in upgrade_statements():
        op.execute(statement)


def downgrade() -> None:
    for statement in downgrade_statements():
        op.execute(statement)
