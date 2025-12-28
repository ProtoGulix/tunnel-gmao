import { ANOMALY_CONFIG } from '@/config/anomalyConfig';
import {
  PRIORITY_BADGES,
  DEFAULT_PRIORITY_BADGE,
  STATUS_BADGES,
  DEFAULT_STATUS_BADGE,
  SEVERITY_BADGES,
  DEFAULT_SEVERITY_BADGE,
  COMPLEXITY_THRESHOLDS,
  MAX_COMPLEXITY_BADGE,
  LOAD_PRIORITY_BADGES,
  LOW_LOAD_BADGE,
  RECURRENCE_BADGES,
  RARE_RECURRENCE_BADGE,
  PRODUCTIVITY_THRESHOLDS,
  LOW_PRODUCTIVITY_BADGE,
} from '@/config/badgeConfig';

/**
 * Utilitaires pour le traitement des actions
 */

/**
 * Formate une date au format français
 * @param {string|Date} dateString - La date à formater
 * @returns {string} - Date formatée (ex: "12/11/2024")
 */
export function formatActionDate(dateString) {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Erreur formatage date:', error);
    return 'N/A';
  }
}

/**
 * Formate une date avec heure au format français
 * @param {string|Date} dateString - La date à formater
 * @returns {string} - Date et heure formatées (ex: "12/11/2024 14:30")
 */
export function formatActionDateTime(dateString) {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Erreur formatage date/heure:', error);
    return 'N/A';
  }
}

/**
 * Calcule le temps écoulé depuis une date (ex: "il y a 2 jours")
 * @param {string|Date} dateString - La date de référence
 * @returns {string} - Temps écoulé formaté
 */
export function getTimeAgo(dateString) {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "à l'instant";
    if (diffMins < 60) return `il y a ${diffMins}m`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays < 7) return `il y a ${diffDays}j`;
    if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)}sem`;

    return formatActionDate(dateString);
  } catch (error) {
    console.error('Erreur calcul temps:', error);
    return 'N/A';
  }
}

/**
 * Filtre les actions par plage de dates
 */
export function filterActionsByDateRange(actions, dateRange) {
  if (!dateRange) return actions;

  const { startDate, endDate } = dateRange;
  if (!startDate || !endDate) return actions;

  return actions.filter((action) => {
    const actionDate = new Date(action.createdAt);
    return actionDate >= startDate && actionDate <= endDate;
  });
}

/**
 * Détecte les actions répétitives (Type A)
 */
function detectRepetitiveActions(actionsData) {
  const { repetitive } = ANOMALY_CONFIG.thresholds || {};

  // Protection: si pas de config repetitive, retourner tableau vide
  if (!repetitive || typeof repetitive.monthlyCount === 'undefined') {
    console.warn('[detectRepetitiveActions] Configuration repetitive manquante ou invalide');
    return [];
  }

  const monthlyActions = new Map();

  actionsData.forEach((action) => {
    const categoryCode = action.subcategory?.code;
    const machineId = action.intervention?.machine?.id;
    const machineName = action.intervention?.machine?.name;

    if (!categoryCode || !machineId) return;

    const actionDate = new Date(action.createdAt);
    const monthKey = `${actionDate.getFullYear()}-${actionDate.getMonth() + 1}`;
    const key = `${categoryCode}|${machineId}|${monthKey}`;

    if (!monthlyActions.has(key)) {
      monthlyActions.set(key, {
        category: categoryCode,
        categoryName: action.subcategory.name,
        machine: machineName || `Machine #${machineId}`,
        machineId: machineId,
        month: monthKey,
        count: 0,
        actions: [],
        interventions: new Set(),
      });
    }

    const stat = monthlyActions.get(key);
    stat.count++;
    stat.actions.push(action);
    if (action.intervention?.id) {
      stat.interventions.add(action.intervention.id);
    }
  });

  return Array.from(monthlyActions.values())
    .filter((stat) => stat.count > repetitive.monthlyCount)
    .map((stat) => ({
      ...stat,
      interventionCount: stat.interventions.size,
      severity: stat.count > repetitive.highSeverityCount ? 'high' : 'medium',
      message: `${stat.category} sur ${stat.machine} : ${stat.count} fois ce mois (${
        stat.interventionCount
      } intervention${stat.interventionCount > 1 ? 's' : ''})`,
    }));
}

