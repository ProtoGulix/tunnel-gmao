/**
 * Hook pour récupérer automatiquement la configuration de la page courante
 * Basé sur l'URL actuelle depuis menuConfig
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getPageConfig } from '@/config/menuConfig';

/**
 * Hook pour récupérer automatiquement la configuration de la page courante
 * Basé sur l'URL actuelle
 *
 * @returns {Object|null} Configuration de la page avec :
 *   - id, path, label, icon
 *   - pageTitle, pageSubtitle
 *   - requiresAuth, public, publicOnly
 */
export function usePageConfig() {
  const location = useLocation();

  return useMemo(() => {
    return getPageConfig(location.pathname);
  }, [location.pathname]);
}

/**
 * Hook pour créer automatiquement les props du PageHeader
 * à partir de la configuration de page
 *
 * @param {Object} overrides - Props à surcharger (ex: subtitle dynamique)
 * @returns {Object} Props prêts pour PageHeader
 *
 * @example
 * const headerProps = usePageHeaderProps({
 *   subtitle: `Machine ${machineData.name}`
 * });
 * <PageHeader {...headerProps} />
 */
export function usePageHeaderProps(overrides = {}) {
  const pageConfig = usePageConfig();

  return useMemo(() => {
    if (!pageConfig) {
      return overrides;
    }

    return {
      icon: pageConfig.icon,
      title: pageConfig.pageTitle || pageConfig.label,
      subtitle: pageConfig.pageSubtitle,
      ...overrides,
    };
  }, [pageConfig, overrides]);
}
