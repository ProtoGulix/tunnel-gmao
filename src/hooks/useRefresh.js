import { useEffect, useCallback } from "react";

/**
 * Hook pour forcer le rechargement automatique des données après une action
 * Usage: const forceRefresh = useForceRefresh();
 * Appeler forceRefresh() après toute modification pour garantir l'UI à jour
 */
export const useForceRefresh = (refreshCallback) => {
  const forceRefresh = useCallback(() => {
    if (refreshCallback) {
      // Refresh immédiat
      refreshCallback();
    }
  }, [refreshCallback]);

  return forceRefresh;
};

/**
 * Hook pour polling automatique (optionnel si vraiment besoin de temps réel)
 * Usage: useAutoRefresh(loadData, 3000); // Refresh toutes les 3 secondes
 */
export const useAutoRefresh = (callback, interval = 3000) => {
  useEffect(() => {
    if (!callback || !interval) return;

    const intervalId = setInterval(() => {
      callback();
    }, interval);

    return () => clearInterval(intervalId);
  }, [callback, interval]);
};
