/**
 * Options du test de santé du serveur (GET /health).
 *
 * Les cookies du même domaine sont envoyés comme pour les autres appels : derrière un
 * proxy d'authentification (Cloudflare Access), une requête sans cookie est redirigée
 * vers sa page de connexion, que la CSP (connect-src 'self') bloque, et le serveur
 * paraît injoignable alors qu'il répond. Le code HTTP n'est pas interprété : c'est un
 * test de joignabilité réseau.
 *
 * @param {AbortSignal} signal signal d'abandon (délai dépassé)
 * @returns {RequestInit} options de fetch
 */
export function healthFetchOptions(signal) {
  return {
    method: 'GET',
    cache: 'no-store',
    credentials: 'same-origin',
    signal,
  };
}
