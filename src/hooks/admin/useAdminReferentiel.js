/**
 * @fileoverview Hooks référentiel admin
 * @module hooks/admin/useAdminReferentiel
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as refApi from '@/api/adminReferentiel';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

function makeSimpleListHook(fetchFn, errMsg) {
  return function useList() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const abortRef = useRef(null);

    useEffect(() => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const ctrl = abortRef.current;

      setLoading(true);
      setError(null);
      fetchFn()
        .then((data) => {
          if (ctrl.signal.aborted) return;
          setItems(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          if (ctrl.signal.aborted) return;
          setError(extractApiErrorMessage(err, errMsg));
        })
        .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });

      return () => ctrl.abort();
    }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
    return { items, setItems, loading, error, refresh };
  };
}

export const useActionCategories = makeSimpleListHook(
  refApi.fetchActionCategories,
  'Erreur chargement catégories'
);

export const useActionSubcategories = makeSimpleListHook(
  refApi.fetchActionSubcategories,
  'Erreur chargement sous-catégories'
);

export const useComplexityFactors = makeSimpleListHook(
  refApi.fetchComplexityFactors,
  'Erreur chargement facteurs de complexité'
);

export const useInterventionTypes = makeSimpleListHook(
  refApi.fetchInterventionTypes,
  'Erreur chargement types d\'intervention'
);

export const useInterventionStatuses = makeSimpleListHook(
  refApi.fetchInterventionStatuses,
  'Erreur chargement statuts'
);
