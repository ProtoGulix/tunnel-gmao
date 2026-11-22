export function isAuthError(error) {
  return error?.status === 401 || error?.status === 403
}

/** Motifs proposés par l'API (400 avec `audit.reasons` non vide), sinon null. */
export function getAuditReasons(error) {
  const asked = error?.data?.audit?.reasons
  return error?.status === 400 && Array.isArray(asked) && asked.length > 0 ? asked : null
}

// Motif exigé par l'API, mais aucun proposé : rien à afficher dans la feuille de motif.
function isReasonRequiredWithoutChoice(error) {
  if (error?.status !== 400 || getAuditReasons(error)) return false
  const detail = error?.data?.detail
  return typeof detail === 'string' && detail.includes('reason_code obligatoire')
}

export function getErrorMessage(error) {
  if (isReasonRequiredWithoutChoice(error)) return 'Aucun motif disponible'
  const detail = error?.data?.detail
  // Une erreur 422 de validation renvoie une liste d'objets { msg, loc } : on joint les messages.
  if (Array.isArray(detail)) return detail.map(d => d?.msg ?? String(d)).join(' ; ')
  if (detail) return detail
  if (error?.data?.message) return error.data.message
  if (error?.message) return error.message
  return 'Une erreur est survenue'
}
