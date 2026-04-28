/**
 * Hook de gestion des données de qualité
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchQualityData } from '@/api/quality-data';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/**
 * Hook pour charger les données de qualité
 * @param {Object} filters - Filtres (severite, entite, code)
 * @returns {Object} { data, loading, error, refetch }
 */
export function useQualityData(filters = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchQualityData(filters);
      setData(result);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors du chargement des données'));
    } finally {
      setLoading(false);
    }
    // On désactive la règle car filters est un objet qui change à chaque render
    // mais on veut déclencher le rechargement uniquement si les valeurs changent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.severite, filters.entite, filters.code]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch: loadData };
}
