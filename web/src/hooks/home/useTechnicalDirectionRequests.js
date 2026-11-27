/**
 * @fileoverview Données de la vue "direction technique" : demandes à qualifier,
 * selon une portée : site (descendants compris) ou équipement exact (voir requestScope).
 * @module hooks/home/useTechnicalDirectionRequests
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchInterventionRequests } from '@/api/intervention-requests';
import { TO_QUALIFY_STATUSES } from '@/hooks/home/requestQueue';

// Maximum de l'API : seules les demandes à qualifier sont chargées, la file reste complète.
const PAGE_SIZE = 500;

export function useTechnicalDirectionRequests({ machineId, includeDescendants, enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchInterventionRequests({
        limit: PAGE_SIZE,
        statut: TO_QUALIFY_STATUSES.join(','),
        machineId: machineId || undefined,
        includeDescendants,
      });
      setItems(res.items);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [machineId, includeDescendants, enabled]);

  useEffect(() => { load(); }, [load]);

  return { items, loading, error, reload: load };
}
