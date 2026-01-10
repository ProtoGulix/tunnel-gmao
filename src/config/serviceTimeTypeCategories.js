/**
 * @fileoverview Mapping des types de temps vers les catégories d'actions
 *
 * ⚠️ SOURCE API : Utilise uniquement les catégories réelles de l'API Directus
 * Pas de données en dur ni de catégories composites.
 *
 * Catégories API réelles :
 * - DEP (id 19) : Dépannage
 * - FAB (id 20) : Fabrication / Modification
 * - DOC (id 21) : Documentation / Schéma
 * - PREV (id 22) : Préventif / Vérification
 * - SUP (id 23) : Support / Coordination
 * - BAT (id 24) : Bâtiment / Travaux / Aménagement
 *
 * @module config/serviceTimeTypeCategories
 */

/**
 * Mapping des types de temps vers les catégories d'actions réelles de l'API
 *
 * Structure :
 * - PROD : regroupe FAB (fabrication réelle)
 * - DEP : regroupe DEP (dépannage)
 * - PILOT : regroupe DOC + PREV (pilotage)
 * - FRAG : regroupe SUP (fragmentation) + BAT (travaux ponctuels)
 *
 * @typedef {Object} TimeTypeConfig
 * @property {string} label - Libellé du type de temps
 * @property {string} color - Couleur Radix (green, blue, purple, orange)
 * @property {string} description - Description courte
 * @property {Array<{code: string, name: string, id: number}>} categories - Catégories API avec codes
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
    description: 'Temps dédié à l&apos;amélioration et documentation',
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
