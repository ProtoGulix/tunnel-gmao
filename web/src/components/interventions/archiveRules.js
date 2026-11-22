/**
 * Règle d'affichage de l'archivage irrévocable (ADR 0041).
 * Aide à l'écran seulement : la base refuse de toute façon la réouverture (400).
 */

export const ARCHIVED_NOTICE = 'Archivée';

/**
 * Vrai si l'intervention est fermée et archivée (fiche marquée imprimée).
 * @param {Object} intervention - détail mappé (status, printedFiche)
 */
export function isArchivedClosed(intervention) {
  const status = intervention?.status?.id || intervention?.status;
  return status === 'ferme' && intervention?.printedFiche === true;
}
