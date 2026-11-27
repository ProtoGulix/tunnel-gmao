/**
 * @fileoverview Données de la file hors demandes : urgentes, en attente, sans action, préventif.
 * Chaque source se charge seule : l'échec de l'une n'efface pas les autres.
 * @module hooks/home/useInterventionQueue
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchInterventions } from '@/api/interventions';
import { fetchPreventiveSchedule } from '@/api/preventiveOccurrences';
import { OPEN_INTERVENTION_STATUSES, WAITING_STATUSES } from '@/hooks/home/requestQueue';

// Sans pagination côté file : plafond large, les listes filtrées restent courtes.
const LIMIT = 200;

/** Libellés des sources, pour signaler un échec */
export const SOURCE_LABELS = {
  requests: 'Demandes à qualifier',
  urgent: 'Urgentes',
  waiting: 'En attente',
  idle: 'Sans action',
  preventive: 'Préventif',
};

/** Libellés des sources en échec, pour un message unique */
export function failedLabels(errors) {
  return Object.keys(errors ?? {}).map((k) => SOURCE_LABELS[k] ?? k);
}

function buildLoaders(siteId) {
  const site = siteId ? { equipementId: siteId, includeDescendants: true } : {};
  const list = (filters) => fetchInterventions({ limit: LIMIT, include: 'stats', ...site, ...filters });
  const schedule = (state) => fetchPreventiveSchedule({
    state,
    machine_id: siteId || undefined,
    include_descendants: siteId ? true : undefined,
  });
  return {
    urgent: () => list({ status: OPEN_INTERVENTION_STATUSES.join(','), priority: 'urgent' }),
    waiting: () => list({ status: WAITING_STATUSES.join(',') }),
    // Ordre approché : l'API ne trie pas par inactivité ; les plus anciennes tiennent sous le plafond
    idle: () => list({ idle: true, sort: 'reported_date' }),
    // Le retard d'abord, puis les échéances proches
    preventive: async () => {
      const [overdue, dueSoon] = await Promise.all([schedule('overdue'), schedule('due_soon')]);
      return [...overdue, ...dueSoon];
    },
  };
}

export function useInterventionQueue({ siteId } = {}) {
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const loaders = buildLoaders(siteId);
    const keys = Object.keys(loaders);
    const results = await Promise.allSettled(keys.map((k) => loaders[k]()));
    const nextData = {};
    const nextErrors = {};
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') nextData[keys[i]] = r.value;
      else nextErrors[keys[i]] = r.reason;
    });
    setData(nextData);
    setErrors(nextErrors);
    setLoading(false);
  }, [siteId]);

  useEffect(() => { load(); }, [load]);

  return { ...data, errors, loading, reload: load };
}
