/**
 * Utilitaires de limitation de concurrence pour des appels async en lot.
 * @module lib/utils/concurrency
 */

/**
 * Exécute `fn` sur chaque élément de `items`, avec au plus `limit` appels en vol
 * simultanément (au lieu d'un Promise.all sans limite). Utile pour éviter de
 * saturer un pool de connexions backend quand la liste peut être longue (ex: une
 * requête HTTP par ligne d'un tableau de dizaines d'entrées).
 *
 * @param {Array} items
 * @param {number} limit - Nombre max d'appels concurrents
 * @param {Function} fn - (item, index) => Promise
 * @returns {Promise<Array>} Résultats dans le même ordre que `items`
 */
export async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}
