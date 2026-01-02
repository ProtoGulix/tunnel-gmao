import { useState, useCallback, useMemo } from 'react';
import {
  applyAllFilters,
  extractUniqueCategories,
  countActionsByCategory,
} from './actionsListUtils';

/**
 * Hook pour la gestion de l'état et de la logique métier de la liste d'actions
 *
 * @param {Array} actions - Tableau d'actions à afficher
 * @returns {Object} État, données calculées et handlers
 */
export function useActionsList(actions) {
  // ==================== STATE ====================

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ==================== COMPUTED VALUES ====================

  // Actions filtrées selon les critères
  const filteredActions = useMemo(() => {
    return applyAllFilters(actions || [], searchTerm, selectedCategory);
  }, [actions, searchTerm, selectedCategory]);

  // Catégories uniques disponibles
  const categories = useMemo(() => {
    return extractUniqueCategories(actions || []);
  }, [actions]);

  // Compteurs par catégorie
  const categoryCounts = useMemo(() => {
    const counts = {};
    categories.forEach((cat) => {
      counts[cat] = countActionsByCategory(actions || [], cat);
    });
    return counts;
  }, [actions, categories]);

  // ==================== HANDLERS ====================

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  const handleCategoryReset = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  // ==================== RETURN ====================

  return {
    filters: {
      searchTerm,
      selectedCategory,
    },
    computed: {
      filteredActions,
      categories,
      categoryCounts,
      totalCount: (actions || []).length,
      filteredCount: filteredActions.length,
    },
    handlers: {
      handleSearchChange,
      handleCategorySelect,
      handleCategoryReset,
    },
  };
}
