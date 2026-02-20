/**
 * Hook pour calculer la durée d'ouverture d'une intervention
 * Basé sur le status_log : date ouverture → date fermeture
 *
 * @param {Object} intervention - Intervention avec status_log
 * @returns {Object} { openingDate, closingDate, durationDays, isOpen }
 */
export const useInterventionDuration = (intervention) => {
  if (!intervention) {
    return { openingDate: null, closingDate: null, durationDays: null, isOpen: false };
  }

  // Utiliser createdAt comme date d'ouverture (déjà calculée dans le mapper depuis status_log)
  const openingDate = intervention.createdAt || intervention.reportedDate;

  // Chercher la date de fermeture dans le status_log
  let closingDate = null;
  if (intervention.statusLog && Array.isArray(intervention.statusLog)) {
    const closedLog = intervention.statusLog.find((log) => {
      const toValue = log.to?.value || log.to?.id;
      return toValue === 'ferme' || toValue?.toLowerCase() === 'closed' || toValue === 'fermé';
    });
    if (closedLog?.date) {
      closingDate = closedLog.date;
    }
  }

  // Déterminer si l'intervention est ouverte
  const isOpen =
    !closingDate && (intervention.status === 'open' || intervention.status === 'in_progress');

  // Calculer la durée
  let durationDays = null;
  if (openingDate) {
    const start = new Date(openingDate);
    const end = closingDate ? new Date(closingDate) : new Date();
    const diffMs = end - start;
    durationDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  return {
    openingDate,
    closingDate,
    durationDays,
    isOpen,
  };
};

/**
 * Fonction utilitaire pour calculer la durée sans hook (pour usage dans mappers/helpers)
 */
export const calculateInterventionDuration = (intervention) => {
  if (!intervention) {
    return { openingDate: null, closingDate: null, durationDays: null, isOpen: false };
  }

  const openingDate = intervention.createdAt || intervention.reportedDate;

  let closingDate = null;
  if (intervention.statusLog && Array.isArray(intervention.statusLog)) {
    const closedLog = intervention.statusLog.find((log) => {
      const toValue = log.to?.value || log.to?.id;
      return toValue === 'ferme' || toValue?.toLowerCase() === 'closed' || toValue === 'fermé';
    });
    if (closedLog?.date) {
      closingDate = closedLog.date;
    }
  }

  const isOpen =
    !closingDate && (intervention.status === 'open' || intervention.status === 'in_progress');

  let durationDays = null;
  if (openingDate) {
    const start = new Date(openingDate);
    const end = closingDate ? new Date(closingDate) : new Date();
    const diffMs = end - start;
    durationDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  return {
    openingDate,
    closingDate,
    durationDays,
    isOpen,
  };
};