/**
 * Détecte les actions fragmentées (Type B)
 */
function detectFragmentedActions(actionsData) {
  const { fragmented } = ANOMALY_CONFIG.thresholds || {};

  // Protection: si pas de config fragmented, retourner tableau vide
  if (!fragmented || typeof fragmented.maxDuration === 'undefined') {
    console.warn('[detectFragmentedActions] Configuration fragmented manquante ou invalide');
    return [];
  }

  const fragmentedMap = new Map();

  actionsData.forEach((action) => {
    const time = parseFloat(action.timeSpent) || 0;
    const categoryCode = action.subcategory?.code;

    if (time >= fragmented.maxDuration || !categoryCode) return;

    if (!fragmentedMap.has(categoryCode)) {
      fragmentedMap.set(categoryCode, {
        category: categoryCode,
        categoryName: action.subcategory.name,
        count: 0,
        totalTime: 0,
        actions: [],
        interventions: new Set(),
      });
    }

    const stat = fragmentedMap.get(categoryCode);
    stat.count++;
    stat.totalTime += time;
    stat.actions.push(action);
    if (action.intervention?.id) {
      stat.interventions.add(action.intervention.id);
    }
  });

  return Array.from(fragmentedMap.values())
    .filter((stat) => stat.count > fragmented.minOccurrences)
    .map((stat) => ({
      ...stat,
      interventionCount: stat.interventions.size,
      avgTime: (stat.totalTime / stat.count).toFixed(2),
      severity: stat.count > fragmented.highSeverityCount ? 'high' : 'medium',
      message: `${stat.category} : ${stat.count} actions < ${
        fragmented.maxDuration
      }h (total: ${stat.totalTime.toFixed(2)}h, ${stat.interventionCount} intervention${
        stat.interventionCount > 1 ? 's' : ''
      })`,
    }));
}

/**
 * Détecte les actions trop longues (Type C)
 */
function detectTooLongActions(actionsData) {
  const { tooLong } = ANOMALY_CONFIG.thresholds || {};
  const { simpleCategories } = ANOMALY_CONFIG;

  // Protection: si pas de config tooLong, retourner tableau vide
  if (!tooLong || !tooLong.maxDuration) {
    console.warn('[detectTooLongActions] Configuration tooLong manquante ou invalide');
    return [];
  }

  return actionsData
    .filter((action) => {
      const time = parseFloat(action.timeSpent) || 0;
      const categoryCode = action.subcategory?.code;
      return time > tooLong.maxDuration && categoryCode && simpleCategories.includes(categoryCode);
    })
    .map((action) => {
      const time = parseFloat(action.timeSpent) || 0;
      return {
        action,
        category: action.subcategory.code,
        categoryName: action.subcategory.name,
        time,
        intervention: action.intervention?.code,
        interventionId: action.intervention?.id,
        interventionTitle: action.intervention?.title,
        machine: action.intervention?.machine?.name || 'N/A',
        tech: action.technician
          ? `${action.technician.firstName} ${action.technician.lastName}`
          : 'N/A',
        date: action.createdAt,
        severity: time > tooLong.highSeverityDuration ? 'high' : 'medium',
        message: `${time}h sur ${action.subcategory.code} (intervention ${action.intervention?.code})`,
      };
    });
}

/**
 * Détecte les mauvaises classifications (Type D)
 */
