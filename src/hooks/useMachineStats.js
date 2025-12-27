import { useMemo } from "react";
import { isInterventionOpen, filterByDateRange } from "@/lib/utils/interventionHelpers";

const TIME_RANGES = {
  LAST_30_DAYS: 30 * 24 * 60 * 60 * 1000,
  LAST_90_DAYS: 90 * 24 * 60 * 60 * 1000
};

/**
 * Hook personnalisé pour calculer les statistiques d'une machine
 * @param {Array} interventions - Liste des interventions
 * @param {Array} actions - Liste des actions
 * @param {Array} subcategories - Liste des sous-catégories
 * @returns {object} Statistiques calculées
 */
export const useMachineStats = (interventions, actions, subcategories) => {
  return useMemo(() => {
    // Si aucune donnée, retourner des stats vides plutôt que null
    if (!interventions || !actions || !subcategories) {
      return {
        total: 0,
        open: 0,
        closed: 0,
        last30Days: 0,
        last90Days: 0,
        byType: {},
        byPriority: {},
        byStatus: {},
        availabilityRate: 100,
        globalStatus: 'ok',
        totalTimeSpent: 0,
        timeBySubcategory: [],
        topSubcategories: [],
        timeByTech: {},
        avgComplexity: 0,
        last30DaysTime: 0,
        avgTimePerIntervention: 0,
        totalActions: 0
      };
    }

    // Séparation des interventions
    const openInterventions = interventions.filter(isInterventionOpen);
    const closedInterventions = interventions.filter(i => !isInterventionOpen(i));

    // Statistiques par période
    const last30DaysInterventions = filterByDateRange(
      interventions, 
      'reported_date', 
      TIME_RANGES.LAST_30_DAYS
    );
    
    const last90DaysInterventions = filterByDateRange(
      interventions, 
      'reported_date', 
      TIME_RANGES.LAST_90_DAYS
    );

    const last30DaysActions = filterByDateRange(
      actions, 
      'created_at', 
      TIME_RANGES.LAST_30_DAYS
    );

    // Répartitions
    const byType = interventions.reduce((acc, i) => {
      const type = i.type_inter?.toUpperCase() || 'UNKNOWN';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const byPriority = interventions.reduce((acc, i) => {
      const priority = i.priority || 'normal';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    const byStatus = interventions.reduce((acc, i) => {
      const status = i.status_actual?.id || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Statistiques des actions
    const subcatMap = new Map(subcategories.map(s => [s.id, s]));

    const totalTimeSpent = actions.reduce(
      (sum, a) => sum + parseFloat(a.time_spent || 0), 
      0
    );

    const last30DaysTime = last30DaysActions.reduce(
      (sum, a) => sum + parseFloat(a.time_spent || 0), 
      0
    );

    const timeBySubcategory = actions.reduce((acc, action) => {
      const subcatId = action.action_subcategory;
      if (!subcatId) return acc;
      
      if (!acc[subcatId]) {
        const subcat = subcatMap.get(subcatId);
        acc[subcatId] = {
          id: subcatId,
          code: subcat?.code || 'N/A',
          name: subcat?.name || 'Inconnu',
          categoryId: subcat?.category_id,
          time: 0,
          count: 0
        };
      }
      
      acc[subcatId].time += parseFloat(action.time_spent || 0);
      acc[subcatId].count += 1;
      
      return acc;
    }, {});

    const topSubcategories = Object.values(timeBySubcategory)
      .sort((a, b) => b.time - a.time)
      .slice(0, 5);

    const timeByTech = actions.reduce((acc, action) => {
      const techId = action.tech?.id || 'unknown';
      const techName = action.tech 
        ? `${action.tech.first_name} ${action.tech.last_name}` 
        : 'Non assigné';
      
      if (!acc[techId]) {
        acc[techId] = { name: techName, time: 0, actions: 0 };
      }
      
      acc[techId].time += parseFloat(action.time_spent || 0);
      acc[techId].actions += 1;
      
      return acc;
    }, {});

    // Indicateurs clés
    const actionsWithComplexity = actions.filter(a => a.complexity_score !== null);
    const avgComplexity = actionsWithComplexity.length > 0
      ? actionsWithComplexity.reduce((sum, a) => sum + a.complexity_score, 0) / actionsWithComplexity.length
      : 0;

    const avgTimePerIntervention = interventions.length > 0
      ? totalTimeSpent / interventions.length
      : 0;

    const curativeCount = byType['CUR'] || 0;
    const availabilityRate = interventions.length > 0 
      ? ((interventions.length - curativeCount) / interventions.length) * 100 
      : 100;

    // État global
    const hasUrgent = openInterventions.some(i => i.priority === 'urgent');
    const hasCurative = openInterventions.some(i => i.type_inter === 'CUR');
    
    let globalStatus = 'ok';
    if (hasUrgent) {
      globalStatus = 'critical';
    } else if (hasCurative) {
      globalStatus = 'warning';
    } else if (openInterventions.length > 0) {
      globalStatus = 'maintenance';
    }

    return {
      total: interventions.length,
      open: openInterventions.length,
      closed: closedInterventions.length,
      last30Days: last30DaysInterventions.length,
      last90Days: last90DaysInterventions.length,
      byType,
      byPriority,
      byStatus,
      availabilityRate,
      globalStatus,
      totalTimeSpent,
      timeBySubcategory: Object.values(timeBySubcategory),
      topSubcategories,
      timeByTech,
      avgComplexity,
      last30DaysTime,
      avgTimePerIntervention,
      totalActions: actions.length
    };
  }, [interventions, actions, subcategories]);
};