/**
 * Génération de pattern à partir d'un template et de valeurs
 *
 * Fonction pure qui remplace les placeholders {KEY} par les valeurs fournies.
 *
 * @param {string} pattern - Pattern avec placeholders, ex: "M{DIAM}x{LONG}-{MAT}"
 * @param {Object} values - Valeurs des champs, ex: { DIAM: "8", LONG: "30", MAT: "A2" }
 * @returns {string} - Dimension générée, ex: "M8x30-A2"
 *
 * @example
 * const pattern = "M{DIAM}x{LONG}-{MAT}";
 * const values = { DIAM: "8", LONG: "30", MAT: "A2" };
 * generatePattern(pattern, values); // => "M8x30-A2"
 *
 * // Valeurs manquantes restent en placeholder
 * generatePattern(pattern, { DIAM: "8" }); // => "M8x{LONG}-{MAT}"
 */
export function generatePattern(pattern, values = {}) {
  if (!pattern) return '';

  let result = pattern;

  // Remplacer chaque {KEY} par sa valeur
  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
  });

  return result;
}

/**
 * Extrait les clés de champs d'un pattern
 *
 * @param {string} pattern - Pattern avec placeholders
 * @returns {string[]} - Liste des clés extraites
 *
 * @example
 * extractPatternKeys("M{DIAM}x{LONG}-{MAT}"); // => ["DIAM", "LONG", "MAT"]
 */
export function extractPatternKeys(pattern) {
  if (!pattern) return [];

  const matches = pattern.match(/\{([^}]+)\}/g);
  if (!matches) return [];

  return matches.map((match) => match.slice(1, -1)); // Enlever { et }
}

/**
 * Valide que toutes les clés requises sont présentes dans les valeurs
 *
 * @param {Object[]} fields - Liste des champs du template
 * @param {Object} values - Valeurs fournies
 * @returns {{ valid: boolean, missing: string[] }} - Résultat de validation
 */
export function validateRequiredFields(fields, values) {
  const requiredFields = fields.filter((f) => f.required);
  const missing = requiredFields
    .filter((f) => !values[f.field_key] || values[f.field_key] === '')
    .map((f) => f.label || f.field_key);

  return {
    valid: missing.length === 0,
    missing,
  };
}
