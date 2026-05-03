/**
 * API Admin — Rôles et permissions
 * @module api/adminRoles
 */

import { api } from '@/lib/api/client';

export async function fetchAdminRoles() {
  const response = await api.get('/admin/roles');
  return response.data?.data || response.data;
}

export async function fetchRolePermissions(roleId) {
  const response = await api.get(`/admin/roles/${roleId}/permissions`);
  return response.data?.data || response.data;
}

export async function updatePermission(permissionId, allowed) {
  const response = await api.patch(`/admin/permissions/${permissionId}`, { allowed });
  return response.data?.data || response.data;
}

export async function fetchPermissionAudit() {
  const response = await api.get('/admin/audit/permissions');
  return response.data?.data || response.data;
}
