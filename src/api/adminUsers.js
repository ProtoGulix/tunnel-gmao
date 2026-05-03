/**
 * API Admin — Gestion des utilisateurs
 * @module api/adminUsers
 */

import { api } from '@/lib/api/client';

export async function fetchAdminUsers(params = {}) {
  const response = await api.get('/admin/users', { params });
  return response.data?.data || response.data;
}

export async function createAdminUser(data) {
  const response = await api.post('/admin/users', data);
  return response.data?.data || response.data;
}

export async function updateAdminUser(id, data) {
  const response = await api.put(`/admin/users/${id}`, data);
  return response.data?.data || response.data;
}

export async function changeAdminUserRole(id, role_code) {
  const response = await api.patch(`/admin/users/${id}/role`, { role_code });
  return response.data?.data || response.data;
}

export async function toggleAdminUserActive(id, is_active) {
  const response = await api.patch(`/admin/users/${id}/active`, { is_active });
  return response.data?.data || response.data;
}

export async function resetAdminUserPassword(id) {
  const response = await api.post(`/admin/users/${id}/reset-password`);
  return response.data?.data || response.data;
}
