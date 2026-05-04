/**
 * @fileoverview Hook gestion des utilisateurs admin
 * @module hooks/admin/useAdminUsers
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  changeAdminUserRole,
  toggleAdminUserActive,
  resetAdminUserPassword,
} from '@/api/adminUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

const DEFAULT_PAGE_SIZE = 50;

export function useAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearchState] = useState('');
  const [filterActive, setFilterActiveState] = useState('');
  const [filterRole, setFilterRoleState] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const abortRef = useRef(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const ctrl = abortRef.current;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          skip: (page - 1) * DEFAULT_PAGE_SIZE,
          limit: DEFAULT_PAGE_SIZE,
        };
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (filterActive !== '') params.is_active = filterActive === 'active';
        if (filterRole) params.role_code = filterRole.toLowerCase();

        const data = await fetchAdminUsers(params);
        if (ctrl.signal.aborted) return;

        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        setUsers(items);
        setTotal(data?.pagination?.total ?? items.length);
        setTotalPages(data?.pagination?.total_pages ?? 1);
      } catch (err) {
        if (ctrl.signal.aborted) return;
        setError(extractApiErrorMessage(err, 'Erreur lors du chargement des utilisateurs'));
        setUsers([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => ctrl.abort();
  }, [page, debouncedSearch, filterActive, filterRole, refreshKey]);

  const setSearch = useCallback((v) => { setSearchState(v); setPage(1); }, []);
  const setFilterActive = useCallback((v) => { setFilterActiveState(v); setPage(1); }, []);
  const setFilterRole = useCallback((v) => { setFilterRoleState(v); setPage(1); }, []);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const createUser = useCallback(async (payload) => {
    const created = await createAdminUser(payload);
    refresh();
    return created;
  }, [refresh]);

  const editUser = useCallback(async (id, payload) => {
    const updated = await updateAdminUser(id, payload);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    return updated;
  }, []);

  const changeRole = useCallback(async (id, role_code) => {
    const updated = await changeAdminUserRole(id, role_code);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    return updated;
  }, []);

  const toggleActive = useCallback(async (id, is_active) => {
    const updated = await toggleAdminUserActive(id, is_active);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    return updated;
  }, []);

  const resetPassword = useCallback(async (id) => {
    return resetAdminUserPassword(id);
  }, []);

  return {
    users,
    loading,
    error,
    search,
    setSearch,
    filterActive,
    setFilterActive,
    filterRole,
    setFilterRole,
    pagination: { total, page, pageSize: DEFAULT_PAGE_SIZE, totalPages },
    goToPage: setPage,
    refresh,
    createUser,
    editUser,
    changeRole,
    toggleActive,
    resetPassword,
  };
}
