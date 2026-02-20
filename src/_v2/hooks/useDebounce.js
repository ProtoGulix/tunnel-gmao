import { useEffect, useState } from 'react';

/**
 * Hook pour debouncer une valeur
 * @param {*} value - Valeur à debouncer
 * @param {number} delay - Délai en millisecondes (défaut: 500ms)
 * @returns {*} Valeur debouncée
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant la fin du délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
