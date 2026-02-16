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
 * Obtient le label du statut depuis le backend
 */
export function getStatusLabel(statusConfig, itemData) {
  return itemData?.to?.label || statusConfig?.label || 'Statut inconnu';
}

/**
 * Obtient la couleur de fond pour le variant timeline
 */
export function getTimelineBackground(statusConfig) {
  return statusConfig?.activeBg ? `${statusConfig.activeBg}15` : 'var(--gray-3)';
}

/**
 * Obtient la couleur de l'icône pour le variant timeline
 */
export function getTimelineIconColor(statusConfig) {
  return statusConfig?.activeBg || 'var(--gray-9)';
}

/**
 * Obtient le style du badge pour le variant timeline
 */
export function getTimelineBadgeStyle(statusConfig) {
  return {
    backgroundColor: statusConfig?.activeBg || 'var(--gray-9)',
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
