"""Motifs de suppression (ADR 0018, point 5 ; AUDC-30)

Toute suppression exige un motif explicite, or la fenêtre de motif n'avait rien à proposer
pour supprimer une action, une commande fournisseur ou un équipement. Cette migration ajoute
DELETE_CREATED_BY_MISTAKE (« Créé par erreur ») et DELETE_DUPLICATE (« Doublon »), catégorie
user, toutes entités, décision deleted. OTHER devient applicable à toutes les entités
(entity_types NULL) et à la décision deleted en plus de task_done et task_skipped.
Idempotent : sans effet si les motifs existent déjà et si OTHER est déjà à jour.

Effet sur les données : deux lignes ajoutées dans audit_reason_code ; OTHER modifié
(entity_types, decision_types) ; aucune trace d'audit existante touchée. Retour arrière : le
downgrade rend à OTHER ses valeurs d'avant et retire chaque motif ajouté seulement si aucun
audit_log ne le référence (pas de clé étrangère : le supprimer laisserait des traces sans
motif lisible) ; la séquence n'est pas reculée.

Revision ID: 0009_motifs_suppression
Revises: 0008_audit_occurrence_preventive
Create Date: 2026-11-14
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0009_motifs_suppression"
down_revision: Union[str, None] = "0008_audit_occurrence_preventive"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

# (code, libellé, couleur, description)
_MOTIFS = (
    (
        "DELETE_CREATED_BY_MISTAKE",
        "Créé par erreur",
        "#dc2626",
        "L''élément a été créé par erreur et n''aurait pas dû exister.",
    ),
    (
        "DELETE_DUPLICATE",
        "Doublon",
        "#6b7280",
        "L''élément existe déjà ailleurs ; on supprime le doublon.",
    ),
)


def upgrade() -> None:
    for code, label, color, description in _MOTIFS:
        # Identifiant par sous-requête : un agrégat sans GROUP BY renvoie toujours une ligne,
        # le WHERE NOT EXISTS seul ne suffirait pas ; ON CONFLICT couvre le code déjà pris.
        op.execute(
            "INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, "
            "decision_types, color, description, is_active) SELECT "
            "(SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), "
            f"'{code}', '{label}', 'user', NULL, '{{deleted}}', '{color}', '{description}', "
            "true WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code "
            f"WHERE code = '{code}') ON CONFLICT (code) DO NOTHING"
        )
    op.execute(
        "UPDATE public.audit_reason_code SET entity_types = NULL, "
        "decision_types = '{task_done,task_skipped,deleted}' WHERE code = 'OTHER' "
        "AND (entity_types IS NOT NULL OR decision_types IS DISTINCT FROM "
        "'{task_done,task_skipped,deleted}')"
    )
    # Séquence recalée (nommée explicitement : pas de OWNED BY, voir 0004) sans jamais reculer.
    seq = "public.audit_reason_code_id_seq"
    op.execute(
        f"SELECT setval('{seq}', GREATEST((SELECT COALESCE(MAX(id), 1) FROM "
        f"public.audit_reason_code), (SELECT last_value FROM {seq})))"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE public.audit_reason_code SET "
        "entity_types = '{task,request,purchase_request,intervention}', "
        "decision_types = '{task_done,task_skipped}' WHERE code = 'OTHER'"
    )
    op.execute(
        "DELETE FROM public.audit_reason_code r WHERE "
        "r.code IN ('DELETE_CREATED_BY_MISTAKE', 'DELETE_DUPLICATE') "
        "AND NOT EXISTS (SELECT 1 FROM public.audit_log l WHERE l.reason_code_id = r.id)"
    )
