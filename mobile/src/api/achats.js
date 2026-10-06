import { client } from "../lib/api/client";

export function getPurchaseRequests(params = {}) {
  const query = new URLSearchParams(params).toString();
  return client.get(`/purchase-requests${query ? `?${query}` : ""}`).then(res => Array.isArray(res) ? res : (res.items ?? res))
}

export function createPurchaseRequest(data) {
  return client.post("/purchase-requests", data);
}

export function searchStockItems(search) {
  return client
    .get(`/stock-items?search=${encodeURIComponent(search)}&limit=15`)
    .then((res) => res.items ?? []);
}
