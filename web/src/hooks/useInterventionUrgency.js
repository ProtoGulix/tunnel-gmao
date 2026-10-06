/**
 * Hook utilitaire : calcule le niveau d'urgence d'une intervention
 * à partir de next_due_date (ou fallback reported_date).
 *
 * Niveaux :
 *   overdue  — next_due_date < aujourd'hui           → rouge
 *   urgent   — next_due_date <= aujourd'hui + 3j     → orange
 *   planned  — next_due_date <= aujourd'hui + 14j    → bleu
 *   far      — next_due_date > aujourd'hui + 14j     → gris
 *   pending  — pas de next_due_date                  → gris neutre (fallback reported_date)
 */

const MS_DAY = 86_400_000;

function startOfDay(d) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / MS_DAY);
}

function daysAgo(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr)) / MS_DAY);
}

/**
 * Calcule l'urgence d'une intervention.
 *
 * @param {string|null} nextDueDate  — ISO date de la prochaine tâche due
 * @param {string|null} reportedDate — ISO date d'ouverture (fallback)
 * @returns {{ level: string, label: string, color: string, daysRemaining: number|null }}
 */
export function getInterventionUrgency(nextDueDate, reportedDate) {
  if (!nextDueDate) {
    const open = daysAgo(reportedDate);
    return {
      level: 'pending',
      label: open === 0 ? 'auj.' : `${open}j`,
      color: '#9ca3af',
      daysRemaining: null,
    };
  }

  const now = new Date();
  const daysUntilDue = daysBetween(now, new Date(nextDueDate));

  if (daysUntilDue < 0) {
    return {
      level: 'overdue',
      label: `RETARD ${Math.abs(daysUntilDue)}j`,
      color: '#ef4444',
      daysRemaining: daysUntilDue,
    };
  }
  if (daysUntilDue === 0) {
    return { level: 'urgent', label: 'auj.', color: '#f97316', daysRemaining: 0 };
  }
  if (daysUntilDue <= 3) {
    return { level: 'urgent', label: `${daysUntilDue}j`, color: '#f97316', daysRemaining: daysUntilDue };
  }
  if (daysUntilDue <= 14) {
    return { level: 'planned', label: `${daysUntilDue}j`, color: '#3b82f6', daysRemaining: daysUntilDue };
  }
  return { level: 'far', label: `${daysUntilDue}j`, color: '#9ca3af', daysRemaining: daysUntilDue };
}

/**
 * Formate next_due_date en libellé court pour affichage.
 * Ex: "14/06", "Dans 3j", "RETARD 2j", "—"
 */
export function formatDueDate(nextDueDate) {
  if (!nextDueDate) return '—';
  const daysUntilDue = daysBetween(new Date(), new Date(nextDueDate));
  if (daysUntilDue < 0) return `RETARD ${Math.abs(daysUntilDue)}j`;
  if (daysUntilDue === 0) return 'Auj.';
  if (daysUntilDue <= 7) return `Dans ${daysUntilDue}j`;
  const d = new Date(nextDueDate);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

/**
 * Hook React — wrapper autour de getInterventionUrgency pour usage direct dans JSX.
 */
export function useInterventionUrgency(nextDueDate, reportedDate) {
  return getInterventionUrgency(nextDueDate, reportedDate);
}
