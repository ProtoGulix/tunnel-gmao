/**
 * @fileoverview Données de la vue "direction technique" : demandes
 * d'intervention filtrables par site (équipement racine).
 * @module hooks/home/useTechnicalDirectionRequests
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchInterventionRequests,
  fetchInterventionRequestStatuses,
} from '@/api/intervention-requests';

const PAGE_SIZE = 100;

export function useTechnicalDirectionRequests({ siteId } = {}) {
  const [items, setItems] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, statutList] = await Promise.all([
        fetchInterventionRequests({
          limit: PAGE_SIZE,
          excludeStatuses: 'rejetee',
          machineId: siteId || undefined,
          includeDescendants: siteId ? true : undefined,
        }),
        fetchInterventionRequestStatuses(),
      ]);
      setItems(reqRes.items);
      setStatuses(statutList.filter((s) => s.code !== 'rejetee'));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => { load(); }, [load]);

  return { items, statuses, loading, error, reload: load };
}
