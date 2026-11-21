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
    categories: [
      { code: 'FAB', name: 'Fabrication / Modification', id: 20 },
      { code: 'BAT', name: 'Bâtiment / Travaux / Aménagement', id: 24 },
    ],
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
    ],
  },
};

/**
 * Définitions des trois indicateurs de service et des deux tableaux de détail, affichées derrière
 * l'icône d'aide (ADR 0034). Les seuils n'y figurent pas : l'API les fournit (ADR 0034, point 8).
 */
export const SERVICE_DEFINITIONS = {
  charge: 'Temps total heures / Capacité ETP proratisée sur la période.',
  pilot: "% temps long protégé (documentation, préventif, dépannage réel).",
  fragmentation: '% temps fragmenté (support, actions courtes < 0,5h non-dépannage).',
  fragmentationCauses: "Ces causes représentent les principales sources de fragmentation du temps du service. Elles correspondent à du support diffus, des interruptions ou des micro-actions répétées. Réduire la fragmentation passe par une action sur ces causes, pas par l'ajout de ressources.",
  siteConsumption: 'Cette analyse montre quels sites consomment la capacité du service maintenance. Elle reflète des contraintes organisationnelles (distance, support, coordination), et non la performance des équipes ou des équipements.',
};
