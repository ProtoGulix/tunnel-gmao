/**
 * @fileoverview Configuration de classification du temps service
 *
 * Définit le mapping entre les catégories d'actions existantes
 * et les types de temps pour l'analyse service (PROD, DEP, PILOT, FRAG).
 *
 * @module config/serviceTimeClassification
 */

/**
 * Types de temps pour analyse service
 */
export const TIME_TYPES = {
  PROD: 'PROD', // Production/Fabrication - Valeur ajoutée directe
  DEP: 'DEP', // Dépannage - Réactivité urgente
  PILOT: 'PILOT', // Pilotage - Amélioration/Documentation/Préventif
  FRAG: 'FRAG', // Fragmentation - Actions courtes dispersées
};

/**
 * Seuil de durée pour classification fragmentation (heures)
 * Actions < 0.5h sont considérées comme fragmentées
 */
export const FRAGMENTATION_THRESHOLD = 0.5;

/**
 * Mapping catégories d'actions → types de temps
 *
 * Basé sur les catégories existantes :
 * - ID 19 : DEP (Dépannage) → DEP
 * - ID 20 : FAB (Fabrication) → PROD
 * - ID 21 : DOC (Documentation) → PILOT
 * - ID 22 : PREV (Préventif) → PILOT
 * - ID 23 : SUP (Support/Administratif) → FRAG (par défaut, non protégé)
 * - ID 24 : BAT (Bâtiment/Nettoyage) → PROD
 */
export const CATEGORY_TO_TIME_TYPE = {
  19: TIME_TYPES.DEP, // Dépannage
  20: TIME_TYPES.PROD, // Fabrication
  21: TIME_TYPES.PILOT, // Documentation
  22: TIME_TYPES.PILOT, // Préventif
  23: TIME_TYPES.FRAG, // Support/Administratif → considéré fragmenté par défaut
  24: TIME_TYPES.PROD, // Bâtiment/Nettoyage
};

/**
 * Mapping codes catégories → types de temps (fallback)
 */
export const CATEGORY_CODE_TO_TIME_TYPE = {
  DEP: TIME_TYPES.DEP,
  FAB: TIME_TYPES.PROD,
  DOC: TIME_TYPES.PILOT,
  PREV: TIME_TYPES.PILOT,
  SUP: TIME_TYPES.FRAG, // Support → fragmenté par défaut
  BAT: TIME_TYPES.PROD,
};

/**
 * Classification d'une action selon son temps et sa catégorie
 *
 * @param {Object} action - Action à classifier
 * @param {number} action.timeSpent - Temps passé (heures)
 * @param {Object} action.subcategory - Sous-catégorie
 * @param {Object} action.subcategory.category - Catégorie
 * @param {number} action.subcategory.category.id - ID catégorie
 * @param {string} action.subcategory.category.code - Code catégorie
 * @returns {string} Type de temps (PROD|DEP|PILOT|FRAG)
 *
 * @example
 * classifyActionTime({
 *   timeSpent: 0.25,
 *   subcategory: { category: { id: 19, code: 'DEP' } }
 * }) // 'FRAG' (< 0.5h)
 *
 * classifyActionTime({
 *   timeSpent: 2.5,
 *   subcategory: { category: { id: 19, code: 'DEP' } }
 * }) // 'DEP'
 */
function isSupportOrFragment(categoryId, categoryCode) {
  return categoryId === 23 || categoryCode === 'SUP';
}

function isShortNonProtectedAction(timeSpent, categoryCode) {
  const isShort = timeSpent < FRAGMENTATION_THRESHOLD;
  const isNotProtected = categoryCode !== 'DEP' && categoryCode !== 'PREV';
  return isShort && isNotProtected;
}

function classifyByCategory(categoryId, categoryCode) {
  if (categoryId && CATEGORY_TO_TIME_TYPE[categoryId]) {
    return CATEGORY_TO_TIME_TYPE[categoryId];
  }

  if (categoryCode && CATEGORY_CODE_TO_TIME_TYPE[categoryCode]) {
    return CATEGORY_CODE_TO_TIME_TYPE[categoryCode];
  }

  return TIME_TYPES.PROD;
}

function extractCategoryInfo(action) {
  return {
    timeSpent: Number(action?.timeSpent ?? 0),
    categoryId: action?.subcategory?.category?.id,
    categoryCode: action?.subcategory?.category?.code,
  };
}

export function classifyActionTime(action) {
  const { timeSpent, categoryId, categoryCode } = extractCategoryInfo(action);

  if (
    isSupportOrFragment(categoryId, categoryCode) ||
    isShortNonProtectedAction(timeSpent, categoryCode)
  ) {
    return TIME_TYPES.FRAG;
  }

  return classifyByCategory(categoryId, categoryCode);
}

/**
 * Agrège les temps par type depuis une liste d'actions
 *
 * @param {Array<Object>} actions - Liste d'actions
 * @returns {Object} Temps agrégés par type
 * @returns {number} .PROD - Heures production
 * @returns {number} .DEP - Heures dépannage
 * @returns {number} .PILOT - Heures pilotage
 * @returns {number} .FRAG - Heures fragmentées
 * @returns {number} .total - Total heures
 *
 * @example
 * const breakdown = aggregateTimeByType([
 *   { timeSpent: 2, subcategory: { category: { id: 20 } } },
 *   { timeSpent: 0.25, subcategory: { category: { id: 19 } } }
 * ]);
 * // { PROD: 2, DEP: 0, PILOT: 0, FRAG: 0.25, total: 2.25 }
 */
export function aggregateTimeByType(actions) {
  const breakdown = {
    [TIME_TYPES.PROD]: 0,
    [TIME_TYPES.DEP]: 0,
    [TIME_TYPES.PILOT]: 0,
    [TIME_TYPES.FRAG]: 0,
    total: 0,
  };

  if (!actions?.length) return breakdown;

  actions.forEach((action) => {
    const timeSpent = Number(action?.timeSpent ?? 0);
    // Utiliser le timeType pré-calculé si disponible, sinon le recalculer
    const timeType = action.timeType || classifyActionTime({ ...action, timeSpent });

    breakdown[timeType] += timeSpent;
    breakdown.total += timeSpent;
  });

  return breakdown;
}

/**
 * Calcule le % d'actions courtes (< 0.5h)
 *
 * @param {Array<Object>} actions - Liste d'actions
 * @returns {number} Pourcentage d'actions courtes
 *
 * @example
 * calculateShortActionsPercent([
 *   { timeSpent: 0.25 },
 *   { timeSpent: 0.3 },
 *   { timeSpent: 2 }
 * ]) // 66.67 (2 sur 3)
 */
export function calculateShortActionsPercent(actions) {
  if (!actions?.length) return 0;

  const shortActions = actions.filter(
    (action) => (action?.timeSpent ?? 0) < FRAGMENTATION_THRESHOLD
  ).length;

  return (shortActions / actions.length) * 100;
}