function detectBadClassification(actionsData) {
  const { suspiciousKeywords } = ANOMALY_CONFIG;
  const { badClassification } = ANOMALY_CONFIG.thresholds || {};

  // Protection: si pas de config badClassification, retourner tableau vide
  if (!badClassification || typeof badClassification.highSeverityKeywords === 'undefined') {
    console.warn('[detectBadClassification] Configuration badClassification manquante ou invalide');
    return [];
  }

  return actionsData
    .filter((action) => action.subcategory?.code === 'BAT_NET')
    .map((action) => {
      const description = (action.description || '').toLowerCase();
      const foundKeywords = suspiciousKeywords.filter((keyword) => description.includes(keyword));

      if (foundKeywords.length > 0) {
        return {
          action,
          category: action.subcategory.code,
          categoryName: action.subcategory.name,
          foundKeywords,
          description: action.description,
          intervention: action.intervention?.code,
          interventionId: action.intervention?.id,
          interventionTitle: action.intervention?.title,
          machine: action.intervention?.machine?.name || 'N/A',
          tech: action.technician
            ? `${action.technician.firstName} ${action.technician.lastName}`
            : 'N/A',
          date: action.createdAt,
          severity:
            foundKeywords.length > badClassification.highSeverityKeywords ? 'high' : 'medium',
          message: `BAT_NET mais contient: ${foundKeywords.join(', ')}`,
        };
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * Détecte les retours back-to-back (Type E)
 */
function detectBackToBackActions(actionsData) {
  const { backToBack } = ANOMALY_CONFIG.thresholds || {};

  // Protection: si pas de config backToBack, retourner tableau vide
  if (!backToBack || typeof backToBack.maxDaysDiff === 'undefined') {
    console.warn('[detectBackToBackActions] Configuration backToBack manquante ou invalide');
    return [];
  }

  const sortedActions = [...actionsData].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  const anomalies = [];
  const processedPairs = new Set();

  for (let i = 0; i < sortedActions.length - 1; i++) {
    const current = sortedActions[i];
    const next = sortedActions[i + 1];

    if (
      !current.technician?.id ||
      !next.technician?.id ||
      !current.intervention?.id ||
      !next.intervention?.id
    ) {
      continue;
    }

    const sameTech = current.technician.id === next.technician.id;
    const sameIntervention = current.intervention.id === next.intervention.id;

    if (sameTech && sameIntervention) {
      const daysDiff = Math.abs(
        (new Date(next.createdAt) - new Date(current.createdAt)) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= backToBack.maxDaysDiff) {
        const pairKey = `${current.intervention.id}-${current.technician.id}-${i}`;

        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);

          anomalies.push({
            actions: [current, next],
            tech: `${current.technician.firstName} ${current.technician.lastName}`,
            techId: current.technician.id,
            intervention: current.intervention.code,
            interventionId: current.intervention.id,
            interventionTitle: current.intervention.title,
            machine: current.intervention.machine?.name || 'N/A',
            daysDiff: daysDiff.toFixed(1),
            date1: current.createdAt,
            date2: next.createdAt,
            category1: current.subcategory?.name || 'N/A',
            category2: next.subcategory?.name || 'N/A',
            severity: daysDiff < backToBack.highSeverityDays ? 'high' : 'medium',
            message: `${current.intervention.code} : retour après ${daysDiff.toFixed(1)}j (${
              current.subcategory?.code || 'N/A'
            } → ${next.subcategory?.code || 'N/A'})`,
          });
        }
      }
    }
  }

  return anomalies;
}

/**
 * Détecte les catégories à faible valeur avec charge élevée (Type F)
 */
function detectLowValueHighLoad(actionsData) {
  const { lowValueCategories } = ANOMALY_CONFIG;
  const { lowValueHighLoad } = ANOMALY_CONFIG.thresholds || {};

  // Protection: si pas de config lowValueHighLoad, retourner tableau vide
  if (!lowValueHighLoad || typeof lowValueHighLoad.minTotalHours === 'undefined') {
    console.warn('[detectLowValueHighLoad] Configuration lowValueHighLoad manquante ou invalide');
    return [];
  }

  const loadMap = new Map();

  actionsData.forEach((action) => {
    const categoryCode = action.subcategory?.code;
    if (!categoryCode || !lowValueCategories.includes(categoryCode)) return;

    if (!loadMap.has(categoryCode)) {
      loadMap.set(categoryCode, {
        category: categoryCode,
        categoryName: action.subcategory.name,
        totalTime: 0,
        count: 0,
        actions: [],
        interventions: new Set(),
        machines: new Set(),
        techs: new Set(),
      });
    }

    const stat = loadMap.get(categoryCode);
    stat.totalTime += parseFloat(action.timeSpent) || 0;
    stat.count++;
    stat.actions.push(action);

    if (action.intervention?.id) {
      stat.interventions.add(action.intervention.id);
    }
    if (action.intervention?.machine?.name) {
      stat.machines.add(action.intervention.machine.name);
    }
    if (action.technician?.id) {
      stat.techs.add(action.technician.id);
    }
  });

  return Array.from(loadMap.values())
    .filter((stat) => stat.totalTime > lowValueHighLoad.minTotalHours)
    .map((stat) => ({
      ...stat,
      interventionCount: stat.interventions.size,
      machineCount: stat.machines.size,
      techCount: stat.techs.size,
      avgTime: (stat.totalTime / stat.count).toFixed(2),
      severity: stat.totalTime > lowValueHighLoad.highSeverityHours ? 'high' : 'medium',
      message: `${stat.category} : ${stat.totalTime.toFixed(2)}h cumulées (${stat.count} actions, ${
        stat.interventionCount
      } intervention${stat.interventionCount > 1 ? 's' : ''})`,
    }));
}

/**
 * Détecte toutes les anomalies dans les actions
 */
export function detectAnomalies(actionsData) {
  if (!actionsData || actionsData.length === 0) {
    return {
      tooRepetitive: [],
      tooFragmented: [],
      tooLongForCategory: [],
      badClassification: [],
      backToBack: [],
      lowValueHighLoad: [],
    };
  }

  return {
    tooRepetitive: detectRepetitiveActions(actionsData),
    tooFragmented: detectFragmentedActions(actionsData),
    tooLongForCategory: detectTooLongActions(actionsData),
    badClassification: detectBadClassification(actionsData),
    backToBack: detectBackToBackActions(actionsData),
    lowValueHighLoad: detectLowValueHighLoad(actionsData),
  };
}

/**
 * Vérifie si une date est dans le mois courant
 */
// eslint-disable-next-line no-unused-vars
function isThisMonth(date) {
  const actionDate = new Date(date);
  const now = new Date();
  return actionDate.getMonth() === now.getMonth() && actionDate.getFullYear() === now.getFullYear();
}

/**
 * Compte le nombre total d'anomalies
 */
function countTotalAnomalies(anomalies) {
  return Object.values(anomalies).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );
}

/**
 * Agrège les données par catégorie
 */
// eslint-disable-next-line no-unused-vars
function aggregateByCategory(actionsData) {
  const categoryMap = new Map();

  actionsData.forEach((action) => {
    const subcat = action.subcategory;
    if (!subcat) return;

    const key = `${subcat.code || 'Autre'}|${subcat.id}`;

    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        category: 'Action',
        subcategory: subcat.name,
        code: subcat.code,
        count: 0,
        totalTime: 0,
        totalComplexity: 0,
        interventions: new Set(),
        actionIds: [],
      });
    }

    const stat = categoryMap.get(key);
    stat.count++;
    stat.totalTime += parseFloat(action.timeSpent) || 0;
    stat.totalComplexity += parseInt(action.complexityScore) || 0;
    stat.actionIds.push(action.id);

    if (action.intervention?.id) {
      stat.interventions.add(action.intervention.id);
    }
  });

  return categoryMap;
}

