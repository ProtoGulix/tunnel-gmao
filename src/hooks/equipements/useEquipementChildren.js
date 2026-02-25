/**
 * @fileoverview Hook pour gérer les enfants d'un équipement
 * @module hooks/equipements/useEquipementChildren
 *
 * Gère la liste paginée des enfants avec recherche
 */

import { useState, useCallback } from 'react';
import { fetchEquipementChildren } from '@/api/equipements';

/**
 * Hook pour gérer les enfants d'un équipement avec pagination
 *
 * @param {string} parentId - ID de l'équipement parent
 * @returns {Object} État et méthodes
 */
export function useEquipementChildren(parentId) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [searchText, setSearchText] = useState('');

  // Mise à jour du state après chargement
  const updateState = useCallback((data) => {
    setChildren(data.items || []);
    setPagination({
      page: data.page || 1,
      pageSize: data.page_size || 20,
      total: data.total || 0,
      totalPages: data.total_pages || 0,
    });
  }, []);

  // Charger les enfants
  const loadChildren = useCallback(
    async (page = 1, search = '', limit = pagination.pageSize) => {
      if (!parentId) return;

      try {
        setLoading(true);
        setError(null);

        const params = { page, limit };
        if (search.trim()) params.search = search.trim();

        const data = await fetchEquipementChildren(parentId, params);
        updateState(data);
      } catch (err) {
        console.error('Erreur fetch children:', err);
        setError(err.message || 'Erreur lors du chargement des équipements enfants');
        setChildren([]);
      } finally {
        setLoading(false);
      }
    },
    [parentId, updateState, pagination.pageSize]
  );

  // Changer de page
  const goToPage = useCallback(
    (page) => {
      loadChildren(page, searchText, pagination.pageSize);
    },
    [loadChildren, searchText, pagination.pageSize]
  );

  // Changer la taille de page
  const changePageSize = useCallback(
    (newSize) => {
      loadChildren(1, searchText, newSize);
    },
    [loadChildren, searchText]
  );

  // Rechercher
  const search = useCallback(
    (text) => {
      setSearchText(text);
      loadChildren(1, text);
    },
    [loadChildren]
  );

  // Reset recherche
  const resetSearch = useCallback(() => {
    setSearchText('');
    loadChildren(1, '');
  }, [loadChildren]);

  return {
    children,
    loading,
    error,
    pagination,
    searchText,
    loadChildren,
    goToPage,
    changePageSize,
    search,
    resetSearch,
  };
}
