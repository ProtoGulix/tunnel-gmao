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

/** Écart réalisation / échéance : « −5 j » en avance, « +12 j » en retard, « à l'heure » à 0 ; null si non terminée. */
export function deltaBadgeLabel(delta) {
  if (delta === null || delta === undefined) return null;
  if (delta === 0) return "à l'heure";
  return delta < 0 ? `\u2212${-delta} j` : `+${delta} j`;
}

export const deltaBadgeColor = (delta) => (delta > 0 ? 'red' : delta < 0 ? 'green' : 'gray');

/**
 * Points de la courbe d'écart : une ligne par date de réalisation, une colonne par plan
 * (clé = plan_code). Seules les occurrences terminées (delta_days connu) comptent.
 * @returns {{ rows: Array<Object>, plans: Array<{ code: string, label: string }> }}
 */
export function historyChartData(items) {
  const done = items.filter((r) => r.done_on && r.delta_days !== null && r.delta_days !== undefined);
  const byDate = new Map();
  const plans = new Map();
  for (const r of done) {
    plans.set(r.plan_code, r.plan_label);
    const row = byDate.get(r.done_on) ?? { date: r.done_on };
    row[r.plan_code] = r.delta_days;
    byDate.set(r.done_on, row);
  }
  const rows = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  return { rows, plans: [...plans].map(([code, label]) => ({ code, label })) };
}
