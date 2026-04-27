/**
 * Accesseurs purs pour ActionForm
 * Aucun effet de bord, aucune mutation
 */

/**
 * Extrait l'ID de la catégorie
 * @param {Object} subcategory - Sous-catégorie
 * @returns {string|number|null} ID de la catégorie
 */
export const getCategoryId = (subcategory) =>
  subcategory?.id ?? subcategory?.category_id?.id ?? null;

/**
 * Extrait le code de la catégorie
 * @param {Object} subcategory - Sous-catégorie
 * @returns {string} Code de la catégorie
 */
export const getCategoryCode = (subcategory) =>
  subcategory?.category_id?.code ?? subcategory?.categoryCode ?? subcategory?.code ?? '—';

/**
 * Extrait le nom de la catégorie
 * @param {Object} subcategory - Sous-catégorie
 * @returns {string} Nom de la catégorie
 */
export const getCategoryName = (subcategory) =>
  subcategory?.name ?? subcategory?.category_name ?? '—';

/**
 * Extrait la couleur de la catégorie
 * @param {Object} subcategory - Sous-catégorie
 * @returns {string} Couleur (code hexadécimal ou variable CSS)
 */
export const getCategoryColor = (subcategory) =>
  subcategory?.category?.color ?? subcategory?.category_id?.color ?? 'gray';

/**
 * Valide qu'une description est non-vide
 * @param {string} description - Texte à valider
 * @returns {boolean} Valide ou non
 */
export const isDescriptionValid = (description) => Boolean(description?.trim()?.length > 0);

/**
 * Valide la complexité
 * @param {string|number} complexity - Score de complexité
 * @returns {boolean} Valide ou non
 */
export const isComplexityValid = (complexity) =>
  Number(complexity) >= 1 && Number(complexity) <= 10;

/**
 * Vérifie si les facteurs de complexité sont requis
 * @param {string|number} complexity - Score de complexité
 * @returns {boolean} Facteurs requis (complexity > 5)
 */
export const areComplexityFactorsRequired = (complexity) => Number(complexity) > 5;

/**
 * Valide l'état du formulaire
 * @param {Object} formState - État du formulaire
 * @param {{ start: string|null, end: string|null }} timeRange - Plage horaire sélectionnée
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validateFormState = (formState, timeRange = null, manualTimeSpent = '') => {
  const errors = [];

  if (!isComplexityValid(formState.complexity)) {
    errors.push('Complexité doit être entre 1 et 10');
  }

  if (
    areComplexityFactorsRequired(formState.complexity) &&
    (!formState.complexityFactors || formState.complexityFactors.length === 0)
  ) {
    errors.push('Au moins un facteur de complexité est requis pour complexité > 5');
  }

  // Plage horaire — l'une des deux formes est obligatoire
  const hasStart = Boolean(timeRange?.start);
  const hasEnd = Boolean(timeRange?.end);
  const hasBounds = hasStart && hasEnd;

  if (hasStart && !hasEnd) errors.push('Heure de fin requise');
  if (!hasStart && hasEnd) errors.push('Heure de début requise');

  if (!hasBounds) {
    const ts = parseFloat(manualTimeSpent);
    if (!ts || ts < 0.25) {
      errors.push('Durée obligatoire : saisissez une plage horaire ou une durée (min. 0h15)');
    } else if (Math.round(ts * 4) !== ts * 4) {
      errors.push('La durée doit être un multiple de 0h15 (ex : 0.25, 0.5, 0.75…)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
