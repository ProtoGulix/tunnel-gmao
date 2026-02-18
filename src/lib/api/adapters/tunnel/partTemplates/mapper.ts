/**
 * Part Templates Mapper - Tunnel Backend
 *
 * Maps backend DTOs to frontend models and vice versa.
 *
 * @module lib/api/adapters/tunnel/partTemplates/mapper
 */

/**
 * Map backend template to frontend model
 * API returns: id, code, version, pattern, fields (optional)
 */
export const mapPartTemplateToFrontend = (raw: any) => {
  return {
    id: raw.id,
    code: raw.code,
    label: raw.label || raw.code,
    pattern: raw.pattern || '',
    version: raw.version || 1,
    fields: Array.isArray(raw.fields) ? raw.fields.map(mapTemplateFieldToFrontend) : [],
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
};

/**
 * Map backend template field to frontend model
 */
export const mapTemplateFieldToFrontend = (raw: any) => {
  return {
    id: raw.id,
    field_key: raw.key || raw.field_key,
    label: raw.label || '',
    type: raw.field_type || raw.type || 'text',
    unit: raw.unit || null,
    required: raw.required ?? false,
    order: raw.sort_order ?? raw.order ?? 0,
    enum_values: Array.isArray(raw.enum_values) ? raw.enum_values : [],
  };
};

/**
 * Map frontend template to backend payload
 * API only expects: code, pattern, fields
 */
export const mapPartTemplateToBackend = (frontend: any) => {
  return {
    code: frontend.code,
    label: frontend.label || frontend.code,
    pattern: frontend.pattern || '',
    fields: Array.isArray(frontend.fields) ? frontend.fields.map(mapTemplateFieldToBackend) : [],
  };
};

/**
 * Map frontend template to backend payload for creating a new version
 * API only expects: pattern, fields (code and label are immutable)
 */
export const mapPartTemplateVersionToBackend = (frontend: any) => {
  return {
    pattern: frontend.pattern || '',
    fields: Array.isArray(frontend.fields) ? frontend.fields.map(mapTemplateFieldToBackend) : [],
  };
};

/**
 * Map frontend template field to backend payload
 */
export const mapTemplateFieldToBackend = (frontend: any) => {
  const payload: any = {
    key: frontend.field_key,
    label: frontend.label || '',
    field_type: frontend.type || 'text',
    required: frontend.required ?? false,
    order: frontend.order || 0,
  };

  if (frontend.unit) {
    payload.unit = frontend.unit;
  }

  if (frontend.type === 'enum' && Array.isArray(frontend.enum_values)) {
    payload.enum_values = frontend.enum_values;
  }

  return payload;
};
