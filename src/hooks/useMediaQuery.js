/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📱 useMediaQuery.js - Hook custom pour media queries responsive
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Hook React pour détecter si une media query CSS correspond à l'écran actuel
 * - Écoute les changements de taille d'écran en temps réel
 * - Cleanup automatique des listeners
 * - SSR-safe (window.matchMedia vérifié)
 * - Performant (pas de re-render inutile)
 *
 * Utilisé dans :
 * - Layout.jsx (détection mobile/desktop)
 * - Sidebar.jsx (comportement responsive)
 * - Futurs composants nécessitant responsive
 *
 * ✅ Implémenté :
 * - useState pour stocker match actuel
 * - useEffect pour écouter changements
 * - Cleanup listener au unmount
 * - SSR-safe avec vérification window
 *
 * 📋 TODO : Améliorations futures
 * - [ ] Support SSR complet : hydration mismatch handling
 * - [ ] Memoization : useMemo sur media query object
 * - [ ] Debounce : éviter re-renders multiples lors resize
 * - [ ] Presets : useIsMobile(), useIsTablet(), useIsDesktop()
 * - [ ] Multiple queries : useMediaQueries(['query1', 'query2'])
 * - [ ] Hook orientation : useOrientation() portrait/landscape
 *
 * @module hooks/useMediaQuery
 * @requires react
 */

import { useState, useEffect } from 'react';

/**
 * Hook pour détecter si une media query CSS correspond
 *
 * @param {string} query - Media query CSS (ex: "(max-width: 768px)")
 * @returns {boolean} true si media query correspond, false sinon
 *
 * @example
 * // Détection mobile
 * const isMobile = useMediaQuery('(max-width: 768px)');
 *
 * @example
 * // Détection dark mode
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 *
 * @example
 * // Détection orientation
 * const isPortrait = useMediaQuery('(orientation: portrait)');
 */
export function useMediaQuery(query) {
  // SSR-safe: retourner false si window n'existe pas
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // SSR-safe: ne rien faire si window n'existe pas
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Handler pour mettre à jour l'état
    const handleChange = (event) => {
      setMatches(event.matches);
    };

    // Écouter les changements
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup au unmount
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

export default useMediaQuery;
