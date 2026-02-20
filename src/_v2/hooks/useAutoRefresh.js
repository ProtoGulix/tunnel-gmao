import { useEffect, useRef } from 'react';

/**
 * Hook pour rafraîchir automatiquement les données toutes les X secondes
 * @param {Function} refreshFunction - Fonction à appeler pour rafraîchir
 * @param {number} intervalSeconds - Intervalle en secondes (défaut: 5)
 * @param {boolean} enabled - Active/désactive le polling (défaut: true)
 */
export function useAutoRefresh(refreshFunction, intervalSeconds = 5, enabled = true) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled || !refreshFunction) return;

    // Nettoyer l'interval précédent si existant
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Créer le nouvel interval
    intervalRef.current = setInterval(() => {
      console.warn(`🔄 Auto-refresh actif (toutes les ${intervalSeconds}s)`);
      refreshFunction();
    }, intervalSeconds * 1000);

    // Cleanup au démontage
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refreshFunction, intervalSeconds, enabled]);
}
