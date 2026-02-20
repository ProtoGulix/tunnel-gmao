import { useMemo } from 'react';

/**
 * Vérifie si description contient le terme recherché
 */
function checkDescription(item, searchLower) {
  const desc = item.data.description?.toLowerCase() || '';
  return desc.includes(searchLower);
}

/**
 * Vérifie si catégorie contient le terme recherché
 */
function checkCategory(item, searchLower) {
  const category = item.data.subcategory?.name?.toLowerCase() || '';
  return category.includes(searchLower);
}

/**
 * Vérifie si technicien contient le terme recherché
 */
function checkTechnician(item, searchLower) {
  const tech = item.data.technician;
  const technician = tech ? `${tech.firstName || ''} ${tech.lastName || ''}`.toLowerCase() : '';
  return technician.includes(searchLower);
}

/**
 * Vérifie si un item timeline correspond au filtre de recherche
 */
function matchesSearch(item, searchLower) {
  // Garder tous les changements de statut
  if (item.type === 'status') return true;

  // Filtrer actions
  return (
    checkDescription(item, searchLower) ||
    checkCategory(item, searchLower) ||
    checkTechnician(item, searchLower)
  );
}

/**
 * Filtre une journée d'items timeline selon le terme de recherche
 */
function filterDayGroup(dayGroup, searchLower) {
  return {
    ...dayGroup,
    items: dayGroup.items.filter((item) => matchesSearch(item, searchLower)),
  };
}

/**
 * Hook pour gérer la logique d'ActionsTab
 * Filtre et structure les données pour l'affichage
 */
export function useActionsTab(interv, searchActions, timelineByDay) {
  // Données filtrées pour la timeline
  const filteredTimeline = useMemo(() => {
    if (!timelineByDay || searchActions.trim() === '') {
      return timelineByDay || [];
    }

    const searchLower = searchActions.toLowerCase();
    const filtered = timelineByDay.map((dayGroup) => filterDayGroup(dayGroup, searchLower));

    return filtered.filter((dayGroup) => dayGroup.items.length > 0);
  }, [timelineByDay, searchActions]);

  return {
    filteredTimeline,
    hasActions: (interv?.action?.length || 0) > 0,
    actionCount: interv?.action?.length || 0,
  };
}
