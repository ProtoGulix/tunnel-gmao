/**
 * @fileoverview Données de l'accueil direction (ADR 0047) : bilan, demandes à trancher, blocages,
 * côté maintenance. Chaque source se charge seule : l'échec de l'une n'efface pas les autres.
 * @module hooks/home/useDirectionHome
 */

import { useCallback } from 'react';
import { useTechnicalDirectionRequests } from '@/hooks/home/useTechnicalDirectionRequests';
import { useDemandeStats } from '@/hooks/home/useDemandeStats';
import { useBlocages } from '@/hooks/home/useBlocages';
import { useMaintenanceSide } from '@/hooks/home/useMaintenanceSide';

/** Libellés des sources, pour signaler un échec */
const SOURCE_LABELS = {
  requests: 'Demandes à trancher',
  stats: 'Bilan',
  blocages: 'Blocages',
  maintenance: 'Côté maintenance',
};

export function useDirectionHome({ site }) {
  const stats = useDemandeStats({ siteId: site });
  const requests = useTechnicalDirectionRequests({ machineId: site || undefined, includeDescendants: site ? true : undefined });
  const blocages = useBlocages({ siteId: site });
  const maintenance = useMaintenanceSide({ siteId: site });
  const reload = useCallback(
    () => Promise.all([requests.reload(), blocages.reload(), maintenance.reload(), stats.reload()]),
    // Les reload sont stables (useCallback) ; la règle réclamerait les objets entiers
    [requests.reload, blocages.reload, maintenance.reload, stats.reload], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const failed = Object.entries({ requests, stats, blocages, maintenance })
    .filter(([, source]) => source.error)
    .map(([key]) => SOURCE_LABELS[key]);
  return {
    stats, requests, blocages, maintenance, failed, reload,
    loading: (requests.loading || stats.loading || blocages.loading) && !stats.data,
  };
}
