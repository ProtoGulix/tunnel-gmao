/**
 * Configuration pour la détection d'anomalies dans les actions
 *
 * ⚠️ DEPRECATED - Ce fichier est obsolète !
 *
 * La configuration est maintenant chargée dynamiquement depuis PostgreSQL
 * via l'adapter anomalyConfig et le hook useAnomalyConfig.
 *
 * Migration :
 * - Ancien : import { ANOMALY_CONFIG } from '@/config/anomalyConfig';
 * - Nouveau : import { useAnomalyConfig } from '@/hooks/useAnomalyConfig';
 *
 * Avantages :
 * - Configuration modifiable à chaud via Directus admin
 * - Pas de redéploiement nécessaire pour ajuster les seuils
 * - Une seule source de vérité (PostgreSQL)
 *
 * @deprecated Utiliser useAnomalyConfig() à la place
 * @see src/hooks/useAnomalyConfig.js
 * @see src/lib/api/adapters/directus/anomalyConfig.adapter.js
 * @see docs/REGLES_METIER.md - Configuration métier centralisée
 */

export const ANOMALY_CONFIG = {
  // Catégories considérées comme "simples" (temps d'exécution normalement court)
  simpleCategories: ['BAT_NET', 'SUP_INV', 'SUP_ACH', 'SUP_GES'],

  // Catégories à faible valeur ajoutée
  lowValueCategories: ['SUP_ACH', 'SUP_INV', 'BAT_NET'],

  // Mots-clés suspects pour mauvaise classification
  suspiciousKeywords: [
    'identif',
    'tableur',
    'référence',
    'pneuma',
    'vis',
    'rangement',
    'tri',
    'classement',
    'inventaire',
    'commande',
  ],

  // Seuils de détection
  thresholds: {
    // A - Actions répétitives
    repetitive: {
      monthlyCount: 3, // Nombre maximal d'actions par mois sur même machine
      highSeverityCount: 6, // Seuil pour sévérité élevée
    },

    // B - Actions fragmentées
    fragmented: {
      maxDuration: 1, // Durée maximale en heures
      minOccurrences: 5, // Nombre minimal d'occurrences
      highSeverityCount: 10, // Seuil pour sévérité élevée
    },

    // C - Actions trop longues
    tooLong: {
      maxDuration: 4, // Durée maximale en heures pour catégorie simple
      highSeverityDuration: 8, // Seuil pour sévérité élevée
    },

    // D - Mauvaise classification
    badClassification: {
      minKeywords: 1, // Nombre minimal de mots-clés suspects
      highSeverityKeywords: 2, // Seuil pour sévérité élevée
    },

    // E - Retours back-to-back
    backToBack: {
      maxDaysDiff: 1, // Différence maximale en jours
      highSeverityDays: 0.5, // Seuil pour sévérité élevée
    },

    // F - Faible valeur + charge élevée
    lowValueHighLoad: {
      minTotalHours: 30, // Nombre minimal d'heures cumulées
      highSeverityHours: 60, // Seuil pour sévérité élevée
    },
  },

  // Configuration des badges de complexité
  complexityBadges: [
    { max: 3, color: 'green', label: 'Faible' },
    { max: 6, color: 'orange', label: 'Moyenne' },
    { max: 10, color: 'red', label: 'Élevée' },
  ],

  // Configuration des badges de priorité
  priorityBadges: [
    { max: 2, color: 'red', label: 'Urgent' },
    { max: 6, color: 'orange', label: 'Important' },
    { max: Infinity, color: 'blue', label: 'Normal' },
  ],

  // Configuration des badges de récurrence
  recurrenceBadges: [
    { max: 4, color: 'red', label: 'Très récurrent' },
    { max: 9, color: 'orange', label: 'Récurrent' },
    { max: Infinity, color: 'blue', label: 'Modéré' },
  ],
};

/**
 * Retourne la configuration d'un badge selon un score
 * @param {number} value - Valeur à évaluer
 * @param {Array} badgeConfig - Configuration des badges
 * @returns {Object} Configuration du badge
 */
export function getBadgeConfig(value, badgeConfig) {
  return badgeConfig.find((badge) => value <= badge.max) || badgeConfig[badgeConfig.length - 1];
}