/**
 * Agrège les données par intervention
 */
// eslint-disable-next-line no-unused-vars
function aggregateByIntervention(actionsData) {
  const interventionMap = new Map();

  actionsData.forEach((action) => {
    const intervId = action.intervention?.id;
    if (!intervId) return;

    if (!interventionMap.has(intervId)) {
      interventionMap.set(intervId, {
        id: intervId,
        code: action.intervention.code,
        title: action.intervention.title,
        actionCount: 0,
        totalTime: 0,
        totalComplexity: 0,
        categories: new Set(),
        actions: [],
      });
    }

    const stat = interventionMap.get(intervId);
    stat.actionCount++;
    stat.totalTime += parseFloat(action.timeSpent) || 0;
    stat.totalComplexity += parseInt(action.complexityScore) || 0;

    if (action.subcategory?.name) {
      stat.categories.add(action.subcategory.name);
    }

    stat.actions.push({
      id: action.id,
      category: action.subcategory?.name,
      code: action.subcategory?.code,
      description: action.description,
      time: action.timeSpent,
      complexity: action.complexityScore,
      date: action.createdAt,
    });
  });

  return interventionMap;
}

/**
 * Calcule les statistiques des actions
 * Retourne un objet avec catégories, interventions et anomalies
 */
export function calculateActionStats(actions) {
  if (!actions || actions.length === 0) {
    return {
      categories: [],
      topInterventions: [],
      anomalies: null,
      totalTime: 0,
      avgComplexity: 0,
      totalActions: 0,
      categoriesCount: 0,
    };
  }

  const categories = {};
  const interventions = {};
  let totalTime = 0;
  let totalComplexity = 0;

  actions.forEach((action) => {
    const timeSpent = parseFloat(action.timeSpent) || 0;
    const complexity = parseFloat(action.complexityScore) || 0;

    totalTime += timeSpent;
    totalComplexity += complexity;

    // Groupement par catégorie
    const catKey = action.subcategory?.code || 'Sans catégorie';
    if (!categories[catKey]) {
      categories[catKey] = {
        code: action.subcategory?.code,
        category: 'Action',
        subcategory: action.subcategory?.name,
        count: 0,
        totalTime: 0,
        totalComplexity: 0,
        interventions: new Set(),
        actionIds: [],
      };
    }
    categories[catKey].count += 1;
    categories[catKey].totalTime += timeSpent;
    categories[catKey].totalComplexity += complexity;
    categories[catKey].actionIds.push(action.id);

    if (action.intervention?.id) {
      categories[catKey].interventions.add(action.intervention.id);
    }

    // Groupement par intervention
    const intervId = action.intervention?.id;
    if (intervId) {
      if (!interventions[intervId]) {
        interventions[intervId] = {
          id: intervId,
          code: action.intervention?.code,
          title: action.intervention?.title,
          actionCount: 0,
          totalTime: 0,
          totalComplexity: 0,
          categories: new Set(),
        };
      }
      interventions[intervId].actionCount += 1;
      interventions[intervId].totalTime += timeSpent;
      interventions[intervId].totalComplexity += complexity;
      interventions[intervId].categories.add(catKey);
    }
  });

  // Détection d'anomalies
  const detectedAnomalies = detectAnomalies(actions);

  // Conversion et tri des catégories avec loadScore
  const sortedCategories = Object.values(categories)
    .map((cat) => {
      const avgTime = cat.count > 0 ? parseFloat((cat.totalTime / cat.count).toFixed(2)) : 0;
      const avgComplexity =
        cat.count > 0 ? parseFloat((cat.totalComplexity / cat.count).toFixed(1)) : 0;
      const interventionCount = cat.interventions.size;

      // Calcul du score de charge
      const loadScore = cat.count * cat.totalTime;

      return {
        ...cat,
        avgTime,
        avgComplexity,
        interventionCount,
        loadScore,
        interventions: undefined, // Retirer le Set
      };
    })
    .sort((a, b) => b.loadScore - a.loadScore);

  // ✅ Conversion et tri des interventions avec recurrenceScore
  const sortedInterventions = Object.values(interventions)
    .map((interv) => {
      const categoryCount = interv.categories.size;
      const avgComplexity =
        interv.actionCount > 0
          ? parseFloat((interv.totalComplexity / interv.actionCount).toFixed(1))
          : 0;

      // ✅ Calcul du temps moyen par action
      const avgTime =
        interv.actionCount > 0 ? parseFloat((interv.totalTime / interv.actionCount).toFixed(2)) : 0;

      // ✅ Calcul du score de récurrence : nombre d'actions × temps total
      // Plus l'intervention nécessite d'actions ET de temps, plus le score est élevé
      const recurrenceScore = interv.actionCount * interv.totalTime;

      return {
        ...interv,
        categoryCount,
        avgComplexity,
        avgTime, // ✅ Ajout du temps moyen
        recurrenceScore, // ✅ Ajout du score de récurrence
        categories: undefined, // Retirer le Set
      };
    })
    .sort((a, b) => b.recurrenceScore - a.recurrenceScore) // ✅ Tri par score décroissant
    .slice(0, 10);

  // Calcul des moyennes globales
  const avgComplexity =
    actions.length > 0 ? parseFloat((totalComplexity / actions.length).toFixed(1)) : 0;

  return {
    categories: sortedCategories,
    topInterventions: sortedInterventions,
    anomalies: countTotalAnomalies(detectedAnomalies) > 0 ? detectedAnomalies : null,
    totalTime: parseFloat(totalTime.toFixed(2)),
    avgComplexity: avgComplexity,
    totalActions: actions.length,
    categoriesCount: Object.keys(categories).length,
  };
}

