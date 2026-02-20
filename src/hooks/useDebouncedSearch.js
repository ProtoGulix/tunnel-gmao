import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from './useDebounce';

/**
 * Hook pour gérer une recherche avec debounce et synchronisation URL
 *
 * @param {string} paramName - Nom du paramètre dans l'URL (défaut: 'search')
 * @param {number} debounceDelay - Délai du debounce en ms (défaut: 600)
 * @returns {Object} { searchTerm, debouncedSearchTerm, setSearchTerm }
 *
 * @example
 * const { searchTerm, debouncedSearchTerm, setSearchTerm } = useDebouncedSearch('search', 600);
 *
 * // Dans le champ de recherche
 * <TextField value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
 *
 * // Dans les requêtes API
 * const params = { search: debouncedSearchTerm };
 */
export function useDebouncedSearch(paramName = 'search', debounceDelay = 600) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initializedRef = useRef(false);

  // État local pour affichage immédiat - initialisé depuis l'URL
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get(paramName) || '');

  // Debounce pour éviter trop de requêtes API
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

  // Synchroniser URL avec le terme debounced (après que l'utilisateur ait fini de taper)
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '') {
          newParams.set(paramName, debouncedSearchTerm);
        } else {
          newParams.delete(paramName);
        }
        return newParams;
      },
      { replace: true } // Ne pas créer d'entrées dans l'historique
    );
  }, [debouncedSearchTerm, paramName, setSearchParams]);

  // Synchroniser état local avec URL (navigation back/forward, modification manuelle)
  useEffect(() => {
    const searchFromUrl = searchParams.get(paramName) || '';
    if (searchFromUrl !== searchTerm) {
      setSearchTerm(searchFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, paramName]);

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
  };
}
