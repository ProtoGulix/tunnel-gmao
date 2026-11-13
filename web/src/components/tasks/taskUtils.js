/**
 * Fonctions pures partagées par les lignes de tâche (ADR 0015).
 */

export function deriveInitials(assignedTo) {
  if (!assignedTo) return null;
  if (assignedTo.initial) return String(assignedTo.initial).toUpperCase();
  if (assignedTo.initials) return String(assignedTo.initials).toUpperCase();
  const f = String(assignedTo.first_name || '').trim();
  const l = String(assignedTo.last_name || '').trim();
  return `${f[0] || ''}${l[0] || ''}`.toUpperCase() || null;
}

export function userFullName(u) {
  const f = u.first_name || u.firstName || '';
  const l = u.last_name || u.lastName || '';
  return `${f} ${l}`.trim() || u.email || u.initials || String(u.id);
}

export function formatDue(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Une étape de gamme obligatoire ne s'ignore que par RESP et ADMIN (miroir du
 * contrôle backend, qui fait foi). Toute autre tâche peut être ignorée.
 */
export function canSkipTask(task, canSkipObligatory) {
  if (canSkipObligatory) return true;
  return !(task?.origin === 'plan' && !task?.optional);
}