/**
 * Retourne le badge de complexité avec couleur et icône
 * @param {number} complexity - Score de complexité (1-10)
 * @returns {object} - { color, icon, label, value }
 */
export function getComplexityBadge(complexity) {
  const score = parseInt(complexity) || 0;

  for (const threshold of COMPLEXITY_THRESHOLDS) {
    if (score <= threshold.max) {
      return { ...threshold.badge, value: score };
    }
  }

  return { ...MAX_COMPLEXITY_BADGE, value: score };
}

/**
 * Retourne le badge de priorité avec couleur et icône
 * @param {string} priority - Niveau de priorité
 * @returns {object} - { color, icon, label }
 */
export function getPriorityBadge(priority) {
  const p = (priority || '').toLowerCase();
  return PRIORITY_BADGES[p] || DEFAULT_PRIORITY_BADGE;
}

/**
 * Retourne le badge de statut avec couleur et icône
 * @param {string} status - Statut de l'action
 * @returns {object} - { color, icon, label }
 */
export function getStatusBadge(status) {
  const s = (status || '').toLowerCase();
  return STATUS_BADGES[s] || DEFAULT_STATUS_BADGE;
}

/**
 * Retourne la sévérité d'une anomalie avec couleur
 * @param {string} severity - Niveau de sévérité
 * @returns {object} - { color, icon, label }
 */
