import { client } from '../lib/api/client'

export function login(email, password) {
  return client.post('/auth/login', { email, password, mode: 'session' })
}

export function logout() {
  // L'API révoque le refresh token présenté (corps obligatoire).
  return client.post('/auth/logout', { refresh_token: localStorage.getItem('auth_refresh_token') })
}

// /users/me porte le profil, /auth/me porte `role` et `permissions` (codes d'endpoint,
// ADR 0007). On fusionne les deux ; /auth/me gagne sur un champ commun.
export async function getMe() {
  const [profile, auth] = await Promise.all([client.get('/users/me'), client.get('/auth/me')])
  return { ...profile, ...auth }
}
