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

/**
 * Vrai si le bouton « Marquer comme imprimée » s'affiche : intervention fermée, fiche pas
 * encore imprimée, droit d'archiver. Même règle que l'archivage en masse ; l'API la vérifie.
 * @param {Object} intervention - détail mappé (status, printedFiche)
 * @param {boolean} canArchive - droit de la route d'archivage à l'unité
 */
export function canMarkPrinted(intervention, canArchive) {
  const status = intervention?.status?.id || intervention?.status;
  return canArchive && status === 'ferme' && intervention.printedFiche !== true;
}