export function getSeverityBadge(severity) {
  const sev = (severity || '').toLowerCase();
  return SEVERITY_BADGES[sev] || DEFAULT_SEVERITY_BADGE;
}

/**
 * Retourne le badge de charge de travail (pour classement des catégories)
 * @param {number} rank - Position dans le classement (0 = premier)
 * @returns {object} - { color, icon, label }
 */
export function getLoadPriorityBadge(rank) {
  for (const config of LOAD_PRIORITY_BADGES) {
    if (config.rank !== undefined && rank === config.rank) {
      return config.badge;
    }
    if (config.maxRank !== undefined && rank <= config.maxRank) {
      return config.badge;
    }
  }
  return LOW_LOAD_BADGE;
}

/**
 * Retourne le badge de récurrence (pour classement des interventions)
 * @param {number} rank - Position dans le classement (0 = premier)
 * @returns {object} - { color, icon, label }
 */
export function getRecurrenceBadge(rank) {
  for (const config of RECURRENCE_BADGES) {
    if (config.rank !== undefined && rank === config.rank) {
      return config.badge;
    }
    if (config.maxRank !== undefined && rank <= config.maxRank) {
      return config.badge;
    }
  }
  return RARE_RECURRENCE_BADGE;
}

/**
 * Retourne la couleur de catégorie d'action depuis les données backend
 * @param {object} subcategory - Subcategory object avec category.color
 * @returns {string} - Couleur Radix UI (ex: 'blue', 'red', 'gray')
 */
