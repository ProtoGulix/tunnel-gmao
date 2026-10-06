const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`)
    error.status = response.status
    try {
      error.data = await response.json()
    } catch {
      error.data = null
    }
    throw error
  }

  const text = await response.text()
  const body = text ? JSON.parse(text) : null

  // Le backend enveloppe les réponses "objet unique" dans { data, audit? }
  // (voir api/utils/response.py::single()) — jamais les listes paginées
  // ({ items, pagination }) ni les référentiels (tableau brut). On déplie
  // ici pour que tous les hooks consomment directement l'objet métier,
  // sans avoir à connaître ce détail d'enveloppe backend.
  if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in body && !('items' in body)) {
    return body.data
  }
  return body
}

export const client = {
  get: (path, options) => request(path, { method: 'GET', ...options }),
  post: (path, body, options) => request(path, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (path, body, options) => request(path, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: (path, body, options) => request(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: (path, options) => request(path, { method: 'DELETE', ...options }),
}
