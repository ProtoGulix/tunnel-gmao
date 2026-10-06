/**
 * Construit le payload à envoyer à l'API selon le mode (création/édition, legacy/template).
 * @param {object} form  - état du formulaire
 * @param {object|null} template  - template de la sous-famille, ou null
 * @param {boolean} isEdit  - true si modification
 */
function castCharValue(template, key, value) {
  const field = (template.fields || []).find((f) => f.key === key);
  return field?.field_type === 'number' ? Number(value) : value;
}

function buildOptionals(form) {
  return {
    ...(form.spec?.trim() && { spec: form.spec.trim() }),
    ...(form.location?.trim() && { location: form.location.trim() }),
  };
}

export function buildPayload(form, template, isEdit) {
  const qty = Number(form.quantity);
  const extras = buildOptionals(form);
  if (isEdit && template)
    return {
      name: form.name,
      family_code: form.family_code,
      sub_family_code: form.sub_family_code,
      quantity: qty,
      unit: form.unit,
      ...extras,
    };
  const base = {
    name: form.name,
    family_code: form.family_code,
    sub_family_code: form.sub_family_code,
    quantity: qty,
    unit: form.unit,
    ...extras,
  };
  if (!template) return { ...base, dimension: form.dimension };
  return {
    ...base,
    characteristics: Object.entries(form.characteristics).map(([key, value]) => ({
      key,
      value: castCharValue(template, key, value),
    })),
  };
}

/**
 * Convertit les caractéristiques retournées par le GET (tableau typé) en objet plat pour le formulaire.
 * @param {Array|object} raw - item.characteristics
 */
export function charsToForm(raw) {
  if (!raw) return {};
  if (!Array.isArray(raw)) return raw;
  return Object.fromEntries(
    raw.map((c) => [c.key, String(c.value_number ?? c.value_enum ?? c.value_text ?? '')])
  );
}
