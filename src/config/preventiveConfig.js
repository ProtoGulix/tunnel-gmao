export const triggerLabel = (plan) =>
  plan.trigger_type === 'periodicity'
    ? `Périodicité ${plan.periodicity_days}j`
    : `Compteur ${plan.hours_threshold}h`;

export const OCCURRENCE_STATUS_COLORS = { pending: 'gray', generated: 'blue', skipped: 'orange', done: 'green' };
export const OCCURRENCE_STATUS_LABELS = { pending: 'En attente', generated: 'Générée', skipped: 'Ignorée', done: 'Clôturée' };

export const STEP_STATUS_COLORS = { done: 'green', skipped: 'orange', todo: 'gray', in_progress: 'blue' };
export const STEP_STATUS_LABELS = { done: 'Validée', skipped: 'Ignorée', todo: 'En attente', in_progress: 'En cours' };
