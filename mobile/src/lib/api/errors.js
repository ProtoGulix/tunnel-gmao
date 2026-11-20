export function isAuthError(error) {
  return error?.status === 401 || error?.status === 403
}

export function getErrorMessage(error) {
  const detail = error?.data?.detail
  // Une erreur 422 de validation renvoie une liste d'objets { msg, loc } : on joint les messages.
  if (Array.isArray(detail)) return detail.map(d => d?.msg ?? String(d)).join(' ; ')
  if (detail) return detail
  if (error?.data?.message) return error.data.message
  if (error?.message) return error.message
  return 'Une erreur est survenue'
}
