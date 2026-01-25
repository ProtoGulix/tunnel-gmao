/**
 * @fileoverview Hook pour polling optionnel de la santé d'un équipement
 * @module useEquipementHealth
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { getApiAdapter } from '@/lib/api/adapters/provider';

const adapter = getApiAdapter();

const POLLING_DELAY = 60000; // 60 secondes minimum
const ACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

/**
 * Hook pour poller la santé d'un équipement
 * Polling optionnel : commence après 5 minutes d'inactivité, intervalle min 60s
 *
 * @param {string} equipementId - UUID de l'équipement
 * @param {boolean} [autoPolling=true] - Activer le polling automatique
 * @returns {Object} { health, loading, error, manualRefresh, stopPolling }
 */
export function useEquipementHealth(equipementId, autoPolling = true) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pollingRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const pollingActiveRef = useRef(false);

  /**
   * Récupère la santé de l'équipement
   */
  const fetchHealth = useCallback(async () => {
    if (!equipementId) return;

    try {
      setLoading(true);
      const result = await adapter.equipements.fetchEquipementHealth(equipementId);
      setHealth(result);
      setError(null);
    } catch (err) {
      setError(err.message || 'Erreur lors de la récupération de la santé');
    } finally {
      setLoading(false);
    }
  }, [equipementId]);

  /**
   * Refresh manuel
   */
  const manualRefresh = useCallback(() => {
    lastActivityRef.current = Date.now();
    fetchHealth();
  }, [fetchHealth]);

  /**
   * Arrête le polling
   */
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      pollingActiveRef.current = false;
    }
  }, []);

  // Polling automatique
  useEffect(() => {
    if (!autoPolling || !equipementId) {
      stopPolling();
      return;
    }

    const pollingInterval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;

      // Activer le polling après 5 minutes d'inactivité
      if (timeSinceActivity > ACTIVITY_THRESHOLD && !pollingActiveRef.current) {
        pollingActiveRef.current = true;
        fetchHealth();
      }

      // Désactiver le polling si activité avant le prochain poll
      if (timeSinceActivity <= ACTIVITY_THRESHOLD && pollingActiveRef.current) {
        pollingActiveRef.current = false;
      }
    }, POLLING_DELAY);

    pollingRef.current = pollingInterval;

    return () => {
      clearInterval(pollingInterval);
    };
  }, [autoPolling, equipementId, fetchHealth, stopPolling]);

  // Tracker l'activité utilisateur
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, []);

  return {
    health,
    loading,
    error,
    manualRefresh,
    stopPolling,
  };
}

export default useEquipementHealth;
