import { client } from '../lib/api/client'

export function getStockItems(params = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  const query = new URLSearchParams(clean).toString()
  return client.get(`/stock-items${query ? `?${query}` : ''}`)
}

export function getStockItem(id) {
  return client.get(`/stock-items/${id}`)
}
