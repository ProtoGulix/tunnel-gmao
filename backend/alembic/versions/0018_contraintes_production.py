"""Contraintes et index de la production pour toute installation (CONT-01, ADR 0024)

Le schéma de départ avait perdu une grande partie des garde-fous de la production : cette
migration ajoute à toute base les 72 clés étrangères, 15 contraintes CHECK et 65 index de
l'inventaire (docs/taches/CONT-01-inventaire-production.txt) qui lui manquent, avec le nom
et la définition de la production. Un index équivalent déjà présent sous un autre nom
(machine_equipement_mere_index, déjà idx_machine_equipement_mere) n'est pas ajouté en double.

Effet sur les données : aucune ligne modifiée. Chaque ajout est conditionnel par nom : sur la
production et sur une base issue de la production, la migration ne change rien. Les
contraintes sont posées validées : si des données les violent, la migration échoue en
nommant la contrainte (donnée à corriger, pas à masquer).
Retour arrière : le downgrade retire TOUS les objets de l'inventaire, y compris ceux que la
production avait déjà. Il est réservé aux bases neuves (ADR 0024) : ne jamais le lancer sur
la production ni sur une base issue d'elle.

Revision ID: 0018_contraintes_production
Revises: 0017_action_task_fk
Create Date: 2026-11-19
"""

from __future__ import annotations

import logging
from typing import Union

from alembic import op

revision: str = "0018_contraintes_production"
down_revision: Union[str, None] = "0017_action_task_fk"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None

logger = logging.getLogger("alembic.runtime.migration")

# (table, nom, définition pg_get_constraintdef de la production)
_CHECKS = [
    (
        'preventive_suggestion',
        'check_handled_at_with_status',
        "CHECK ((((handled_at IS NULL) AND (status = 'NEW'::text)) OR ((handled_at IS NOT NULL) AND (status = ANY (ARRAY['REVIEWED'::text, 'ACCEPTED'::text, 'REJECTED'::text])))))",
    ),
    (
        'intervention_request',
        'chk_suggested_type_inter',
        "CHECK (((suggested_type_inter IS NULL) OR ((suggested_type_inter)::text = ANY (ARRAY[('CUR'::character varying)::text, ('PRE'::character varying)::text, ('REA'::character varying)::text, ('BAT'::character varying)::text, ('PRO'::character varying)::text, ('COF'::character varying)::text, ('PIL'::character varying)::text, ('MES'::character varying)::text]))))",
    ),
    (
        'intervention_task',
        'intervention_task_origin_check',
        "CHECK (((origin)::text = ANY (ARRAY[('plan'::character varying)::text, ('resp'::character varying)::text, ('tech'::character varying)::text])))",
    ),
    (
        'intervention_task',
        'intervention_task_skip_reason_check',
        "CHECK ((((status)::text <> 'skipped'::text) OR (skip_reason IS NOT NULL)))",
    ),
    (
        'intervention_task',
        'intervention_task_status_check',
        "CHECK (((status)::text = ANY (ARRAY[('todo'::character varying)::text, ('in_progress'::character varying)::text, ('done'::character varying)::text, ('skipped'::character varying)::text])))",
    ),
    ('part_template_field', 'part_template_field_sort_order_positive', 'CHECK ((sort_order > 0))'),
    (
        'part_template_field',
        'part_template_field_type_check',
        "CHECK (((field_type)::text = ANY (ARRAY[('number'::character varying)::text, ('text'::character varying)::text, ('enum'::character varying)::text])))",
    ),
    ('part_template', 'part_template_version_positive', 'CHECK ((version > 0))'),
    (
        'preventive_occurrence',
        'preventive_occurrence_skip_reason_check',
        "CHECK ((((status)::text <> 'skipped'::text) OR (skip_reason IS NOT NULL)))",
    ),
    (
        'preventive_plan',
        'preventive_plan_trigger_type_check',
        "CHECK (((((trigger_type)::text = 'periodicity'::text) AND (periodicity_days IS NOT NULL)) OR (((trigger_type)::text = 'hours'::text) AND (hours_threshold IS NOT NULL))))",
    ),
    ('purchase_request', 'purchase_request_quantity_check', 'CHECK ((quantity > 0))'),
    (
        'stock_item_characteristic',
        'stock_item_characteristic_single_value_check',
        'CHECK ((((value_text IS NOT NULL) AND (value_number IS NULL) AND (value_enum IS NULL)) OR ((value_text IS NULL) AND (value_number IS NOT NULL) AND (value_enum IS NULL)) OR ((value_text IS NULL) AND (value_number IS NULL) AND (value_enum IS NOT NULL))))',
    ),
    (
        'stock_item',
        'stock_item_template_version_positive',
        'CHECK (((template_version IS NULL) OR (template_version > 0)))',
    ),
    (
        'supplier_order_line_purchase_request',
        'supplier_order_line_purchase_request_quantity_check',
        'CHECK ((quantity > 0))',
    ),
    ('supplier_order_line', 'supplier_order_line_quantity_check', 'CHECK ((quantity > 0))'),
]

