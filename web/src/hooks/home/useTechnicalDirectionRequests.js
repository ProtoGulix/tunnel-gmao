/**
 * @fileoverview Données de la vue "direction technique" : demandes à qualifier,
 * d'un site (descendants compris), urgentes d'abord, puis les plus anciennes.
 * @module hooks/home/useTechnicalDirectionRequests
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchInterventionRequests } from '@/api/intervention-requests';
import { TO_QUALIFY_STATUSES } from '@/hooks/home/decisionQueue';

// Maximum de l'API : seules les demandes à qualifier sont chargées, la file reste complète.
const PAGE_SIZE = 500;

export function useTechnicalDirectionRequests({ machineId, includeDescendants } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchInterventionRequests({
        limit: PAGE_SIZE,
        sort: 'urgence', // urgentes d'abord, puis les plus anciennes
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
  }, [machineId, includeDescendants]);

  useEffect(() => { load(); }, [load]);

  return { items, loading, error, reload: load };
}
