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

  const pageConfig = useMemo(() => {
    return getPageConfig(location.pathname);
  }, [location.pathname]);

  return pageConfig;
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

  const headerProps = useMemo(() => {
    const configTimeFilter = pageConfig?.timeFilter
      ? {
          enabled: pageConfig.timeFilter.enabled ?? true,
          mode: pageConfig.timeFilter.mode || 'select',
          component: pageConfig.timeFilter.component,
          triggerLabel: pageConfig.timeFilter.triggerLabel || 'Période',
          options: pageConfig.timeFilter.options,
          defaultValue: pageConfig.timeFilter.defaultValue,
          totalActions: pageConfig.timeFilter.totalActions,
          filteredActions: pageConfig.timeFilter.filteredActions,
        }
      : null;

    const overrideTimeSelection = overrides.timeSelection;
    const restOverrides = { ...overrides };
    delete restOverrides.timeSelection;

    const mergedTimeSelection = overrideTimeSelection
      ? { ...configTimeFilter, ...overrideTimeSelection }
      : configTimeFilter;

    if (!pageConfig) {
      return {
        title: 'Page',
        subtitle: '',
        icon: null,
        ...restOverrides,
        timeSelection: mergedTimeSelection || overrideTimeSelection || null,
      };
    }

    return {
      title: overrides.title || pageConfig.pageTitle || pageConfig.label,
      subtitle: overrides.subtitle || pageConfig.pageSubtitle || '',
      icon: overrides.icon || pageConfig.icon,
      ...restOverrides,
      timeSelection: mergedTimeSelection || overrideTimeSelection || null,
    };
  }, [pageConfig, overrides]);

  return headerProps;
}
