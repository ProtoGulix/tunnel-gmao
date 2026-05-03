/**
 * @fileoverview Hook gestion des rôles et de la matrice de permissions
 * @module hooks/admin/useAdminRoles
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchAdminRoles,
  fetchRolePermissions,
  updatePermission,
  fetchPermissionAudit,
} from '@/api/adminRoles';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function useAdminRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initialRef = useRef(false);

  useEffect(() => {
    if (initialRef.current) return;
    initialRef.current = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAdminRoles();
        setRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(extractApiErrorMessage(err, 'Erreur lors du chargement des rôles'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { roles, loading, error };
}

export function useRolePermissions(roleId) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roleId) return;
    setLoading(true);
    setError(null);
    fetchRolePermissions(roleId)
      .then((data) => setPermissions(Array.isArray(data) ? data : []))
      .catch((err) => setError(extractApiErrorMessage(err, 'Erreur lors du chargement des permissions')))
      .finally(() => setLoading(false));
  }, [roleId]);

  // Optimistic update avec rollback
  const togglePermission = useCallback(async (permissionId, newAllowed) => {
    const prev = permissions;
    setPermissions((perms) =>
      perms.map((p) => (p.id === permissionId ? { ...p, allowed: newAllowed } : p))
    );
    try {
      await updatePermission(permissionId, newAllowed);
    } catch (err) {
      // Rollback
      setPermissions(prev);
      throw err;
    }
  }, [permissions]);

  return { permissions, loading, error, togglePermission };
}

export function usePermissionAudit() {
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPermissionAudit();
      setAudit(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors du chargement de l\'historique'));
    } finally {
      setLoading(false);
    }
  }, []);

  return { audit, loading, error, load };
}