export function getCategoryColor(subcategory) {
  return subcategory?.category?.color || 'gray';
}

/**
 * Calcule le taux de productivité d'un technicien
 * @param {array} actions - Actions du technicien
 * @returns {object} - { rate, color, label }
 */
export function getProductivityRate(actions) {
  if (!actions || actions.length === 0) {
    return { rate: 0, color: 'gray', label: 'Aucune donnée' };
  }

  const totalTime = actions.reduce((sum, a) => sum + (parseFloat(a.timeSpent) || 0), 0);
  const avgComplexity =
    actions.reduce((sum, a) => sum + (parseInt(a.complexityScore) || 0), 0) / actions.length;

  // Formule simple : (actions / temps) * complexité moyenne
  const rate = totalTime > 0 ? (actions.length / totalTime) * (avgComplexity / 5) : 0;

  for (const threshold of PRODUCTIVITY_THRESHOLDS) {
    if (rate >= threshold.min) {
      return { rate: rate.toFixed(2), ...threshold.badge };
    }
  }

  return { rate: rate.toFixed(2), ...LOW_PRODUCTIVITY_BADGE };
}

/**
 * Groupe les actions par mois
 * @param {array} actions - Liste d'actions
 * @returns {object} - Stats par mois
 */
export function groupActionsByMonth(actions) {
  const monthMap = new Map();

  actions.forEach((action) => {
    const date = new Date(action.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        key: monthKey,
        label: monthLabel,
        count: 0,
        totalTime: 0,
        totalComplexity: 0,
        actions: [],
      });
    }

    const stat = monthMap.get(monthKey);
    stat.count += 1;
    stat.totalTime += parseFloat(action.timeSpent) || 0;
    stat.totalComplexity += parseInt(action.complexityScore) || 0;
    stat.actions.push(action);
  });

  return Array.from(monthMap.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((month) => ({
      ...month,
      avgTime: month.count > 0 ? parseFloat((month.totalTime / month.count).toFixed(2)) : 0,
      avgComplexity:
        month.count > 0 ? parseFloat((month.totalComplexity / month.count).toFixed(1)) : 0,
    }));
}

/**
 * Groupe les actions par technicien
 * @param {array} actions - Liste d'actions
 * @returns {array} - Stats par technicien
 */
export function groupActionsByTechnician(actions) {
  const techMap = new Map();

  actions.forEach((action) => {
    if (!action.technician?.id) return;

    const techId = action.technician.id;
    const techName = `${action.technician.firstName} ${action.technician.lastName}`;

    if (!techMap.has(techId)) {
      techMap.set(techId, {
        id: techId,
        name: techName,
        count: 0,
        totalTime: 0,
        totalComplexity: 0,
        interventions: new Set(),
        categories: new Set(),
        actions: [],
      });
    }

    const stat = techMap.get(techId);
    stat.count += 1;
    stat.totalTime += parseFloat(action.timeSpent) || 0;
    stat.totalComplexity += parseInt(action.complexityScore) || 0;
    stat.actions.push(action);

    if (action.intervention?.id) {
      stat.interventions.add(action.intervention.id);
    }
    if (action.subcategory?.code) {
      stat.categories.add(action.subcategory.code);
    }
  });

  return Array.from(techMap.values())
    .map((tech) => ({
      ...tech,
      interventionCount: tech.interventions.size,
      categoryCount: tech.categories.size,
      avgTime: tech.count > 0 ? parseFloat((tech.totalTime / tech.count).toFixed(2)) : 0,
      avgComplexity:
        tech.count > 0 ? parseFloat((tech.totalComplexity / tech.count).toFixed(1)) : 0,
      productivity: getProductivityRate(tech.actions),
      // ✅ Retirer les Sets pour éviter erreurs de sérialisation
      interventions: undefined,
      categories: undefined,
    }))
    .sort((a, b) => b.count - a.count);
} // ✅ Fermeture de la fonction manquante

