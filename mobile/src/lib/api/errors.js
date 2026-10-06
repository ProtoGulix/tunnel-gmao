export function isAuthError(error) {
  return error?.status === 401 || error?.status === 403
}

export function getErrorMessage(error) {
  if (error?.data?.detail) return error.data.detail
  if (error?.data?.message) return error.data.message
  if (error?.message) return error.message
  return 'Une erreur est survenue'
}
