export const triggerLabel = (plan) =>
  plan.trigger_type === 'periodicity'
    ? `Périodicité ${plan.periodicity_days}j`
    : `Compteur ${plan.hours_threshold}h`;

// Statuts d'une occurrence, tels que les écrit le backend (api/preventive_occurrences/repo.py).
export const OCCURRENCE_STATUS_COLORS = { pending: 'gray', generated: 'blue', in_progress: 'amber', completed: 'green', skipped: 'orange' };
export const OCCURRENCE_STATUS_LABELS = { pending: 'En attente', generated: 'Générée', in_progress: 'En cours', completed: 'Clôturée', skipped: 'Ignorée' };

export const STEP_STATUS_COLORS = { done: 'green', skipped: 'orange', todo: 'gray', in_progress: 'blue' };
export const STEP_STATUS_LABELS = { done: 'Validée', skipped: 'Ignorée', todo: 'En attente', in_progress: 'En cours' };

// États d'échéancier, tels que les calcule la route /preventive-occurrences/schedule.
// Le front ne recalcule rien : il regroupe et libelle.
export const SCHEDULE_STATE_LABELS = { overdue: 'En retard', due_soon: 'Cette semaine', ok: 'À venir', not_computed: 'Non calculé' };
export const SCHEDULE_STATE_COLORS = { overdue: 'red', due_soon: 'orange', ok: 'green', not_computed: 'gray' };
export const SCHEDULE_GROUP_ORDER = ['overdue', 'due_soon', 'ok', 'not_computed'];

/** Regroupe les lignes de la route par état, dans l'ordre d'affichage. */
export function groupSchedule(items) {
  return SCHEDULE_GROUP_ORDER.map((state) => ({ state, rows: items.filter((r) => r.state === state) }));
}

/** « 3 jours de retard » ; null si la route ne signale pas de retard. */
export function overdueLabel(days) {
  if (!days || days <= 0) return null;
  return `${days} jour${days > 1 ? 's' : ''} de retard`;
}

/** Pastille « +3 j » ; null si la route ne signale pas de retard. */
export function overdueBadgeLabel(days) {
  if (!days || days <= 0) return null;
  return `+${days} j`;
}
