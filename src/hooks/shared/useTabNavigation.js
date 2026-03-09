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
 */
export function useTabNavigation(defaultTab, paramName = 'tab') {
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
          return newParams;
        },
        { replace: true }
      );
    },
    [setSearchParams, paramName]
  );

  return { activeTab, setActiveTab };
}
