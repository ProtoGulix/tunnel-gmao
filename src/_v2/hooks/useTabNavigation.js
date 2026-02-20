import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook pour synchroniser les onglets avec l'URL via query parameter
 *
 * @param {string} defaultTab - Onglet par défaut si aucun n'est spécifié dans l'URL
 * @param {string} [paramName='tab'] - Nom du query parameter (par défaut 'tab')
 * @returns {[string, Function]} - [activeTab, setActiveTab]
 *
 * @example
 * // Dans un composant avec onglets
 * const [activeTab, setActiveTab] = useTabNavigation('requests', 'tab');
 *
 * // Dans les Tabs Radix UI
 * <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
 *   ...
 * </Tabs.Root>
 */
export function useTabNavigation(defaultTab, paramName = 'tab') {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialiser avec le tab depuis l'URL ou le defaultTab
  const [activeTab, setActiveTabState] = useState(() => {
    const tabFromUrl = searchParams.get(paramName);
    return tabFromUrl || defaultTab;
  });

  // Synchroniser le state avec l'URL au montage et quand l'URL change
  useEffect(() => {
    const tabFromUrl = searchParams.get(paramName);
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl);
    }
  }, [searchParams, paramName, activeTab]);

  // Fonction pour changer d'onglet et mettre à jour l'URL
  const setActiveTab = useCallback(
    (newTab) => {
      setActiveTabState(newTab);

      // Mettre à jour l'URL sans recharger la page
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set(paramName, newTab);
          return newParams;
        },
        { replace: true }
      ); // replace: true pour ne pas créer d'entrée dans l'historique
    },
    [setSearchParams, paramName]
  );

  return [activeTab, setActiveTab];
}
