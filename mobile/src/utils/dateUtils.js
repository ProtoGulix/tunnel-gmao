// ── Utilitaires date/heure — source unique pour tout le projet ────────────────

const MONTH_SHORT = ['jan.','fév.','mar.','avr.','mai','jun.','jul.','aoû.','sep.','oct.','nov.','déc.']
export const DAY_LABELS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

/** Retourne le lundi de la semaine contenant `date`. */
export function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

/** Ajoute `n` jours à `date` (retourne un nouvel objet Date). */
export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** Convertit une Date en chaîne ISO YYYY-MM-DD. */
export function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

/** Vérifie si `date` correspond à aujourd'hui. */
export function isToday(date) {
  const now = new Date()
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
}

/**
 * Libellé de semaine : "3 – 9 fév. 2025" ou "31 jan. – 6 fév. 2025".
 * @param {Date} monday — premier jour de la semaine (lundi)
 */
export function formatWeekLabel(monday) {
  const sunday = addDays(monday, 6)
  const s = monday.getDate(), e = sunday.getDate()
  const em = MONTH_SHORT[sunday.getMonth()], ey = sunday.getFullYear()
  if (monday.getMonth() === sunday.getMonth()) return `${s} – ${e} ${em} ${ey}`
  return `${s} ${MONTH_SHORT[monday.getMonth()]} – ${e} ${em} ${ey}`
}

/**
 * Formate une durée en heures décimales : 1.5 → "1h30", 0.25 → "15min".
 * @param {number} hours
 */
export function formatTime(hours) {
  if (!hours) return '0min'
  const h = Math.floor(hours), m = Math.round((hours - h) * 60)
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h00`
  return `${h}h${String(m).padStart(2, '0')}`
}

/**
 * Formate une date ISO en date/heure française longue.
 * Ex : "12 avril 2025 à 14:30"
 * Retourne null si dateStr est falsy.
 * @param {string|null} dateStr
 */
export function formatDateFr(dateStr) {
  if (!dateStr) return null
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}
