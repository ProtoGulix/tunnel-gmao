/**
 * Anomaly Configuration Mapper (Backend → Domain)
 *
 * Transforme les données backend en DTOs domain conformes à API_CONTRACTS.md.
 * AUCUNE logique backend - accepte des objets génériques.
 *
 * @module lib/api/adapters/directus/anomalyConfig/mapper
 * @see docs/tech/API_CONTRACTS.md - DTOs domain
 */

/**
 * Configuration des badges (statique - non modifiable via DB pour l'instant).
 * Retourné tel quel dans la config finale.
 */
const STATIC_BADGES = {
  complexityBadges: [
    { max: 3, color: 'green', label: 'Faible' },
    { max: 6, color: 'orange', label: 'Moyenne' },
    { max: 10, color: 'red', label: 'Élevée' },
  ],
  priorityBadges: [
    { max: 2, color: 'red', label: 'Urgent' },
    { max: 6, color: 'orange', label: 'Important' },
    { max: Infinity, color: 'blue', label: 'Normal' },
  ],
  recurrenceBadges: [
    { max: 4, color: 'red', label: 'Très récurrent' },
    { max: 9, color: 'orange', label: 'Récurrent' },
    { max: Infinity, color: 'blue', label: 'Modéré' },
  ],
};

/**
 * Transforme les catégories en listes domain (simples + low-value).
 */
function mapCategories(categories: Record<string, unknown>[]) {
  const simpleCategories = categories
    .filter((cat) => cat.is_simple)
    .map((cat) => cat.category_code);

  const lowValueCategories = categories
    .filter((cat) => cat.is_low_value)
    .map((cat) => cat.category_code);

  return { simpleCategories, lowValueCategories };
}

/**
 * Extrait les mots-clés suspects des sondes de classification.
 */
function mapProbes(probes: Record<string, unknown>[]) {
  return probes.map((probe) => probe.keyword);
}

/**
 * Normalise le type d'anomalie du backend (snake_case) vers domain (camelCase).
 * Centralise la conversion pour tous mappers utilisant anomaly_type.
 * 
 * @param raw - Type d'anomalie backend (ex: "too_long", "back_to_back")
 * @returns Type normalisé domain (ex: "tooLong", "backToBack")
 * 
 * @example
 * normalizeAnomalyType("too_long") // → "tooLong"
 * normalizeAnomalyType("back_to_back") // → "backToBack"
 */
const normalizeAnomalyType = (raw: string): string => {
  if (!raw) return '';
  return raw.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Transforme les seuils en objet indexé par type d'anomalie (clés en camelCase).
 */
function mapThresholds(thresholds: Record<string, unknown>[]) {
  const thresholdsMap: Record<string, unknown> = {};

  thresholds.forEach((threshold) => {
    const config = (threshold.config_json as Record<string, unknown>) || {};
    // Normaliser la clé via normalizer centralisé
    const camelKey = normalizeAnomalyType(threshold.anomaly_type as string);
    thresholdsMap[camelKey] = {
      ...config,
      threshold_value: threshold.threshold_value,
      high_severity_value: threshold.high_severity_value,
    };
  });

  return thresholdsMap;
}

/**
 * Construit la configuration complète au format domain.
 *
 * @param categories - Métadonnées catégories (backend raw)
 * @param probes - Sondes NLP (backend raw)
 * @param thresholds - Seuils anomalies (backend raw)
 * @returns Configuration format compatible avec actionUtils.js
 */
export function buildAnomalyConfig(
  categories: Record<string, unknown>[],
  probes: Record<string, unknown>[],
  thresholds: Record<string, unknown>[]
) {
  const { simpleCategories, lowValueCategories } = mapCategories(categories);
  const suspiciousKeywords = mapProbes(probes);
  const thresholdsMap = mapThresholds(thresholds);

  return {
    simpleCategories,
    lowValueCategories,
    suspiciousKeywords,
    thresholds: thresholdsMap,
    ...STATIC_BADGES,
  };
}
