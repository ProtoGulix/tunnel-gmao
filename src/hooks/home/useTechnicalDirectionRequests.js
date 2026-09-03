/**
 * @fileoverview Données de la vue "direction technique" : DI (idées
 * d'amélioration + demandes classiques) filtrables par site, avec édition
 * inline catégorie/priorité/sous_statut pour les idées.
 * @module hooks/home/useTechnicalDirectionRequests
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchInterventionRequests,
  fetchInterventionRequestStatuses,
  fetchAmeliorationCategories,
  fetchAmeliorationSousStatuts,
  patchAmelioration,
} from '@/api/intervention-requests';

const PAGE_SIZE = 100;

export function useTechnicalDirectionRequests({ site } = {}) {
  const [items, setItems] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sousStatuts, setSousStatuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, statutList, cats, statuts] = await Promise.all([
        fetchInterventionRequests({
          limit: PAGE_SIZE,
          excludeStatuses: 'rejetee',
          site: site || undefined,
        }),
        fetchInterventionRequestStatuses(),
        fetchAmeliorationCategories(),
        fetchAmeliorationSousStatuts(),
      ]);
      setItems(reqRes.items);
      setStatuses(statutList.filter((s) => s.code !== 'rejetee'));
      setCategories(cats);
      setSousStatuts(statuts);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [site]);

  useEffect(() => { load(); }, [load]);

  const updateAmelioration = useCallback(async (id, patch) => {
    const updated = await patchAmelioration(id, patch);
    setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
    return updated;
  }, []);

  return { items, statuses, categories, sousStatuts, loading, error, reload: load, updateAmelioration };
}
