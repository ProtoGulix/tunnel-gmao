/**
 * @fileoverview Données de l'accueil direction : bilan, demandes, file, sections affichées sous le
 * filtre actif, et sélection de la liste (ADR 0046).
 * @module hooks/home/useDirectionHome
 */

import { useCallback, useMemo } from 'react';
import { useTechnicalDirectionRequests } from '@/hooks/home/useTechnicalDirectionRequests';
import { useDemandeStats } from '@/hooks/home/useDemandeStats';
import { useInterventionQueue, failedLabels } from '@/hooks/home/useInterventionQueue';
import { useQueueSelection } from '@/hooks/home/useQueueSelection';
import { buildQueueSections, flattenQueue, parseRowKey } from '@/hooks/home/requestQueue';
import { requestScope, hasOwnScope } from '@/hooks/home/bilanFilter';
import { sectionsForFilter } from '@/hooks/home/bilanView';

export function useDirectionHome({ site, filter }) {
  const stats = useDemandeStats({ siteId: site });
  const requests = useTechnicalDirectionRequests(requestScope(null, site));
  // Liste d'un site ou d'un équipement du bilan : sa propre portée, chargée au clic seulement
  const scoped = useTechnicalDirectionRequests({ ...requestScope(filter, site), enabled: hasOwnScope(filter) });
  const queue = useInterventionQueue({ siteId: site });
  const reload = useCallback(
    () => Promise.all([requests.reload(), scoped.reload(), queue.reload(), stats.reload()]),
    // Les reload sont stables (useCallback) ; la règle réclamerait les objets entiers
    [requests.reload, scoped.reload, queue.reload, stats.reload], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const all = useMemo(
    () => buildQueueSections({ ...queue, requests: requests.items }),
    [queue.urgent, queue.waiting, queue.idle, queue.preventive, requests.items], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const sections = useMemo(
    () => sectionsForFilter(filter, { sections: all, requests: requests.items, scoped: scoped.items }, stats.data),
    [filter, all, requests.items, scoped.items, stats.data],
  );
  const lines = useMemo(() => flattenQueue(sections), [sections]);
  const keys = useMemo(() => lines.map((l) => l.key), [lines]);
  const failed = failedLabels({
    ...queue.errors,
    ...(requests.error && { requests: requests.error }),
    ...(scoped.error && { requests: scoped.error }),
    ...(stats.error && { stats: stats.error }),
  });
  const [selectedKey, select] = useQueueSelection(keys, failed.length > 0);
  return {
    stats, queue, all, sections, lines, failed, reload, selectedKey, select,
    target: filter ? parseRowKey(selectedKey) : null,
    requestItems: [...requests.items, ...scoped.items],
    loading: (requests.loading || queue.loading || stats.loading) && !stats.data,
  };
}
