import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook pour synchroniser un champ de recherche avec l'URL via query parameter
 *
 * @param {string} [paramName='search'] - Nom du query parameter (par défaut 'search')
 * @param {string} [defaultValue=''] - Valeur par défaut si aucune n'est spécifiée dans l'URL
 * @returns {[string, Function]} - [searchValue, setSearchValue]
 *
 * @example
 * // Dans un composant avec recherche
 * const [searchTerm, setSearchTerm] = useSearchParam('search', '');
 *
 * // Dans un TableHeader ou TextField
 * <TextField value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
 *
 * // Pour créer un lien avec recherche pré-remplie
 * <Link to="/stock-management?tab=stock&search=FA-123">FA-123</Link>
 */
export function useSearchParam(paramName = 'search', defaultValue = '') {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialiser avec la valeur depuis l'URL ou la valeur par défaut
  const [searchValue, setSearchValueState] = useState(() => {
    const valueFromUrl = searchParams.get(paramName);
    return valueFromUrl || defaultValue;
  });

  // Synchroniser le state avec l'URL quand l'URL change (navigation externe)
  useEffect(() => {
    const valueFromUrl = searchParams.get(paramName);
    if (valueFromUrl !== null && valueFromUrl !== searchValue) {
      setSearchValueState(valueFromUrl);
    } else if (valueFromUrl === null && searchValue !== defaultValue) {
      // Si le paramètre n'existe plus dans l'URL, revenir à la valeur par défaut
      setSearchValueState(defaultValue);
    }
  }, [searchParams, paramName, searchValue, defaultValue]);

  // Fonction pour changer la valeur et mettre à jour l'URL
  const setSearchValue = useCallback(
    (newValue) => {
      setSearchValueState(newValue);

      // Mettre à jour l'URL
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          if (newValue && newValue.trim() !== '') {
            newParams.set(paramName, newValue);
          } else {
            // Supprimer le paramètre si vide
            newParams.delete(paramName);
          }
          return newParams;
        },
        { replace: true }
      ); // replace: true pour ne pas créer d'entrée dans l'historique
    },
    [setSearchParams, paramName]
  );

  return [searchValue, setSearchValue];
}
