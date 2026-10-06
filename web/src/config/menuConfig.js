import { PAGES_CONFIG } from '@/config/pagesConfig';

export { PAGES_CONFIG };

const SECTION_LABELS = {
  main: 'Navigation',
  maintenance: 'Maintenance',
  stock: 'Stock',
  production: 'Production',
  admin: 'Administration',
  public: 'Public',
};

const SECTION_ORDER = {
  main: 0,
  maintenance: 1,
  stock: 2,
  production: 3,
  admin: 4,
  public: 5,
};

export { SECTION_LABELS, SECTION_ORDER };

export const MENU_CONFIG = {
  public: PAGES_CONFIG.filter((p) => p.public || p.publicOnly),
  private: PAGES_CONFIG.filter((p) => p.requiresAuth && !p.publicOnly),
};

export function getMenuItems(isAuthenticated, userRole = null) {
  const normalizedRole = userRole?.toUpperCase() ?? null;
  return PAGES_CONFIG.filter((item) => {
    if (item.showInMenu === false || item.disabled === true) return false;
    if (isAuthenticated) {
      if (item.publicOnly) return false;
      if (item.requiredRoles && !item.requiredRoles.map((r) => r.toUpperCase()).includes(normalizedRole)) return false;
      return true;
    }
    return item.public || item.publicOnly;
  });
}

export function getMenuSections(isAuthenticated, userRole = null) {
  const menuItems = getMenuItems(isAuthenticated, userRole);

  if (isAuthenticated) {
    const sections = {};
    menuItems
      .filter((item) => item.requiresAuth && !item.public)
      .forEach((item) => {
        const section = item.section || 'maintenance';
        if (!sections[section]) sections[section] = [];
        sections[section].push(item);
      });

    Object.keys(sections).forEach((section) => {
      sections[section].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    });

    const result = {};
    Object.keys(sections)
      .sort((a, b) => (SECTION_ORDER[a] ?? 999) - (SECTION_ORDER[b] ?? 999))
      .forEach((section) => { result[section] = sections[section]; });

    return {
      ...result,
      public: menuItems.filter((item) => item.public && !item.publicOnly),
    };
  }

  return { public: menuItems };
}

export function getPageConfig(path) {
  let page = PAGES_CONFIG.find((p) => p.path === path);
  if (!page) {
    page = PAGES_CONFIG.find((p) => {
      const pattern = p.path.replace(/:[^/]+/g, '[^/]+');
      return new RegExp(`^${pattern}$`).test(path);
    });
  }
  return page || null;
}

export function getPageConfigById(id) {
  return PAGES_CONFIG.find((p) => p.id === id) || null;
}

export function canAccessPage(pageConfig, isAuthenticated) {
  if (!pageConfig) return false;
  if (pageConfig.public || pageConfig.publicOnly) return true;
  return pageConfig.requiresAuth ? isAuthenticated : true;
}
