/**
 * Formate un nom d'heures en format lisible (ex: 7.5 -> "7h30m")
 * @param {number} hours - Nombre d'heures décimal
 * @returns {string} Temps formaté
 */
export const formatTime = (hours) => {
  if (!hours || hours === 0) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h${m}m` : `${h}h`;
};