const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const DEFAULT_PAGE_SIZE = 50

// Routes qui ne déclenchent jamais de rafraîchissement : un 401 y est une réponse normale
// (mauvais identifiants, refresh token expiré ou révoqué). /auth/logout aussi : son corps
// porte l'ancien refresh token, le rejouer après rotation révoquerait toute la session.
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout']

// Évènement émis quand le rafraîchissement échoue : AuthContext y réagit en déconnectant.
export const SESSION_EXPIRED_EVENT = 'auth:session-expired'

// Un seul rafraîchissement à la fois : les requêtes simultanées qui reçoivent un 401
// attendent la même promesse. Indispensable car l'API fait tourner le refresh token
// (l'ancien est révoqué) et révoque toute la session si un ancien est rejoué.
let refreshPromise = null

async function doRefresh() {
  const refreshToken = localStorage.getItem('auth_refresh_token')
  if (!refreshToken) throw sessionRejected('Pas de refresh token')

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  // Refus de l'API (jeton expiré, révoqué, rejoué) : la session est finie. Une erreur
  // serveur (5xx) ou une coupure réseau ne l'est pas : on garde les jetons pour réessayer
  // à la requête suivante (wifi d'atelier instable).
  if ([400, 401, 403].includes(response.status)) throw sessionRejected(`HTTP ${response.status}`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  // /auth/refresh répond à plat { access_token, refresh_token, expires_in }.
  const data = await response.json()
  if (!data?.access_token) throw new Error('Réponse de rafraîchissement invalide')
  localStorage.setItem('auth_token', data.access_token)
  if (data.refresh_token) localStorage.setItem('auth_refresh_token', data.refresh_token)
}

function sessionRejected(message) {
  const error = new Error(message)
  error.sessionRejected = true
  return error
}

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

function expireSession() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_refresh_token')
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

async function request(path, options = {}, isRetry = false) {
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

  if (response.status === 401 && !isRetry && !NO_REFRESH_PATHS.includes(path)) {
    try {
      await refreshSession()
    } catch (refreshError) {
      // Seul un refus de l'API déconnecte ; sinon l'erreur remonte, jetons conservés.
      if (!refreshError.sessionRejected) throw refreshError
      expireSession()
      const error = new Error('HTTP 401')
      error.status = 401
      error.data = null
      throw error
    }
    // Rejoue une seule fois avec le nouveau jeton (isRetry évite toute boucle).
    return request(path, options, true)
  }

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
