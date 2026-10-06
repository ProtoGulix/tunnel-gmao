import { client } from '../lib/api/client'

export function getEquipements(params = {}) {
  const query = new URLSearchParams(params).toString()
  return client.get(`/equipements${query ? `?${query}` : ''}`)
}

export function getEquipement(id) {
  return client.get(`/equipements/${id}`)
}
