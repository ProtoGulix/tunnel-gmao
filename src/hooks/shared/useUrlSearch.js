/**
 * @fileoverview Hook pour synchroniser un champ de recherche avec un query param URL
 * @module hooks/shared/useUrlSearch
 */

import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Synchronise une valeur de recherche avec un query param de l'URL.
 * La lecture est immédiate ; l'écriture est synchrone (pas de debounce —
 * le debounce pour les appels API reste dans les hooks de données).
 *
 * @param {string} [paramName='q'] - Nom du query param
 * @param {string} [defaultValue=''] - Valeur par défaut si le param est absent
 * @returns {[string, Function]} [value, setValue]
 *
 * @example
 * const [urlSearch, setUrlSearch] = useUrlSearch('q');
 * const { search, setSearch } = useStockItems({ initialSearch: urlSearch });
 *
 * const handleSearch = (v) => { setSearch(v); setUrlSearch(v); };
 */
export function useUrlSearch(paramName = 'q', defaultValue = '') {
  const [params, setParams] = useSearchParams();

  const value = params.get(paramName) ?? defaultValue;

  const setValue = useCallback(
    (nextValue) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (nextValue) next.set(paramName, nextValue);
          else next.delete(paramName);
          return next;
        },
        { replace: true }
      );
    },
    [paramName, setParams]
  );

  return [value, setValue];
}
