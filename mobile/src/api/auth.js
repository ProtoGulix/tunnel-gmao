import { client } from '../lib/api/client'

export function login(email, password) {
  return client.post('/auth/login', { email, password, mode: 'session' })
}

export function logout() {
  // L'API révoque le refresh token présenté (corps obligatoire).
  return client.post('/auth/logout', { refresh_token: localStorage.getItem('auth_refresh_token') })
}

export function getMe() {
  return client.get('/users/me')
}
