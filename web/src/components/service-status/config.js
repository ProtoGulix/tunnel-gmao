/**
 * @fileoverview Configuration locale pour le module ServiceStatus
 *
 * ⚠️ NOTE: Ces catégories devraient idéalement être fournies par l'API
 * pour garantir la cohérence avec le backend.
 *
 * @module components/service-status/config
 */

/**
 * Mapping des types de temps vers les catégories d'actions
 *
 * Ce mapping explique la composition de chaque type de temps affiché.
 * Les IDs correspondent aux catégories d'intervention dans la base de données.
 */
export const SERVICE_TIME_TYPE_CATEGORIES = {
  PROD: {
    label: 'Production',
    color: 'green',
    description: 'Travail de production et fabrication',
    categories: [{ code: 'FAB', name: 'Fabrication / Modification', id: 20 }],
  },
  DEP: {
    label: 'Dépannage',
    color: 'blue',
    description: 'Interventions de dépannage',
    categories: [{ code: 'DEP', name: 'Dépannage', id: 19 }],
  },
  PILOT: {
    label: 'Pilotage',
    color: 'purple',
    description: "Temps dédié à l'amélioration et documentation",
    categories: [
      { code: 'DOC', name: 'Documentation / Schéma', id: 21 },
      { code: 'PREV', name: 'Préventif / Vérification', id: 22 },
    ],
  },
  FRAG: {
    label: 'Fragmentation',
    color: 'orange',
    description: 'Support diffus et travaux ponctuels',
    categories: [
      { code: 'SUP', name: 'Support / Coordination', id: 23 },
      { code: 'BAT', name: 'Bâtiment / Travaux / Aménagement', id: 24 },
    ],
  },
};

/**
 * Seuils pour colorisation automatique
 */
export const THRESHOLDS = {
  CHARGE: { NORMAL: 70, HIGH: 85 },
  FRAGMENTATION: { LOW: 15, MEDIUM: 25 },
  PILOTAGE: { CRITICAL: 15, LOW: 25 },
};
