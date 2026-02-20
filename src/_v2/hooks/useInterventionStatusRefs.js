import { useMemo } from 'react';
import { useApiCall } from '@/hooks/useApiCall';
import { getApiAdapter } from '@/lib/api/adapters/provider';

const adapter = getApiAdapter();

/**
 * Hook pour gérer le cache global des statuts d'intervention
 * Cache chargé automatiquement au montage
 *
 * @returns {Object} { statusRefs, statusMap, loading, error }
 */
export function useInterventionStatusRefs() {
  const {
    data: rawStatusRefs,
    loading,
    error,
  } = useApiCall(adapter.interventionStatusRefs.fetchStatusRefs, {
    autoExecute: true,
  });

  // S'assurer que statusRefs est toujours un array
  const statusRefs = useMemo(
    () => (Array.isArray(rawStatusRefs) ? rawStatusRefs : []),
    [rawStatusRefs]
  );

  // Map id → status pour résolution rapide
  const statusMap = useMemo(() => {
    const map = {};
    statusRefs.forEach((status) => {
      if (status.id) map[status.id] = status;
      if (status.code) map[status.code] = status;
      if (status.value) map[status.value] = status;
    });
    return map;
  }, [statusRefs]);

  return {
    statusRefs,
    statusMap,
    loading,
    error,
  };
}

export default useInterventionStatusRefs;
