/**
 * @fileoverview Hook pour charger les données de charge technique
 *
 * @module hooks/useTechnicalWorkload
 * @requires react
 * @requires @/lib/api/facade
 */

import { useEffect, useState } from 'react';
import { stats } from '@/lib/api/facade';

/**
 * Hook pour récupérer et normaliser les données de charge technique
 *
 * @param {Date|string} startDate - Date de début de la période
 * @param {Date|string} endDate - Date de fin de la période
 * @returns {Object} { data, loading, error }
 */
export function useTechnicalWorkload(startDate, endDate) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await stats.fetchTechnicalWorkload({ startDate, endDate });

        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        console.error('useTechnicalWorkload - Error:', err);
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
