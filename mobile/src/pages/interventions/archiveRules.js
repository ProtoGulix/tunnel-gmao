// Règle d'affichage de l'archivage irrévocable (ADR 0041).
// Aide à l'écran seulement : la base refuse de toute façon la réouverture (400).

export const ARCHIVED_NOTICE = 'Archivée'

// Vrai si l'intervention est fermée et archivée (fiche marquée imprimée).
export function isArchivedClosed(intervention) {
  const status = intervention?.status_actual ?? intervention?.statut ?? ''
  return status === 'ferme' && intervention?.printed_fiche === true
}
