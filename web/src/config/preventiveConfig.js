export const triggerLabel = (plan) =>
  plan.trigger_type === 'periodicity'
    ? `Périodicité ${plan.periodicity_days}j`
    : `Compteur ${plan.hours_threshold}h`;

// Statuts d'une occurrence, tels que les écrit le backend (api/preventive_occurrences/repo.py).
export const OCCURRENCE_STATUS_COLORS = { pending: 'gray', generated: 'blue', in_progress: 'amber', completed: 'green', skipped: 'orange' };
export const OCCURRENCE_STATUS_LABELS = { pending: 'En attente', generated: 'Générée', in_progress: 'En cours', completed: 'Clôturée', skipped: 'Ignorée' };

export const STEP_STATUS_COLORS = { done: 'green', skipped: 'orange', todo: 'gray', in_progress: 'blue' };
export const STEP_STATUS_LABELS = { done: 'Validée', skipped: 'Ignorée', todo: 'En attente', in_progress: 'En cours' };
