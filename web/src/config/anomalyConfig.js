/**
 * Configuration des seuils de détection d'anomalies de saisie.
 * Peut être surchargée dynamiquement via loadAnomalyConfig().
 */

export let ANOMALY_CONFIG = {
  thresholds: {
    repetitive: {
      monthlyCount: 3,
      highSeverityCount: 6,
    },
    fragmented: {
      maxDuration: 0.25,
      minOccurrences: 5,
      highSeverityCount: 10,
    },
    tooLong: {
      maxDuration: 8,
      highSeverityDuration: 12,
    },
    badClassification: {
      highSeverityKeywords: 2,
    },
    backToBack: {
      maxDaysDiff: 3,
      highSeverityDays: 1,
    },
    lowValueHighLoad: {
      minTotalHours: 10,
      highSeverityHours: 20,
    },
  },
  simpleCategories: ['NET', 'BAT_NET', 'NETT'],
  suspiciousKeywords: ['roulement', 'moteur', 'courroie', 'pompe', 'verin', 'vérin', 'joint', 'piston'],
  lowValueCategories: ['BAT_NET', 'NET', 'NETT'],
};

/**
 * Charge la config des anomalies depuis le backend si disponible,
 * sinon conserve les valeurs par défaut ci-dessus.
 */
export async function loadAnomalyConfig() {
  // Pas d'endpoint dédié côté backend — config statique côté front.
}
