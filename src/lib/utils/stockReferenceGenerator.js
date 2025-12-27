import { getPatternForFamily, TOKEN_FORMATTERS } from '@/config/stockReferencePatterns';

/**
 * Génère une référence d'article selon le pattern configuré
 *
 * @param {Object} data - Données de l'article
 * @param {string} data.family_code - Code famille (obligatoire)
 * @param {string} data.sub_family_code - Code sous-famille (obligatoire)
 * @param {string} data.spec - Spécification (optionnel)
 * @param {string} data.dimension - Dimension (obligatoire)
 * @param {string} data.name - Nom de l'article (optionnel)
 * @returns {string} Référence générée ou message d'erreur
 */
export function generateStockReference(data) {
  const { family_code, sub_family_code, spec = '', dimension, name = '' } = data || {};

  // Validation des champs obligatoires
  if (!family_code || !sub_family_code || !dimension) {
    return 'Remplissez les champs obligatoires';
  }

  // Récupérer le pattern approprié
  const pattern = getPatternForFamily(family_code, sub_family_code);

  // Créer l'objet de tokens
  const tokens = {
    FAMILY: family_code,
    SUBFAMILY: sub_family_code,
    SPEC: spec,
    DIMENSION: dimension,
    NAME: name,
  };

  // Remplacer les tokens dans le pattern
  let reference = pattern;

  Object.keys(tokens).forEach((tokenName) => {
    const tokenPattern = `{${tokenName}}`;
    const tokenValue = tokens[tokenName];
    const formatter = TOKEN_FORMATTERS[tokenName];

    // Appliquer le formatter si disponible
    const formattedValue = formatter ? formatter(tokenValue) : tokenValue;

    // Remplacer le token dans le pattern
    reference = reference.replace(tokenPattern, formattedValue);
  });

  // Nettoyer les doubles tirets ou espaces
  reference = reference
    .replace(/--+/g, '-') // Remplacer multiples tirets par un seul
    .replace(/\s+/g, '') // Supprimer espaces
    .replace(/^-|-$/g, ''); // Supprimer tirets au début/fin

  return reference;
}

/**
 * Prévisualiser une référence pendant la saisie
 * Identique à generateStockReference mais avec gestion des champs vides
 *
 * @param {Object} data - Données partielles de l'article
 * @returns {string} Référence prévisualisée ou message placeholder
 */
export function previewStockReference(data) {
  return generateStockReference(data);
}

/**
 * Valider une référence générée
 *
 * @param {string} reference - Référence à valider
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateStockReference(reference) {
  const errors = [];

  if (!reference || reference === 'Remplissez les champs obligatoires') {
    errors.push('Référence incomplète');
  }

  if (reference && reference.length < 3) {
    errors.push('Référence trop courte (minimum 3 caractères)');
  }

  if (reference && reference.length > 50) {
    errors.push('Référence trop longue (maximum 50 caractères)');
  }

  if (reference && !/^[A-Z0-9-]+$/i.test(reference)) {
    errors.push('Caractères invalides (uniquement lettres, chiffres et tirets)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parser une référence existante pour extraire ses composants
 * (Utile pour l'édition ou l'analyse)
 *
 * @param {string} reference - Référence à parser
 * @returns {Object} Composants extraits (best effort)
 */
export function parseStockReference(reference) {
  if (!reference) return null;

  // Parser basique : découper sur les tirets
  const parts = reference.split('-');

  return {
    raw: reference,
    parts,
    family: parts[0] || null,
    subfamily: parts[1] || null,
    // Reste à interpréter selon le pattern...
  };
}
