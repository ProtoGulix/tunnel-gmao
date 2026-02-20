/**
 * Détermine si une intervention est ouverte
 * @param {object} intervention - Objet intervention
 * @returns {boolean}
 */
export const isInterventionOpen = (intervention) => {
  const closedStatuses = ['ferme', 'closed'];
  return !closedStatuses.includes(intervention?.status_actual?.id);
};

/**
 * Filtre les données par période
 * @param {Array} data - Tableau de données avec une propriété date
 * @param {string} dateField - Nom du champ date
 * @param {number} milliseconds - Période en millisecondes
 * @returns {Array}
 */
export const filterByDateRange = (data, dateField, milliseconds) => {
  const cutoffDate = new Date(Date.now() - milliseconds);
  return data.filter(item => {
    if (!item[dateField]) return false;
    const itemDate = new Date(item[dateField]);
    return itemDate >= cutoffDate;
  });
};