/**
 * Observable module-level pour les erreurs système (5xx, réseau).
 * Permet au banneau layout de s'abonner sans contexte React partagé.
 *
 * @module lib/api/systemErrors
 */

const subscribers = new Set();
let _current = null;

/**
 * S'abonner aux erreurs système. Reçoit immédiatement l'erreur courante si elle existe.
 * @param {Function} callback - Appelé avec l'erreur (ou null pour effacer)
 * @returns {Function} Fonction de désabonnement
 */
export function onSystemError(callback) {
  subscribers.add(callback);
  if (_current !== null) callback(_current);
  return () => subscribers.delete(callback);
}

/** Émet une erreur système vers tous les abonnés. */
export function emitSystemError(error) {
  _current = error;
  subscribers.forEach((fn) => fn(error));
}

/** Efface l'erreur courante (après une requête réussie). */
export function clearSystemError() {
  _current = null;
  subscribers.forEach((fn) => fn(null));
}
