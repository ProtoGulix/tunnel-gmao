/**
 * Utilitaires partagés pour le planning (dates, durées, tri)
 */

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function getMondayOf(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function getWeekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function formatDayHeader(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Header compact pour Sam/Dim : "S. 14" ou "D. 15" */
export function formatDayHeaderShort(dateStr) {
  const d = new Date(dateStr);
  const initials = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  return `${initials[d.getDay()]}. ${d.getDate()}`;
}

export function isWeekend(dateStr) {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
}

export function formatWeekLabel(monday) {
  const sunday = addDays(monday, 6);
  const from = new Date(monday).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const to = new Date(sunday).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${from} – ${to}`;
}

export function formatTime(hhmms) {
  if (!hhmms) return null;
  return hhmms.slice(0, 5);
}

function minutesToDisplay(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 && m > 0 ? `${h}h${String(m).padStart(2, '0')}` : h > 0 ? `${h}h00` : `${m}min`;
}

export function actionDurationMinutes(action) {
  if (action.action_start && action.action_end) {
    return (
      (minutesToDisplay(action.action_end) ?? 0) - (minutesToDisplay(action.action_start) ?? 0)
    );
  }
  if (action.time_spent) return Math.round(action.time_spent * 60);
  return 0;
}

export function sortActions(actions) {
  return [...actions].sort((a, b) => {
    if (a.action_start && b.action_start) return a.action_start.localeCompare(b.action_start);
    if (a.action_start) return -1;
    if (b.action_start) return 1;
    return (a.created_at ?? '').localeCompare(b.created_at ?? '');
  });
}
