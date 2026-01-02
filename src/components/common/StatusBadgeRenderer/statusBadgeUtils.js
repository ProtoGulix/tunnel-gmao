/**
 * Utilitaires pour StatusBadgeRenderer
 * Extraction de la logique pour réduire la complexité
 */

/**
 * Formate une date pour affichage court (HH:MM)
 */
export function formatShortTime(dateString) {
  return new Date(dateString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formate une date complète
 */
export function formatFullDateTime(dateString) {
  return new Date(dateString).toLocaleString('fr-FR');
}

/**
 * Obtient le label du statut
 */
export function getStatusLabel(statusConfig, fallbackData) {
  return statusConfig?.label || fallbackData?.to?.value || 'Nouveau statut';
}

/**
 * Obtient la couleur de fond pour le variant timeline
 */
export function getTimelineBackground(statusConfig) {
  return `${statusConfig?.activeBg || 'var(--blue-6)'}15`;
}

/**
 * Obtient la couleur de l'icône pour le variant timeline
 */
export function getTimelineIconColor(statusConfig) {
  return statusConfig?.activeBg || 'var(--blue-9)';
}

/**
 * Obtient le style du badge pour le variant timeline
 */
export function getTimelineBadgeStyle(statusConfig) {
  return {
    backgroundColor: statusConfig?.activeBg || 'var(--blue-9)',
    color: 'white',
  };
}

/**
 * Formate le nom complet du technicien
 */
export function getTechnicianName(technician) {
  if (!technician) return null;
  return `${technician.firstName} ${technician.lastName}`;
}
