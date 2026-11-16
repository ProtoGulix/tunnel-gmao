/**
 * @fileoverview Chargement du tableau de bord d'un équipement
 * @module hooks/equipements/useEquipementDashboard
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchEquipementDashboard } from '@/api/equipements';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/**
 * Relance la requête quand l'équipement, la date de début ou le périmètre changent.
 * @param {string} id
 * @param {Object} options
 * @param {string} [options.startDate] - undefined = défaut serveur (12 mois)
 * @param {boolean} options.includeDescendants
 * @returns {{ data: Object|null, loading: boolean, error: string|null, reload: Function }}
 */
export function useEquipementDashboard(id, { startDate, includeDescendants }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchEquipementDashboard(id, { startDate, includeDescendants });
      if (current !== requestId.current) return;
      setData(result);
    } catch (err) {
      if (current !== requestId.current) return;
      setData(null);
      setError(extractApiErrorMessage(err, 'Erreur lors du chargement du tableau de bord'));
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [id, startDate, includeDescendants]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
