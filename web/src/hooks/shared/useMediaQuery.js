/**
 * @fileoverview Hook React useMediaQuery - Détection responsive des media queries
 *
 * Hook custom pour détecter si une media query CSS correspond à l'état actuel
 * de la fenêtre. Permet de gérer le responsive design avec des breakpoints
 * dynamiques.
 *
 * Utilise window.matchMedia() avec listener d'événements. Nettoie automatiquement
 * les listeners au démontage.
 *
 * Breakpoints recommandés :
 * - Mobile : (max-width: 768px)
 * - Tablet : (min-width: 769px) and (max-width: 1024px)
 * - Desktop : (min-width: 1025px)
 *
 * @module hooks/shared/useMediaQuery
 * @requires react
 *
 * @example
 * ```jsx
 * import { useMediaQuery } from '@/hooks/shared/useMediaQuery';
 *
 * function MyComponent() {
 *   const isMobile = useMediaQuery('(max-width: 768px)');
 *   const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
 *   const isDesktop = useMediaQuery('(min-width: 1025px)');
 *
 *   return (
 *     <div>
 *       {isMobile && <MobileView />}
 *       {isTablet && <TabletView />}
 *       {isDesktop && <DesktopView />}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```jsx
 * // Utilisation avec config/layoutConfig.js
 * import { MOBILE_QUERY } from '@/config/layoutConfig';
 * import { useMediaQuery } from '@/hooks/shared/useMediaQuery';
 *
 * function Layout({ children }) {
 *   const isMobile = useMediaQuery(MOBILE_QUERY);
 *   return <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>{children}</div>;
 * }
 * ```
 */

import { useState, useEffect } from 'react';

/**
 * Hook React pour détecter les media queries
 *
 * @param {string} query - Media query CSS (ex: '(max-width: 768px)')
 * @returns {boolean} True si la media query correspond, false sinon
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 */
export function useMediaQuery(query) {
  // État initial basé sur window.matchMedia
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    // Garde SSR-safe : ne rien faire si window n'existe pas
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // Handler appelé quand la media query change
    const handleChange = (event) => {
      setMatches(event.matches);
    };

    // Listener moderne (IE11+ abandonné)
    mediaQuery.addEventListener('change', handleChange);

    // Sync initial au cas où l'état aurait changé entre le mount et l'effect
    setMatches(mediaQuery.matches);

    // Cleanup : retirer le listener au démontage
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]); // Re-run si la query change

  return matches;
}

export default useMediaQuery;
