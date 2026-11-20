/**
 * Correspondance préfixe d'URL → entity_type d'audit (miroir du _ENTITY_MAP du backend).
 * Fichier sans dépendance : testé directement par node --test.
 */

const URL_ENTITY_MAP = {
  'intervention-actions': 'action',
  'intervention-requests': 'request',
  'intervention-tasks': 'task',
  'interventions': 'intervention',
  'purchase-requests': 'purchase_request',
  'supplier-orders': 'supplier_order',
  'equipements': 'equipement',
  'preventive-occurrences': 'preventive_occurrence',
  'preventive-plans': 'preventive_plan',
  'parts': 'part',
  'manufacturer-items': 'manufacturer_item',
  'stock-items': 'stock_item',
  'stock-families': 'stock_family',
  'stock-sub-families': 'stock_sub_family',
  'stock-item-suppliers': 'stock_item_supplier',
  'suppliers': 'supplier',
  'supplier-order-lines': 'supplier_order_line',
  // Étape 4 : administration
  'api-keys': 'api_key',
  'equipement-class': 'equipement_class',
};

// Sous-ressources dont l'entité d'audit diffère de celle de leur préfixe (miroir des routes
// déclarées du backend : /parts/manufacturer-refs/{id} et /parts/supplier-refs/{id}).
const SUB_ENTITY_MAP = {
  'parts/manufacturer-refs': 'part_manufacturer_ref',
  'parts/supplier-refs': 'part_supplier_ref',
  'admin/users': 'user',
  'admin/ip-blocklist': 'ip_block',
  'admin/email-domain-rules': 'email_domain_rule',
  'home-view/admin': 'role_home_view',
};

// Création d'une sous-ressource : l'entité auditée est celle créée, désignée par le
// dernier segment (POST /parts/{id}/manufacturer-refs, POST /parts/manufacturer-refs/{id}/supplier-refs).
const CREATED_SUB_ENTITY_MAP = {
  'manufacturer-refs': 'part_manufacturer_ref',
  'supplier-refs': 'part_supplier_ref',
};

export function getAuditEntityType(error) {
  const url = error?.config?.url ?? '';
  const segments = url.replace(/^\//, '').split('?')[0].split('/');
  const [first, second] = segments;
  const last = segments[segments.length - 1];
  if (segments.length > 2 && CREATED_SUB_ENTITY_MAP[last]) return CREATED_SUB_ENTITY_MAP[last];
  return SUB_ENTITY_MAP[`${first}/${second}`] ?? URL_ENTITY_MAP[first] ?? null;
}

/**
 * Décision d'audit attendue par la requête : une suppression exige un motif « deleted »,
 * ignorer une occurrence préventive un motif « occurrence_skipped ».
 */
export function getAuditDecisionType(error) {
  const url = String(error?.config?.url ?? '').split('?')[0];
  if (/^\/?preventive-occurrences\/[^/]+\/skip$/.test(url)) return 'occurrence_skipped';
  return String(error?.config?.method ?? '').toLowerCase() === 'delete' ? 'deleted' : undefined;
}