# Ordre indifférent entre clés étrangères : leurs cibles (clés primaires, uniques) existent déjà.
_FOREIGN_KEYS = [
    (
        'action_subcategory',
        'action_subcategory_category_id_fkey',
        'FOREIGN KEY (category_id) REFERENCES action_category(id) ON DELETE SET NULL',
    ),
    ('api_key', 'api_key_created_by_fkey', 'FOREIGN KEY (created_by) REFERENCES tunnel_user(id)'),
    ('api_key', 'api_key_role_id_fkey', 'FOREIGN KEY (role_id) REFERENCES tunnel_role(id)'),
    (
        'audit_log',
        'audit_log_reason_code_id_fkey',
        'FOREIGN KEY (reason_code_id) REFERENCES audit_reason_code(id)',
    ),
    (
        'intervention_action',
        'fk_intervention_action_complexity_factor',
        'FOREIGN KEY (complexity_factor) REFERENCES complexity_factor(code) ON DELETE SET NULL',
    ),
    (
        'stock_item',
        'fk_item_sub_family',
        'FOREIGN KEY (family_code, sub_family_code) REFERENCES stock_sub_family(family_code, code)',
    ),
    (
        'preventive_suggestion',
        'fk_preventive_suggestion_action',
        'FOREIGN KEY (intervention_action_id) REFERENCES intervention_action(id) ON DELETE RESTRICT',
    ),
    (
        'preventive_suggestion',
        'fk_preventive_suggestion_machine',
        'FOREIGN KEY (machine_id) REFERENCES machine(id) ON DELETE RESTRICT',
    ),
    (
        'intervention_task',
        'gamme_step_validation_intervention_id_fkey',
        'FOREIGN KEY (intervention_id) REFERENCES intervention(id) ON DELETE RESTRICT',
    ),
    (
        'intervention_task',
        'gamme_step_validation_occurrence_id_fkey',
        'FOREIGN KEY (occurrence_id) REFERENCES preventive_occurrence(id) ON DELETE RESTRICT',
    ),
    (
        'intervention_task',
        'gamme_step_validation_step_id_fkey',
        'FOREIGN KEY (gamme_step_id) REFERENCES preventive_plan_gamme_step(id) ON DELETE RESTRICT',
    ),
    (
        'intervention_action',
        'intervention_action_action_subcategory_foreign',
        'FOREIGN KEY (action_subcategory) REFERENCES action_subcategory(id) ON DELETE SET NULL',
    ),
    (
        'intervention_action',
        'intervention_action_intervention_id_fkey',
        'FOREIGN KEY (intervention_id) REFERENCES intervention(id) ON DELETE CASCADE',
    ),
    (
        'intervention_action_purchase_request',
        'intervention_action_purchase_request_inter__58223902_foreign',
        'FOREIGN KEY (intervention_action_id) REFERENCES intervention_action(id) ON DELETE SET NULL',
    ),
    (
        'intervention_action_purchase_request',
        'intervention_action_purchase_request_purch__1ea27a8f_foreign',
        'FOREIGN KEY (purchase_request_id) REFERENCES purchase_request(id) ON DELETE SET NULL',
    ),
    (
        'intervention_action',
        'intervention_action_tech_foreign',
        'FOREIGN KEY (tech) REFERENCES tunnel_user(id)',
    ),
    (
        'intervention',
        'intervention_machine_id_fkey',
        'FOREIGN KEY (machine_id) REFERENCES machine(id) ON DELETE SET NULL',
    ),
    (
        'intervention_part',
        'intervention_part_intervention_id_fkey',
        'FOREIGN KEY (intervention_id) REFERENCES intervention(id) ON DELETE CASCADE',
    ),
    (
        'intervention',
        'intervention_plan_id_fkey',
        'FOREIGN KEY (plan_id) REFERENCES preventive_plan(id) ON DELETE SET NULL',
    ),
    (
        'intervention_request',
        'intervention_request_intervention_id_fkey',
        'FOREIGN KEY (intervention_id) REFERENCES intervention(id) ON DELETE SET NULL',
    ),
    (
        'intervention_request',
        'intervention_request_machine_id_fkey',
        'FOREIGN KEY (machine_id) REFERENCES machine(id) ON DELETE RESTRICT',
    ),
    (
        'intervention_request',
        'intervention_request_service_id_fkey',
        'FOREIGN KEY (service_id) REFERENCES service(id) ON DELETE SET NULL',
    ),
    (
        'intervention_request',
        'intervention_request_statut_fkey',
        'FOREIGN KEY (statut) REFERENCES request_status_ref(code)',
    ),
    (
        'intervention',
        'intervention_status_actual_foreign',
        'FOREIGN KEY (status_actual) REFERENCES intervention_status_ref(id) ON DELETE SET NULL',
    ),
    (
        'intervention_status_log',
        'intervention_status_log_intervention_id_foreign',
        'FOREIGN KEY (intervention_id) REFERENCES intervention(id) ON DELETE CASCADE',
    ),
    (
        'intervention_status_log',
        'intervention_status_log_status_from_foreign',
        'FOREIGN KEY (status_from) REFERENCES intervention_status_ref(id) ON DELETE SET NULL',
    ),
    (
        'intervention_status_log',
        'intervention_status_log_status_to_foreign',
        'FOREIGN KEY (status_to) REFERENCES intervention_status_ref(id) ON DELETE SET NULL',
    ),
    (
        'intervention_status_log',
        'intervention_status_log_technician_id_foreign',
        'FOREIGN KEY (technician_id) REFERENCES tunnel_user(id) ON DELETE SET NULL',
    ),
    (
        'intervention_task',
        'intervention_task_assigned_to_fkey',
        'FOREIGN KEY (assigned_to) REFERENCES tunnel_user(id) ON DELETE SET NULL',
    ),
    (
        'intervention_task',
        'intervention_task_created_by_fkey',
        'FOREIGN KEY (created_by) REFERENCES tunnel_user(id) ON DELETE SET NULL',
    ),
    (
        'intervention',
        'intervention_tech_id_fkey',
        'FOREIGN KEY (tech_id) REFERENCES tunnel_user(id) ON DELETE SET NULL',
    ),
    (
        'intervention',
        'intervention_updated_by_foreign',
        'FOREIGN KEY (updated_by) REFERENCES tunnel_user(id) ON DELETE SET NULL',
    ),
    (
        'ip_blocklist',
        'ip_blocklist_created_by_fkey',
        'FOREIGN KEY (created_by) REFERENCES tunnel_user(id)',
    ),
    (
        'machine_hours',
        'machine_hours_machine_id_fkey',
        'FOREIGN KEY (machine_id) REFERENCES machine(id) ON DELETE CASCADE',
    ),
    (
        'part_template_field_enum',
        'part_template_field_enum_field_fk',
        'FOREIGN KEY (field_id) REFERENCES part_template_field(id) ON DELETE CASCADE',
    ),
    (
        'part_template_field',
        'part_template_field_template_fk',
        'FOREIGN KEY (template_id) REFERENCES part_template(id) ON DELETE CASCADE',
    ),
    (
        'permission_audit_log',
        'permission_audit_log_changed_by_fkey',
        'FOREIGN KEY (changed_by) REFERENCES tunnel_user(id)',
    ),
    (
        'permission_audit_log',
        'permission_audit_log_endpoint_id_fkey',
        'FOREIGN KEY (endpoint_id) REFERENCES tunnel_endpoint(id)',
    ),
    (
        'permission_audit_log',
        'permission_audit_log_role_id_fkey',
        'FOREIGN KEY (role_id) REFERENCES tunnel_role(id)',
    ),
    (
        'preventive_occurrence',
        'preventive_occurrence_di_id_fkey',
        'FOREIGN KEY (di_id) REFERENCES intervention_request(id) ON DELETE SET NULL',
    ),
    (
        'preventive_occurrence',
        'preventive_occurrence_intervention_id_fkey',
        'FOREIGN KEY (intervention_id) REFERENCES intervention(id) ON DELETE SET NULL',
    ),
    (
        'preventive_occurrence',
        'preventive_occurrence_machine_id_fkey',
        'FOREIGN KEY (machine_id) REFERENCES machine(id) ON DELETE RESTRICT',
    ),
    (
        'preventive_occurrence',
        'preventive_occurrence_plan_id_fkey',
        'FOREIGN KEY (plan_id) REFERENCES preventive_plan(id) ON DELETE RESTRICT',
    ),
    (
        'preventive_plan',
        'preventive_plan_equipement_class_id_fkey',
        'FOREIGN KEY (equipement_class_id) REFERENCES equipement_class(id) ON DELETE RESTRICT',
    ),
    (
        'preventive_plan_gamme_step',
        'preventive_plan_gamme_step_plan_id_fkey',
        'FOREIGN KEY (plan_id) REFERENCES preventive_plan(id) ON DELETE CASCADE',
    ),
    (
        'purchase_request',
        'purchase_request_stock_item_id_fkey',
        'FOREIGN KEY (stock_item_id) REFERENCES stock_item(id) ON DELETE SET NULL',
    ),
    (
        'refresh_token',
        'refresh_token_user_id_fkey',
        'FOREIGN KEY (user_id) REFERENCES tunnel_user(id) ON DELETE CASCADE',
    ),
    (
        'request_status_log',
        'request_status_log_request_id_fkey',
        'FOREIGN KEY (request_id) REFERENCES intervention_request(id) ON DELETE CASCADE',
    ),
    (
        'request_status_log',
        'request_status_log_status_from_fkey',
        'FOREIGN KEY (status_from) REFERENCES request_status_ref(code)',
    ),
    (
        'request_status_log',
        'request_status_log_status_to_fkey',
        'FOREIGN KEY (status_to) REFERENCES request_status_ref(code)',
    ),
    (
        'security_log',
        'security_log_user_id_fkey',
        'FOREIGN KEY (user_id) REFERENCES tunnel_user(id) ON DELETE SET NULL',
    ),
    (
        'stock_item_characteristic',
        'stock_item_characteristic_field_fk',
        'FOREIGN KEY (field_id) REFERENCES part_template_field(id) ON DELETE RESTRICT',
    ),
    (
        'stock_item_characteristic',
        'stock_item_characteristic_item_fk',
        'FOREIGN KEY (stock_item_id) REFERENCES stock_item(id) ON DELETE CASCADE',
    ),
    (
        'stock_item',
        'stock_item_family_code_fkey',
        'FOREIGN KEY (family_code) REFERENCES stock_family(code)',
    ),
    (
        'stock_item',
        'stock_item_manufacturer_item_id_foreign',
        'FOREIGN KEY (manufacturer_item_id) REFERENCES manufacturer_item(id)',
    ),
    (
        'stock_item_standard_spec',
        'stock_item_standard_spec_stock_item_id_foreign',
        'FOREIGN KEY (stock_item_id) REFERENCES stock_item(id) ON DELETE SET NULL',
    ),
    (
        'stock_item',
        'stock_item_standars_spec_foreign',
        'FOREIGN KEY (standars_spec) REFERENCES stock_item_standard_spec(id) ON DELETE SET NULL',
    ),
    (
        'stock_item_supplier',
        'stock_item_supplier_manufacturer_item_id_fkey',
        'FOREIGN KEY (manufacturer_item_id) REFERENCES manufacturer_item(id) ON DELETE SET NULL',
    ),
    (
        'stock_item_supplier',
        'stock_item_supplier_stock_item_id_fkey',
        'FOREIGN KEY (stock_item_id) REFERENCES stock_item(id) ON DELETE SET NULL',
    ),
    (
        'stock_item_supplier',
        'stock_item_supplier_supplier_id_fkey',
        'FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE CASCADE',
    ),
    (
        'stock_item',
        'stock_item_template_fk',
        'FOREIGN KEY (template_id) REFERENCES part_template(id) ON DELETE RESTRICT',
    ),
    (
        'stock_sub_family',
        'stock_sub_family_family_code_fkey',
        'FOREIGN KEY (family_code) REFERENCES stock_family(code) ON DELETE CASCADE',
    ),
    (
        'stock_sub_family',
        'stock_sub_family_template_fk',
        'FOREIGN KEY (template_id) REFERENCES part_template(id) ON DELETE SET NULL',
    ),
    (
        'subtask',
        'subtask_intervention_id_fkey',
        'FOREIGN KEY (intervention_id) REFERENCES intervention(id) ON DELETE CASCADE',
    ),
    (
        'supplier_order_line_purchase_request',
        'supplier_order_line_purchase_reques_supplier_order_line_id_fkey',
        'FOREIGN KEY (supplier_order_line_id) REFERENCES supplier_order_line(id) ON DELETE SET NULL',
    ),
    (
        'supplier_order_line_purchase_request',
        'supplier_order_line_purchase_request_purchase_request_id_fkey',
        'FOREIGN KEY (purchase_request_id) REFERENCES purchase_request(id) ON DELETE SET NULL',
    ),
    (
        'supplier_order_line',
        'supplier_order_line_stock_item_id_fkey',
        'FOREIGN KEY (stock_item_id) REFERENCES stock_item(id) ON DELETE RESTRICT',
    ),
    (
        'supplier_order_line',
        'supplier_order_line_supplier_order_id_fkey',
        'FOREIGN KEY (supplier_order_id) REFERENCES supplier_order(id) ON DELETE CASCADE',
    ),
    (
        'supplier_order',
        'supplier_order_supplier_id_fkey',
        'FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE RESTRICT',
    ),
    (
        'tunnel_permission',
        'tunnel_permission_endpoint_id_fkey',
        'FOREIGN KEY (endpoint_id) REFERENCES tunnel_endpoint(id)',
    ),
    (
        'tunnel_permission',
        'tunnel_permission_role_id_fkey',
        'FOREIGN KEY (role_id) REFERENCES tunnel_role(id)',
    ),
    ('tunnel_user', 'tunnel_user_role_id_fkey', 'FOREIGN KEY (role_id) REFERENCES tunnel_role(id)'),
]

