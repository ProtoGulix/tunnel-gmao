export const getCategoryId = (subcategory) =>
  subcategory?.id ?? subcategory?.category_id?.id ?? null;

export const getCategoryCode = (subcategory) =>
  subcategory?.category_id?.code ?? subcategory?.categoryCode ?? subcategory?.code ?? '—';

export const getCategoryName = (subcategory) =>
  subcategory?.name ?? subcategory?.category_name ?? '—';

export { getCategoryColor } from '@/lib/utils/interventionUtils';

export const isComplexityValid = (complexity) =>
  Number(complexity) >= 1 && Number(complexity) <= 10;

export const areComplexityFactorsRequired = (complexity) => Number(complexity) > 5;

export const validateFormState = (formState, timeRange = null, manualTimeSpent = '') => {
  const errors = [];

  if (!isComplexityValid(formState.complexity)) {
    errors.push('Complexité doit être entre 1 et 10');
  }

  if (areComplexityFactorsRequired(formState.complexity) && !formState.complexityFactors?.length) {
    errors.push('Au moins un facteur de complexité est requis pour complexité > 5');
  }

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

  return { isValid: errors.length === 0, errors };
};
