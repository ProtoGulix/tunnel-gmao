/**
 * @fileoverview Liste paginée côté API (skip/limit) pour les panneaux de détail
 * @module hooks/shared/usePagedList
 */

import { useState, useEffect, useRef } from 'react';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export const PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50];

/**
 * Liste paginée générique : page et taille propres, remise à la page 1 quand `resetKey` change,
 * garde contre les réponses obsolètes.
 * @param {string} resetKey - clé de périmètre (équipement + sous-équipements)
 * @param {(skip: number, limit: number) => Promise<{items: Array, pagination?: Object}>} fetchPage
 * @param {string} errorLabel
 */
export function usePagedList(resetKey, fetchPage, errorLabel) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [state, setState] = useState({ items: [], total: 0, loading: true, error: null });
  const requestId = useRef(0);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const lastKey = useRef(resetKey);

  // Changement de périmètre : retour page 1 (le fetch de la page courante est alors ignoré)
  const scopeChanged = lastKey.current !== resetKey;
  if (scopeChanged) {
    lastKey.current = resetKey;
    if (page !== 1) setPage(1);
  }

  useEffect(() => {
    const current = ++requestId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchRef.current((page - 1) * pageSize, pageSize)
      .then(({ items, pagination }) => {
        if (current !== requestId.current) return;
        setState({ items, total: pagination?.total ?? items.length, loading: false, error: null });
      })
      .catch((err) => {
        if (current !== requestId.current) return;
        setState((s) => ({ ...s, loading: false, error: extractApiErrorMessage(err, errorLabel) }));
      });
    return () => { requestId.current += 1; };
  }, [resetKey, page, pageSize, errorLabel]);

  return { ...state, page, pageSize, setPage, setPageSize };
}