/**
 * Retourne les statistiques de tendance pour une action
 * @param {array} actions - Liste d'actions
 * @param {string} metric - Métrique ("time", "complexity", "count")
 * @returns {object} - { trend, percentage, direction }
 */
export function calculateTrend(actions, metric = 'time') {
  if (!actions || actions.length < 2) {
    return { trend: 'stable', percentage: 0, direction: '→' };
  }

  const mid = Math.floor(actions.length / 2);
  const firstHalf = actions.slice(0, mid);
  const secondHalf = actions.slice(mid);

  let firstValue, secondValue;

  if (metric === 'time') {
    firstValue = firstHalf.reduce((sum, a) => sum + (parseFloat(a.timeSpent) || 0), 0);
    secondValue = secondHalf.reduce((sum, a) => sum + (parseFloat(a.timeSpent) || 0), 0);
  } else if (metric === 'complexity') {
    firstValue =
      firstHalf.reduce((sum, a) => sum + (parseInt(a.complexityScore) || 0), 0) / firstHalf.length;
    secondValue =
      secondHalf.reduce((sum, a) => sum + (parseInt(a.complexityScore) || 0), 0) /
      secondHalf.length;
  } else {
    firstValue = firstHalf.length;
    secondValue = secondHalf.length;
  }

  const percentage =
    firstValue === 0 ? 0 : Math.round(((secondValue - firstValue) / firstValue) * 100);

  return {
    trend: percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable',
    percentage: Math.abs(percentage),
    direction: percentage > 0 ? '↑' : percentage < 0 ? '↓' : '→',
  };
}

/**
 * Formate le temps en format lisible
 * @param {number} hours - Nombre d'heures
 * @returns {string} - Temps formaté (ex: "2h 30m")
 */
export function formatTime(hours) {
  if (!hours || hours === 0) return '0h';

  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Calcule les statistiques par jour de la semaine
 * @param {array} actions - Liste d'actions
 * @returns {object} - Stats par jour
 */
export function getWeekdayStats(actions) {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const stats = {
    Lun: { count: 0, time: 0 },
    Mar: { count: 0, time: 0 },
    Mer: { count: 0, time: 0 },
    Jeu: { count: 0, time: 0 },
    Ven: { count: 0, time: 0 },
    Sam: { count: 0, time: 0 },
    Dim: { count: 0, time: 0 },
  };

  actions.forEach((action) => {
    const date = new Date(action.createdAt);
    const dayIndex = (date.getDay() + 6) % 7; // Lun = 0, Dim = 6
    const dayName = days[dayIndex];

    stats[dayName].count += 1;
    stats[dayName].time += parseFloat(action.timeSpent) || 0;
  });

  return stats;
}

/**
 * Calcule les statistiques par heure du jour
 * @param {array} actions - Liste d'actions
 * @returns {object} - Stats par heure
 */
export function getHourlyStats(actions) {
  const stats = {};

  for (let i = 0; i < 24; i++) {
    stats[i] = { count: 0, time: 0 };
  }

  actions.forEach((action) => {
    const date = new Date(action.createdAt);
    const hour = date.getHours();

    stats[hour].count += 1;
    stats[hour].time += parseFloat(action.timeSpent) || 0;
  });

  return stats;
}
