/**
 * Hook Service Status
 *
 * Gère le chargement et l'état des données de l'état du service.
 * La normalisation des données est gérée par la couche API.
 *
 * @module hooks/service-status/useServiceData
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchServiceStatus } from '@/api/service-status';

/**
 * Hook pour charger les données d'état du service
 * @param {Date} startDate - Date de début de la période
 * @param {Date} endDate - Date de fin de la période
 * @returns {Object} { data, loading, error, refetch }
 */
export function useServiceData(startDate, endDate) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!startDate || !endDate) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchServiceStatus(startDate, endDate);
      setData(result);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refetch: loadData,
  };
}
