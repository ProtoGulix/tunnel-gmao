/**
 * Stock Items Mapper - Tunnel Backend
 *
 * Transforms between backend DTOs and frontend domain models.
 *
 * @module lib/api/adapters/tunnel/stock/mapper
 */

/**
 * Maps backend stock item to frontend format
 */
export const mapStockItemToFrontend = (item: any) => {
  if (!item) return null;
  
  const mapped: any = {
    id: item.id,
    name: item.name,
    familyCode: item.family_code,
    subFamilyCode: item.sub_family_code,
    spec: item.spec,
    dimension: item.dimension,
    ref: item.ref,
    quantity: item.quantity,
    unit: item.unit,
    location: item.location,
    standarsSpec: item.standars_spec,
    manufacturerItemId: item.manufacturer_item_id,
    supplierRefsCount: item.supplier_refs_count,
  };
  
  // Template fields (API v2.0.0+)
  if (item.template_id !== undefined) {
    mapped.templateId = item.template_id;
  }
  if (item.template_version !== undefined) {
    mapped.templateVersion = item.template_version;
  }
  if (item.characteristics !== undefined && Array.isArray(item.characteristics)) {
    // Transformer [{ key: "DIAM", number_value: 25 }, ...] en { DIAM: 25, ... }
    mapped.characteristics = item.characteristics.reduce((acc: any, char: any) => {
      acc[char.key] = char.text_value || char.number_value || char.enum_value;
      return acc;
    }, {});
  }
  
  return mapped;
};

/**
 * Maps frontend stock item to backend format
 */
export const mapStockItemToBackend = (item: any) => {
  const payload: any = {
    name: item.name,
    family_code: item.familyCode,
    sub_family_code: item.subFamilyCode,
  };
  
  // Ajouter les champs optionnels seulement s'ils ont une valeur
  if (item.spec !== null && item.spec !== undefined && item.spec !== '') {
    payload.spec = item.spec;
  }
  if (item.quantity !== null && item.quantity !== undefined) {
    payload.quantity = item.quantity;
  }
  if (item.unit !== null && item.unit !== undefined && item.unit !== '') {
    payload.unit = item.unit;
  }
  if (item.location !== null && item.location !== undefined && item.location !== '') {
    payload.location = item.location;
  }
  if (item.standarsSpec !== null && item.standarsSpec !== undefined) {
    payload.standars_spec = item.standarsSpec;
  }
  if (item.manufacturerItemId !== null && item.manufacturerItemId !== undefined) {
    payload.manufacturer_item_id = item.manufacturerItemId;
  }
  
  // Mode template : characteristics obligatoires, dimension interdite
  if (item.characteristics !== undefined && Object.keys(item.characteristics).length > 0) {
    // Transformer { DIAM_INT: 25, DIAM_EXT: 52 } en [{ key: "DIAM_INT", value: 25 }, ...]
    payload.characteristics = Object.entries(item.characteristics).map(([key, value]) => ({
      key,
      value
    }));
    // En mode template, dimension ne doit PAS être envoyée (sera générée par le backend)
  } else {
    // Mode legacy : dimension obligatoire, pas de characteristics
    if (item.dimension !== null && item.dimension !== undefined && item.dimension !== '') {
      payload.dimension = item.dimension;
    }
  }
  
  return payload;
};

/**
 * Maps backend stock subfamily to frontend format (v1.4.0)
 */
export const mapStockSubFamilyToFrontend = (item: any) => {
  if (!item) return null;
  
  return {
    id: item.id ?? `${item.family_code}-${item.code}`,
    familyCode: item.family_code,
    code: item.code,
    label: item.label,
    part_template_id: item.template?.id || null,
    part_template: item.template ? {
      id: item.template.id,
      code: item.template.code,
      label: item.template.label,
      version: item.template.version,
      pattern: item.template.pattern,
      fields: item.template.fields || [],
    } : undefined,
  };
};

/**
 * Maps frontend stock subfamily updates to backend format (v1.4.0)
 */
export const mapStockSubFamilyToBackend = (updates: any) => {
  const payload: any = {};
  
  if (updates.label !== undefined) {
    payload.label = updates.label;
  }
  
  if (updates.part_template_id !== undefined) {
    payload.template_id = updates.part_template_id;
  }
  
  return payload;
};
