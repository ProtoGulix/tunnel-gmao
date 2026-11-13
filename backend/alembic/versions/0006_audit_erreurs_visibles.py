"""fn_audit_log_decision ne masque plus ses erreurs (ADR 0017, point 2)

L'ancienne version attrapait toute exception (EXCEPTION WHEN OTHERS), émettait un
WARNING et renvoyait NULL : un motif inconnu ou un contrôle violé passait pour un succès
et la mutation métier était validée sans trace. La fonction laisse désormais remonter
l'erreur ; même signature, mêmes contrôles, même corps hormis ce bloc.

Effet sur les données : aucun (seule la définition de la fonction change). Sur une
installation neuve, backend/db/schema.sql (migration 0001) porte déjà la nouvelle
définition : le CREATE OR REPLACE y est sans effet.

Le downgrade restaure exactement l'ancienne version (avec le bloc EXCEPTION).

Revision ID: 0006_audit_erreurs_visibles
Revises: 0005_affectation_residu
Create Date: 2026-10-11
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "0006_audit_erreurs_visibles"
down_revision: Union[str, None] = "0005_affectation_residu"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

# Nouvelle version : les erreurs remontent à l'appelant.
FN_SANS_MASQUAGE = """
CREATE OR REPLACE FUNCTION public.fn_audit_log_decision(p_entity_type character varying, p_entity_id uuid, p_decision_type character varying, p_old_value jsonb, p_new_value jsonb, p_reason_code character varying, p_reason_text text DEFAULT NULL::text, p_changed_by uuid DEFAULT NULL::uuid, p_is_system boolean DEFAULT false) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_reason_id       INT;
    v_reason_category VARCHAR;
    v_log_id          UUID;
BEGIN
    SELECT id, category
      INTO v_reason_id, v_reason_category
      FROM audit_reason_code
     WHERE code = p_reason_code AND is_active = TRUE;

    IF v_reason_id IS NULL THEN
        RAISE EXCEPTION 'Raison % inconnue ou inactive', p_reason_code;
    END IF;

    IF p_reason_code = 'OTHER' AND (p_reason_text IS NULL OR trim(p_reason_text) = '') THEN
        RAISE EXCEPTION 'reason_text obligatoire quand reason_code = OTHER';
    END IF;

    IF p_is_system = FALSE AND p_changed_by IS NULL THEN
        RAISE EXCEPTION 'changed_by obligatoire pour une mutation manuelle';
    END IF;

    IF p_is_system = TRUE AND v_reason_category != 'system' THEN
        RAISE EXCEPTION 'La raison % n''est pas une raison système', p_reason_code;
    END IF;

    INSERT INTO public.audit_log (
        entity_type, entity_id, decision_type,
        old_value, new_value,
        reason_code_id, reason_text,
        changed_by, is_system, logged_at
    ) VALUES (
        p_entity_type, p_entity_id, p_decision_type,
        p_old_value, p_new_value,
        v_reason_id, p_reason_text,
        p_changed_by, p_is_system,
        now()
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$
"""

# Ancienne version (celle de schema.sql avant 0006), restaurée par le downgrade.
FN_AVEC_MASQUAGE = """
CREATE OR REPLACE FUNCTION public.fn_audit_log_decision(p_entity_type character varying, p_entity_id uuid, p_decision_type character varying, p_old_value jsonb, p_new_value jsonb, p_reason_code character varying, p_reason_text text DEFAULT NULL::text, p_changed_by uuid DEFAULT NULL::uuid, p_is_system boolean DEFAULT false) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_reason_id       INT;
    v_reason_category VARCHAR;
    v_log_id          UUID;
BEGIN
    SELECT id, category
      INTO v_reason_id, v_reason_category
      FROM audit_reason_code
     WHERE code = p_reason_code AND is_active = TRUE;

    IF v_reason_id IS NULL THEN
        RAISE EXCEPTION 'Raison % inconnue ou inactive', p_reason_code;
    END IF;

    IF p_reason_code = 'OTHER' AND (p_reason_text IS NULL OR trim(p_reason_text) = '') THEN
        RAISE EXCEPTION 'reason_text obligatoire quand reason_code = OTHER';
    END IF;

    IF p_is_system = FALSE AND p_changed_by IS NULL THEN
        RAISE EXCEPTION 'changed_by obligatoire pour une mutation manuelle';
    END IF;

    IF p_is_system = TRUE AND v_reason_category != 'system' THEN
        RAISE EXCEPTION 'La raison % n''est pas une raison système', p_reason_code;
    END IF;

    INSERT INTO public.audit_log (
        entity_type, entity_id, decision_type,
        old_value, new_value,
        reason_code_id, reason_text,
        changed_by, is_system, logged_at
    ) VALUES (
        p_entity_type, p_entity_id, p_decision_type,
        p_old_value, p_new_value,
        v_reason_id, p_reason_text,
        p_changed_by, p_is_system,
        now()
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'fn_audit_log_decision: %', SQLERRM;
    RETURN NULL;
END;
$$
"""


def upgrade() -> None:
    op.execute(FN_SANS_MASQUAGE)


def downgrade() -> None:
    op.execute(FN_AVEC_MASQUAGE)
