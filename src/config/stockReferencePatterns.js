/**
 * Configuration des patterns de référence par famille et sous-famille
 *
 * Tokens disponibles :
 * - {FAMILY} : Code famille
 * - {SUBFAMILY} : Code sous-famille
 * - {SPEC} : Spécification (optionnel)
 * - {DIMENSION} : Dimension
 * - {NAME} : Nom de l'article (optionnel)
 *
 * Exemples :
 * - "{FAMILY}-{SUBFAMILY}-{SPEC}-{DIMENSION}" => VIS-HEX-M8-20x50
 * - "{FAMILY}{SUBFAMILY}-{DIMENSION}" => VISHEX-20x50
 * - "{FAMILY}-{SUBFAMILY}-{DIMENSION}" => VIS-HEX-20x50 (si pas de spec)
 */

// Pattern par défaut si aucune configuration spécifique
export const DEFAULT_PATTERN = '{FAMILY}-{SUBFAMILY}{SPEC}-{DIMENSION}';

/**
 * Patterns spécifiques par famille
 * Structure: { familyCode: { pattern: string, subfamilies: { subfamilyCode: pattern } } }
 */
export const FAMILY_PATTERNS = {
  // Exemple: Visserie avec pattern compact
  VIS: {
    pattern: '{FAMILY}-{SUBFAMILY}{SPEC}-{DIMENSION}',
    subfamilies: {
      HEX: '{FAMILY}-{SUBFAMILY}{SPEC}-{DIMENSION}',
      CYL: '{FAMILY}-{SUBFAMILY}{SPEC}-{DIMENSION}',
      FHC: '{FAMILY}-{SUBFAMILY}{SPEC}-{DIMENSION}',
    },
  },

  // Exemple: Roulements avec format spécifique
  RLT: {
    pattern: '{FAMILY}-{DIMENSION}-{SPEC}',
    subfamilies: {
      BIL: '{FAMILY}-{SUBFAMILY}-{DIMENSION}',
      ROL: '{FAMILY}-{SUBFAMILY}-{DIMENSION}',
    },
  },

  // Exemple: Joints sans sous-famille dans la ref
  JNT: {
    pattern: '{FAMILY}-{SPEC}-{DIMENSION}',
  },

  // Exemple: Électrique avec nom abrégé
  ELC: {
    pattern: '{FAMILY}-{SUBFAMILY}-{DIMENSION}',
  },
};

/**
 * Règles de formatage pour les tokens
 */
export const TOKEN_FORMATTERS = {
  FAMILY: (value) => value?.toUpperCase() || '',
  SUBFAMILY: (value) => value?.toUpperCase() || '',
  SPEC: (value) => (value ? `-${value.toUpperCase()}` : ''),
  DIMENSION: (value) => value || '',
  NAME: (value) => value || '',
};

/**
 * Obtenir le pattern pour une combinaison famille/sous-famille
 * @param {string} familyCode - Code de la famille
 * @param {string} subfamilyCode - Code de la sous-famille (optionnel)
 * @returns {string} Pattern à utiliser
 */
export function getPatternForFamily(familyCode, subfamilyCode = null) {
  if (!familyCode) return DEFAULT_PATTERN;

  const familyConfig = FAMILY_PATTERNS[familyCode];

  // Si pas de config pour cette famille, utiliser le pattern par défaut
  if (!familyConfig) return DEFAULT_PATTERN;

  // Si sous-famille spécifiée et pattern spécifique existe
  if (subfamilyCode && familyConfig.subfamilies?.[subfamilyCode]) {
    return familyConfig.subfamilies[subfamilyCode];
  }

  // Sinon utiliser le pattern de la famille
  return familyConfig.pattern || DEFAULT_PATTERN;
}
