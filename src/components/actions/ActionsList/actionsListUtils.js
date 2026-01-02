/**
 * Fonctions pures pour le filtrage et l'analyse des actions
 * Aucun effet de bord, 100% déterministe
 */

// ==================== ACCESSORS ====================

export const getActionCreatedAt = (action) => action?.createdAt ?? action?.created_at ?? null;
export const getActionDescription = (action) => action?.description ?? '';
export const getActionComplexityScore = (action) =>
  Number(action?.complexityScore ?? action?.complexity_score ?? 0);
export const getActionTimeSpent = (action) => Number(action?.timeSpent ?? action?.time_spent ?? 0);

export const getInterventionId = (intervention) => intervention?.id ?? null;
export const getInterventionCode = (intervention) => intervention?.code ?? '—';
export const getInterventionTitle = (intervention) => intervention?.title ?? '—';

export const getSubcategoryCode = (subcategory) => subcategory?.code ?? '—';
export const getSubcategoryName = (subcategory) => subcategory?.name ?? '—';

export const getTechnicianFirstName = (technician) =>
  technician?.firstName ?? technician?.first_name ?? '—';
export const getTechnicianLastName = (technician) =>
  technician?.lastName ?? technician?.last_name ?? '—';

// ==================== CATEGORY EXTRACTION ====================

/**
 * Extrait le code de sous-catégorie d'une action (compatibilité legacy)
 */
const getActionCategoryCode = (action) => {
  return action?.action_subcategory?.code ?? action?.subcategory?.code ?? null;
};

/**
 * Extrait le nom de sous-catégorie d'une action (compatibilité legacy)
 */
const getActionCategoryName = (action) => {
  return action?.action_subcategory?.name ?? action?.subcategory?.name ?? '';
};

/**
 * Retourne toutes les catégories uniques présentes dans les actions
 */
export function extractUniqueCategories(actions) {
  if (!Array.isArray(actions)) return [];

  const codes = actions.map(getActionCategoryCode).filter(Boolean);

  return [...new Set(codes)];
}

/**
 * Compte le nombre d'actions pour une catégorie donnée
 */
export function countActionsByCategory(actions, categoryCode) {
  if (!Array.isArray(actions) || !categoryCode) return 0;

  return actions.filter((action) => getActionCategoryCode(action) === categoryCode).length;
}

// ==================== FILTERING ====================

/**
 * Filtre les actions par terme de recherche
 * Recherche dans : description, code intervention, nom catégorie
 */
export function filterActionsBySearch(actions, searchTerm) {
  if (!Array.isArray(actions)) return [];
  if (!searchTerm || searchTerm.trim() === '') return actions;

  const term = searchTerm.toLowerCase();

  return actions.filter((action) => {
    const description = getActionDescription(action).toLowerCase();
    const interventionCode = (
      action.intervention_id?.code ??
      action.intervention?.code ??
      ''
    ).toLowerCase();
    const categoryName = getActionCategoryName(action).toLowerCase();

    return (
      description.includes(term) || interventionCode.includes(term) || categoryName.includes(term)
    );
  });
}

/**
 * Filtre les actions par catégorie sélectionnée
 */
export function filterActionsByCategory(actions, selectedCategory) {
  if (!Array.isArray(actions)) return [];
  if (!selectedCategory) return actions;

  return actions.filter((action) => getActionCategoryCode(action) === selectedCategory);
}

/**
 * Applique tous les filtres (recherche + catégorie)
 */
export function applyAllFilters(actions, searchTerm, selectedCategory) {
  let result = actions;

  result = filterActionsBySearch(result, searchTerm);
  result = filterActionsByCategory(result, selectedCategory);

  return result;
}
