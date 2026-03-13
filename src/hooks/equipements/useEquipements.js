/**
 * @fileoverview Hook de gestion des équipements
 * @module hooks/equipements/useEquipements
 *
 * Gère la liste des équipements avec pagination serveur, recherche et filtre par classe.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as equipementsApi from '@/api/equipements';
import { useDebounce } from '@/hooks/useDebounce';

export function useEquipements() {
  const [equipements, setEquipements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, page_size: 50, total_pages: 1 });
  const [facets, setFacets] = useState([]);

  // Contrôles de navigation
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState(''); // code de classe sélectionné, '' = toutes

  const debouncedSearch = useDebounce(search, 350);

  const load = useCallback(async (p, ps, s, cls) => {
    try {
      setLoading(true);
      setError(null);
      const result = await equipementsApi.fetchEquipements({
        skip: (p - 1) * ps,
        limit: ps,
        search: s,
        selectClass: cls || undefined,
      });
      setEquipements(result.items ?? []);
      setPagination(result.pagination ?? { total: 0 });
      // Conserver les facettes de la charge initiale (sans filtre) pour le menu déroulant
      if (!cls && !s) setFacets(result.facets?.equipement_class ?? []);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des équipements');
      setEquipements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, pageSize, debouncedSearch, classFilter);
  }, [page, pageSize, debouncedSearch, classFilter, load]);

  // Remonter en page 1 quand search ou classFilter change
  const handleSearchChange = useCallback((v) => { setSearch(v); setPage(1); }, []);
  const handleClassFilterChange = useCallback((v) => { setClassFilter(v); setPage(1); }, []);

  // Cache courant pour getParentInfo (parents dans la page courante)
  const equipementsById = useMemo(() => {
    const map = new Map();
    equipements.forEach((eq) => map.set(eq.id, eq));
    return map;
  }, [equipements]);

  const getParentInfo = useCallback(
    (parentId) => (parentId ? equipementsById.get(parentId) ?? null : null),
    [equipementsById]
  );

  // CRUD
  const createEquipement = useCallback(async (data) => {
    const created = await equipementsApi.createEquipement(data);
    load(page, pageSize, debouncedSearch, classFilter);
    return created;
  }, [load, page, pageSize, debouncedSearch, classFilter]);

  const updateEquipement = useCallback(async (id, updates) => {
    const updated = await equipementsApi.updateEquipement(id, updates);
    load(page, pageSize, debouncedSearch, classFilter);
    return updated;
  }, [load, page, pageSize, debouncedSearch, classFilter]);

  const deleteEquipement = useCallback(async (id) => {
    await equipementsApi.deleteEquipement(id);
    load(page, pageSize, debouncedSearch, classFilter);
  }, [load, page, pageSize, debouncedSearch, classFilter]);

  const refresh = useCallback(() => load(page, pageSize, debouncedSearch, classFilter), [load, page, pageSize, debouncedSearch, classFilter]);

  return {
    equipements,
    loading,
    error,
    pagination,
    facets,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch: handleSearchChange,
    classFilter,
    setClassFilter: handleClassFilterChange,
    getParentInfo,
    createEquipement,
    updateEquipement,
    deleteEquipement,
    refresh,
  };
}