# (table, nom, CREATE INDEX de la production)
_INDEXES = [
    (
        'action_category',
        'action_category_code_index',
        'CREATE INDEX action_category_code_index ON public.action_category USING btree (code)',
    ),
    (
        'action_category_meta',
        'action_category_meta_low_value_index',
        'CREATE INDEX action_category_meta_low_value_index ON public.action_category_meta USING btree (is_low_value)',
    ),
    (
        'action_category_meta',
        'action_category_meta_simple_index',
        'CREATE INDEX action_category_meta_simple_index ON public.action_category_meta USING btree (is_simple)',
    ),
    (
        'action_classification_probe',
        'action_classification_probe_active_index',
        'CREATE INDEX action_classification_probe_active_index ON public.action_classification_probe USING btree (is_active)',
    ),
    (
        'action_classification_probe',
        'action_classification_probe_keyword_index',
        'CREATE INDEX action_classification_probe_keyword_index ON public.action_classification_probe USING btree (keyword)',
    ),
    (
        'action_classification_probe',
        'action_classification_probe_severity_index',
        'CREATE INDEX action_classification_probe_severity_index ON public.action_classification_probe USING btree (severity)',
    ),
    (
        'anomaly_threshold',
        'anomaly_threshold_active_index',
        'CREATE INDEX anomaly_threshold_active_index ON public.anomaly_threshold USING btree (is_active)',
    ),
    (
        'anomaly_threshold',
        'anomaly_threshold_type_index',
        'CREATE INDEX anomaly_threshold_type_index ON public.anomaly_threshold USING btree (anomaly_type)',
    ),
    (
        'audit_log',
        'idx_audit_log_entity',
        'CREATE INDEX idx_audit_log_entity ON public.audit_log USING btree (entity_type, entity_id)',
    ),
    (
        'audit_log',
        'idx_audit_log_reason',
        'CREATE INDEX idx_audit_log_reason ON public.audit_log USING btree (reason_code_id)',
    ),
    (
        'audit_log',
        'idx_audit_log_time',
        'CREATE INDEX idx_audit_log_time ON public.audit_log USING btree (logged_at DESC)',
    ),
    (
        'audit_reason_code',
        'idx_audit_reason_code_active',
        'CREATE INDEX idx_audit_reason_code_active ON public.audit_reason_code USING btree (code, is_active)',
    ),
    (
        'equipement_class',
        'equipement_class_code_index',
        'CREATE INDEX equipement_class_code_index ON public.equipement_class USING btree (code)',
    ),
    (
        'intervention',
        'intervention_machine_id_index',
        'CREATE INDEX intervention_machine_id_index ON public.intervention USING btree (machine_id)',
    ),
    (
        'intervention_action',
        'idx_intervention_action_complexity_factor',
        'CREATE INDEX idx_intervention_action_complexity_factor ON public.intervention_action USING btree (complexity_factor)',
    ),
    (
        'intervention_action',
        'intervention_action_created_at_index',
        'CREATE INDEX intervention_action_created_at_index ON public.intervention_action USING btree (created_at)',
    ),
    (
        'intervention_action_task',
        'idx_intervention_action_task_task_id',
        'CREATE INDEX idx_intervention_action_task_task_id ON public.intervention_action_task USING btree (task_id)',
    ),
    (
        'intervention_request',
        'idx_intervention_request_is_system',
        'CREATE INDEX idx_intervention_request_is_system ON public.intervention_request USING btree (is_system) WHERE (is_system = true)',
    ),
    (
        'intervention_task',
        'idx_gamme_step_validation_occurrence_id',
        'CREATE INDEX idx_gamme_step_validation_occurrence_id ON public.intervention_task USING btree (occurrence_id)',
    ),
    (
        'intervention_task',
        'idx_intervention_task_assigned_to',
        'CREATE INDEX idx_intervention_task_assigned_to ON public.intervention_task USING btree (assigned_to)',
    ),
    (
        'intervention_task',
        'idx_intervention_task_intervention_id',
        'CREATE INDEX idx_intervention_task_intervention_id ON public.intervention_task USING btree (intervention_id)',
    ),
    (
        'intervention_task',
        'idx_intervention_task_occurrence_id',
        'CREATE INDEX idx_intervention_task_occurrence_id ON public.intervention_task USING btree (occurrence_id)',
    ),
    (
        'intervention_task',
        'idx_intervention_task_status',
        'CREATE INDEX idx_intervention_task_status ON public.intervention_task USING btree (status)',
    ),
    (
        'machine',
        'machine_code_index',
        'CREATE INDEX machine_code_index ON public.machine USING btree (code)',
    ),
    (
        'machine',
        'machine_equipement_class_index',
        'CREATE INDEX machine_equipement_class_index ON public.machine USING btree (equipement_class_id)',
    ),
    (
        'part_template',
        'idx_part_template_active_code',
        'CREATE INDEX idx_part_template_active_code ON public.part_template USING btree (code, version) WHERE (is_active = true)',
    ),
    (
        'part_template',
        'idx_part_template_code',
        'CREATE INDEX idx_part_template_code ON public.part_template USING btree (code)',
    ),
    (
        'part_template',
        'idx_part_template_is_active',
        'CREATE INDEX idx_part_template_is_active ON public.part_template USING btree (is_active) WHERE (is_active = true)',
    ),
    (
        'part_template_field',
        'idx_part_template_field_sort_order',
        'CREATE INDEX idx_part_template_field_sort_order ON public.part_template_field USING btree (template_id, sort_order)',
    ),
    (
        'part_template_field',
        'idx_part_template_field_template_id',
        'CREATE INDEX idx_part_template_field_template_id ON public.part_template_field USING btree (template_id)',
    ),
    (
        'part_template_field_enum',
        'idx_part_template_field_enum_field_id',
        'CREATE INDEX idx_part_template_field_enum_field_id ON public.part_template_field_enum USING btree (field_id)',
    ),
    (
        'preventive_occurrence',
        'idx_prev_occurrence_machine_id',
        'CREATE INDEX idx_prev_occurrence_machine_id ON public.preventive_occurrence USING btree (machine_id)',
    ),
    (
        'preventive_occurrence',
        'idx_prev_occurrence_plan_id',
        'CREATE INDEX idx_prev_occurrence_plan_id ON public.preventive_occurrence USING btree (plan_id)',
    ),
    (
        'preventive_occurrence',
        'idx_prev_occurrence_status',
        'CREATE INDEX idx_prev_occurrence_status ON public.preventive_occurrence USING btree (status)',
    ),
    (
        'preventive_plan',
        'idx_preventive_plan_active',
        'CREATE INDEX idx_preventive_plan_active ON public.preventive_plan USING btree (active) WHERE (active = true)',
    ),
    (
        'preventive_plan',
        'idx_preventive_plan_equipment_class',
        'CREATE INDEX idx_preventive_plan_equipment_class ON public.preventive_plan USING btree (equipement_class_id)',
    ),
    (
        'preventive_plan_gamme_step',
        'idx_gamme_step_plan_id',
        'CREATE INDEX idx_gamme_step_plan_id ON public.preventive_plan_gamme_step USING btree (plan_id)',
    ),
    (
        'preventive_rule',
        'idx_preventive_rule_active',
        'CREATE INDEX idx_preventive_rule_active ON public.preventive_rule USING btree (active) WHERE (active = true)',
    ),
    (
        'preventive_rule',
        'idx_preventive_rule_keyword',
        'CREATE INDEX idx_preventive_rule_keyword ON public.preventive_rule USING btree (keyword)',
    ),
    (
        'preventive_suggestion',
        'idx_preventive_suggestion_code',
        'CREATE INDEX idx_preventive_suggestion_code ON public.preventive_suggestion USING btree (preventive_code)',
    ),
    (
        'preventive_suggestion',
        'idx_preventive_suggestion_detected_at',
        'CREATE INDEX idx_preventive_suggestion_detected_at ON public.preventive_suggestion USING btree (detected_at)',
    ),
    (
        'preventive_suggestion',
        'idx_preventive_suggestion_machine',
        'CREATE INDEX idx_preventive_suggestion_machine ON public.preventive_suggestion USING btree (machine_id)',
    ),
    (
        'preventive_suggestion',
        'idx_preventive_suggestion_machine_status',
        'CREATE INDEX idx_preventive_suggestion_machine_status ON public.preventive_suggestion USING btree (machine_id, status)',
    ),
    (
        'preventive_suggestion',
        'idx_preventive_suggestion_status',
        'CREATE INDEX idx_preventive_suggestion_status ON public.preventive_suggestion USING btree (status)',
    ),
    (
        'purchase_request',
        'idx_purchase_request_created',
        'CREATE INDEX idx_purchase_request_created ON public.purchase_request USING btree (created_at DESC)',
    ),
    (
        'purchase_request',
        'idx_purchase_request_status',
        'CREATE INDEX idx_purchase_request_status ON public.purchase_request USING btree (status)',
    ),
    (
        'purchase_request',
        'idx_purchase_request_stock_item',
        'CREATE INDEX idx_purchase_request_stock_item ON public.purchase_request USING btree (stock_item_id)',
    ),
    (
        'schema_migrations',
        'idx_schema_migrations_version',
        'CREATE INDEX idx_schema_migrations_version ON public.schema_migrations USING btree (version, direction, success)',
    ),
    (
        'stock_item',
        'idx_stock_item_supplier_refs_count',
        'CREATE INDEX idx_stock_item_supplier_refs_count ON public.stock_item USING btree (supplier_refs_count)',
    ),
    (
        'stock_item',
        'idx_stock_item_template_id',
        'CREATE INDEX idx_stock_item_template_id ON public.stock_item USING btree (template_id)',
    ),
    (
        'stock_item',
        'idx_stock_item_template_version',
        'CREATE INDEX idx_stock_item_template_version ON public.stock_item USING btree (template_id, template_version)',
    ),
    (
        'stock_item_characteristic',
        'idx_stock_item_char_item_field',
        'CREATE INDEX idx_stock_item_char_item_field ON public.stock_item_characteristic USING btree (stock_item_id, field_id)',
    ),
    (
        'stock_item_characteristic',
        'idx_stock_item_characteristic_field_id',
        'CREATE INDEX idx_stock_item_characteristic_field_id ON public.stock_item_characteristic USING btree (field_id)',
    ),
    (
        'stock_item_characteristic',
        'idx_stock_item_characteristic_item_id',
        'CREATE INDEX idx_stock_item_characteristic_item_id ON public.stock_item_characteristic USING btree (stock_item_id)',
    ),
    (
        'stock_item_characteristic',
        'idx_stock_item_characteristic_value_enum',
        'CREATE INDEX idx_stock_item_characteristic_value_enum ON public.stock_item_characteristic USING btree (value_enum) WHERE (value_enum IS NOT NULL)',
    ),
    (
        'stock_item_characteristic',
        'idx_stock_item_characteristic_value_number',
        'CREATE INDEX idx_stock_item_characteristic_value_number ON public.stock_item_characteristic USING btree (value_number) WHERE (value_number IS NOT NULL)',
    ),
    (
        'stock_item_supplier',
        'idx_stock_item_supplier_preferred',
        'CREATE INDEX idx_stock_item_supplier_preferred ON public.stock_item_supplier USING btree (stock_item_id, is_preferred) WHERE (is_preferred = true)',
    ),
    (
        'stock_item_supplier',
        'stock_item_supplier_manufacturer_item_id_index',
        'CREATE INDEX stock_item_supplier_manufacturer_item_id_index ON public.stock_item_supplier USING btree (manufacturer_item_id)',
    ),
    (
        'stock_sub_family',
        'idx_stock_sub_family_template_id',
        'CREATE INDEX idx_stock_sub_family_template_id ON public.stock_sub_family USING btree (template_id)',
    ),
    (
        'supplier_order',
        'idx_supplier_order_status',
        'CREATE INDEX idx_supplier_order_status ON public.supplier_order USING btree (status)',
    ),
    (
        'supplier_order',
        'idx_supplier_order_supplier',
        'CREATE INDEX idx_supplier_order_supplier ON public.supplier_order USING btree (supplier_id)',
    ),
    (
        'supplier_order_line',
        'idx_supplier_order_line_order',
        'CREATE INDEX idx_supplier_order_line_order ON public.supplier_order_line USING btree (supplier_order_id)',
    ),
    (
        'supplier_order_line',
        'idx_supplier_order_line_stock_item',
        'CREATE INDEX idx_supplier_order_line_stock_item ON public.supplier_order_line USING btree (stock_item_id)',
    ),
    (
        'supplier_order_line_purchase_request',
        'idx_sol_pr_line',
        'CREATE INDEX idx_sol_pr_line ON public.supplier_order_line_purchase_request USING btree (supplier_order_line_id)',
    ),
    (
        'supplier_order_line_purchase_request',
        'idx_sol_pr_request',
        'CREATE INDEX idx_sol_pr_request ON public.supplier_order_line_purchase_request USING btree (purchase_request_id)',
    ),
]


