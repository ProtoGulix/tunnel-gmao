/**
 * Rapport d'un import CSV refusé (422, tout ou rien) : le corps de la réponse porte
 * le rapport complet. Fichier sans dépendance, testé par node --test.
 */

/** Le rapport complet du 422, ou null pour toute autre erreur. */
export function extractRejectedImportReport(error) {
  const data = error?.response?.data;
  if (error?.response?.status !== 422 || !data || !Array.isArray(data.lines)) return null;
  return data;
}

/** Lignes en erreur du rapport, dans l'ordre du fichier. */
export function getRejectedLines(report) {
  return (report?.lines ?? [])
    .filter((l) => l.status === 'error')
    .sort((a, b) => a.row - b.row);
}
