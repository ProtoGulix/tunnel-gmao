/**
 * @fileoverview Hook pour synchroniser l'élément sélectionné d'une vue master-detail
 * avec un query param URL — rend la sélection persistante, partageable et compatible
 * avec précédent/suivant du navigateur.
 * @module hooks/shared/useSelectedIdParam
 */

import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Synchronise l'id sélectionné d'une vue master-detail avec un query param de l'URL.
 * Contrairement à un state React local, l'id reste visible dans l'URL tant que la
 * sélection est active — le lien est donc partageable et fonctionne avec le
 * précédent/suivant du navigateur.
 *
 * Ce hook ne gère que l'id ; le chargement du détail (fetch, loading state) reste
 * à la charge de l'écran appelant, généralement via un `useEffect([selectedId])`.
 *
 * @param {string} [paramName='selectedId'] - Nom du query param
 * @returns {[string|null, Function]} [selectedId, setSelectedId] — setSelectedId(null) désélectionne
 *
 * @example
 * const [selectedId, setSelectedId] = useSelectedIdParam('requestId');
 *
 * useEffect(() => {
 *   if (!selectedId) { setSelected(null); return; }
 *   let cancelled = false;
 *   fetchDetail(selectedId).then((d) => { if (!cancelled) setSelected(d); });
 *   return () => { cancelled = true; };
 * }, [selectedId]);
 *
 * const handleSelect = (row) => {
 *   setSelectedId(row.id === selectedId ? null : row.id);
 * };
 */
export function useSelectedIdParam(paramName = 'selectedId') {
  const [params, setParams] = useSearchParams();

  const selectedId = params.get(paramName);

  const setSelectedId = useCallback(
    (nextId) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (nextId) next.set(paramName, nextId);
          else next.delete(paramName);
          return next;
        },
        { replace: true }
      );
    },
    [paramName, setParams]
  );

  return [selectedId, setSelectedId];
}
