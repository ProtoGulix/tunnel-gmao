/**
 * Codes d'endpoint du catalogue (ADR 0007), regroupés par écran.
 *
 * Un code est calculé par `endpoint_code()` (backend/api/endpoints_catalog.py) :
 * "{tag du routeur}:{nom de la fonction}". Pour retrouver le code d'un bouton,
 * partir de l'appel API qu'il déclenche (méthode + chemin).
 * Le backend reste la seule barrière : ces codes ne servent qu'à masquer l'inutile.
 *
 * @module auth/permissionCodes
 */

export const PERM = {
  // Onglets de la page Administration (lecture : sans elle, l'onglet ne chargerait qu'un 403)
  audit: {
    // Historique (qui a fait quoi) : RESP, ADMIN et MCP seulement.
    readLogs: 'audit:get_logs',
  },
  adminTabs: {
    roles: 'admin:list_roles',
    security: 'admin:list_security_logs',
  },
  users: {
    list: 'admin:list_users',
    create: 'admin:create_user',
    update: 'admin:update_user',
    changeRole: 'admin:patch_user_role',
    setActive: 'admin:patch_user_active',
    resetPassword: 'admin:reset_password',
    remove: 'admin:delete_user',
  },
  equipements: {
    create: 'equipements:create_equipement',
    update: 'equipements:update_equipement',
    patch: 'equipements:patch_equipement',
    remove: 'equipements:delete_equipement',
  },
  stock: {
    createItem: 'stock-items:create_stock_item',
    updateItem: 'stock-items:update_stock_item',
    removeItem: 'stock-items:delete_stock_item',
    createFamily: 'stock-families:create_stock_family',
    updateFamily: 'stock-families:patch_stock_family',
    createSubFamily: 'stock-sub-families:create_stock_sub_family',
    createTemplate: 'part-templates:create_template',
    removeTemplate: 'part-templates:delete_template',
    createItemSupplier: 'stock-item-suppliers:create_stock_item_supplier',
  },
  parts: {
    create: 'parts:create_part',
    update: 'parts:update_part',
    addManufacturerRef: 'parts:add_manufacturer_ref',
    updateManufacturerRef: 'parts:update_manufacturer_ref',
    deleteManufacturerRef: 'parts:delete_manufacturer_ref',
    setPreferredManufacturerRef: 'parts:set_preferred_manufacturer_ref',
    addSupplierRef: 'parts:add_supplier_ref',
    updateSupplierRef: 'parts:update_supplier_ref',
    deleteSupplierRef: 'parts:delete_supplier_ref',
    setPreferredSupplierRef: 'parts:set_preferred_supplier_ref',
  },
  manufacturers: {
    create: 'manufacturer-items:create_manufacturer_item',
    update: 'manufacturer-items:patch_manufacturer_item',
    remove: 'manufacturer-items:delete_manufacturer_item',
  },
  suppliers: {
    create: 'suppliers:create_supplier',
    update: 'suppliers:update_supplier',
    remove: 'suppliers:delete_supplier',
  },
  supplierOrders: {
    create: 'supplier-orders:create_supplier_order',
    update: 'supplier-orders:update_supplier_order',
    remove: 'supplier-orders:delete_supplier_order',
    exportCsv: 'supplier-orders:export_supplier_order_csv',
    exportEmail: 'supplier-orders:export_supplier_order_email',
    createLine: 'supplier-order-lines:create_supplier_order_line',
    updateLine: 'supplier-order-lines:patch_supplier_order_line',
    removeLine: 'supplier-order-lines:delete_supplier_order_line',
  },
  purchaseRequests: {
    create: 'purchase-requests:create_purchase_request',
    update: 'purchase-requests:update_purchase_request',
    remove: 'purchase-requests:delete_purchase_request',
    importCsv: 'purchase-requests:import_purchase_requests_from_csv',
    dispatch: 'purchase-requests:dispatch_pending_requests',
  },
  interventions: {
    create: 'interventions:create_intervention',
    update: 'interventions:update_intervention',
    remove: 'interventions:delete_intervention',
    requestPointage: 'interventions:request_pointage',
    createAction: 'intervention-actions:add_action',
    updateAction: 'intervention-actions:patch_action',
    removeAction: 'intervention-actions:delete_action',
    createTask: 'intervention_tasks:create_task',
    updateTask: 'intervention_tasks:patch_task',
    removeTask: 'intervention_tasks:delete_task',
    changeStatus: 'intervention-status-log:create_status_log',
  },
  interventionRequests: {
    create: 'intervention-requests:create_request',
    transition: 'intervention-requests:transition_request_status',
    remove: 'intervention-requests:delete_request',
  },
  preventive: {
    createPlan: 'preventive_plans:create_preventive_plan',
    updatePlan: 'preventive_plans:update_preventive_plan',
    removePlan: 'preventive_plans:delete_preventive_plan',
    generate: 'preventive_occurrences:generate_occurrences',
    repair: 'preventive_occurrences:repair_occurrences',
    replaceSteps: 'preventive_plans:replace_plan_steps',
    skipOccurrence: 'preventive_occurrences:skip_occurrence',
  },
  adminRef: {
    createSubcategory: 'admin:create_action_subcategory',
    patchSubcategory: 'admin:patch_action_subcategory',
    patchCategory: 'admin:patch_action_category',
    patchFactor: 'admin:patch_complexity_factor',
    createInterventionType: 'admin:create_intervention_type',
    patchInterventionType: 'admin:patch_intervention_type',
    setInterventionTypeActive: 'admin:patch_intervention_type_active',
    patchInterventionStatus: 'admin:patch_intervention_status',
    createEquipementClass: 'equipement-class:create_equipement_class',
    updateEquipementClass: 'equipement-class:update_equipement_class',
    removeEquipementClass: 'equipement-class:delete_equipement_class',
    createAuditReason: 'admin:create_audit_reason',
    updateAuditReason: 'admin:update_audit_reason',
    setAuditReasonActive: 'admin:patch_audit_reason_active',
    createAuditRule: 'admin:create_audit_rule',
    updateAuditRule: 'admin:update_audit_rule',
  },
};