def _add_constraint(table: str, name: str, definition: str) -> None:
    # Pas de IF NOT EXISTS pour une contrainte : test dans pg_constraint (idempotence).
    op.execute(
        f"""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = '{name}' AND conrelid = 'public.{table}'::regclass
            ) THEN
                ALTER TABLE public.{table} ADD CONSTRAINT {name} {definition};
            END IF;
        END $$
        """
    )


def upgrade() -> None:
    for table, name, definition in _CHECKS:
        _add_constraint(table, name, definition)
    for table, name, definition in _FOREIGN_KEYS:
        _add_constraint(table, name, definition)
    for _table, _name, create in _INDEXES:
        op.execute(create.replace("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS ", 1))
    logger.info(
        "0018 : %s CHECK, %s clé(s) étrangère(s), %s index vérifiés ou ajoutés",
        len(_CHECKS),
        len(_FOREIGN_KEYS),
        len(_INDEXES),
    )


def downgrade() -> None:
    # Réservé aux bases neuves (ADR 0024) : retire aussi ce que la production avait déjà.
    for _table, name, _create in reversed(_INDEXES):
        op.execute(f"DROP INDEX IF EXISTS public.{name}")
    for table, name, _definition in reversed(_FOREIGN_KEYS + _CHECKS):
        op.execute(f"ALTER TABLE public.{table} DROP CONSTRAINT IF EXISTS {name}")
