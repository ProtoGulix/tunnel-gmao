/**
 * @fileoverview Hook pour charger les anomalies de saisie des actions
 *
 * @module hooks/useAnomaliesSaisie
 * @requires react
 * @requires @/lib/api/facade
 */

import { useEffect, useState } from 'react';
import { stats } from '@/lib/api/facade';

/**
 * Hook pour récupérer et normaliser les anomalies de saisie
 *
 * @param {Date|string} startDate - Date de début de la période
 * @param {Date|string} endDate - Date de fin de la période
 * @returns {Object} { data, loading, error }
 */
export function useAnomaliesSaisie(startDate, endDate) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await stats.fetchAnomaliesSaisie({ startDate, endDate });

        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        console.error('useAnomaliesSaisie - Error:', err);
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate]);

  return { data, loading, error };
}
