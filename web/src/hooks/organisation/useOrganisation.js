/**
 * @fileoverview Chargement des indicateurs d'organisation de l'équipe
 * @module hooks/organisation/useOrganisation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchOrganisation } from '@/api/organisation';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/**
 * Relance la requête quand la date de début change.
 * @param {string} [startDate] - undefined = défaut serveur (12 mois)
 * @param {boolean} [enabled=true] - false : aucun appel (utilisateur sans le droit)
 * @returns {{ data: Object|null, loading: boolean, error: string|null, reload: Function }}
 */
export function useOrganisation(startDate, enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!enabled) return;
    const current = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOrganisation({ startDate });
      if (current !== requestId.current) return;
      setData(result);
    } catch (err) {
      if (current !== requestId.current) return;
      setData(null);
      setError(extractApiErrorMessage(err, "Erreur lors du chargement des indicateurs d'organisation"));
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [startDate, enabled]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
