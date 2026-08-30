/**
 * @fileoverview Hook pour synchroniser les onglets avec l'URL
 * @module hooks/shared/useTabNavigation
 */

import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook pour synchroniser les onglets avec l'URL via query parameter
 *
 * @param {string} defaultTab - Onglet par défaut si aucun n'est spécifié dans l'URL
 * @param {string} [paramName='tab'] - Nom du query parameter (par défaut 'tab')
 * @param {string[]} [clearParams=[]] - Noms des query params à supprimer à chaque
 *   changement d'onglet (ex: sélection/sous-vue propre à l'onglet quitté, qui n'a
 *   plus de sens une fois qu'on n'y est plus). Vide par défaut — comportement
 *   inchangé pour les appelants existants qui ne le renseignent pas.
 * @returns {Object} - { activeTab, setActiveTab }
 *
 * @example
 * // Dans un composant avec onglets
 * const { activeTab, setActiveTab } = useTabNavigation('requests', 'tab');
 *
 * // Dans les Tabs Radix UI
 * <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
 *   ...
 * </Tabs.Root>
 *
 * @example
 * // Nettoie requestId en quittant l'onglet "requests"
 * useTabNavigation('requests', 'tab', ['requestId']);
 */
export function useTabNavigation(defaultTab, paramName = 'tab', clearParams = []) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Dériver activeTab directement depuis l'URL — pas de state local redondant
  const activeTab = searchParams.get(paramName) || defaultTab;

  // Fonction pour changer d'onglet et mettre à jour l'URL
  const setActiveTab = useCallback(
    (newTab) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set(paramName, newTab);
          clearParams.forEach((p) => newParams.delete(p));
          return newParams;
        },
        { replace: true }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setSearchParams, paramName, clearParams.join(',')]
  );

  return { activeTab, setActiveTab };
}
