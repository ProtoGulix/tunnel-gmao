/**
 * Tunnel Backend Datasource
 *
 * Raw HTTP calls only. Returns unprocessed tunnel-backend responses.
 * No DTO mapping. No apiCall wrapper. No cache invalidation.
 *
 * @module lib/api/adapters/tunnel/datasource
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from 'axios';

const TUNNEL_BACKEND_URL = import.meta.env.VITE_TUNNEL_BACKEND_URL || 'http://localhost:8000';

const tunnelApi = axios.create({
  baseURL: TUNNEL_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth header if available
tunnelApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================================
// Auth
// ============================================================================

export const loginRaw = async (email: string, password: string) => {
  const { data } = await tunnelApi.post('/auth/login', { email, password, mode: 'session' });
  return data?.data || data;
};

export const logoutRaw = async () => {
  localStorage.removeItem('auth_access_token');
  localStorage.removeItem('auth_refresh_token');
};

// ============================================================================
// Interventions
// ============================================================================

export const fetchInterventionRaw = async (id: string) => {
  const response = await tunnelApi.get(`/interventions/${id}`);
  return response.data?.data || response.data || {};
};

export const fetchInterventionsRaw = async (filters: any = {}) => {
  const params = {
    skip: filters.skip ?? 0,
    limit: filters.limit ?? 100,
  };

  if (filters.equipement_id) params.equipement_id = filters.equipement_id;
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.sort) params.sort = filters.sort;

  const response = await tunnelApi.get('/interventions', { params });
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
  return list || [];
};

// ============================================================================
// Intervention Status Refs
// ============================================================================

export const fetchStatusRefsRaw = async () => {
  const response = await tunnelApi.get('/intervention_status');
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
  return list || [];
};

// ============================================================================
// Actions
// ============================================================================

export const fetchActionsRaw = async (interventionId?: string) => {
  if (interventionId) {
    const { data } = await tunnelApi.get(`/interventions/${interventionId}/actions`);
    const list = Array.isArray(data) ? data : data?.data || [];
    return list;
  }

  const response = await tunnelApi.get('/intervention_actions');
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
  return list;
};

// ============================================================================
// Action Subcategories
// ============================================================================

export const fetchSubcategoriesRaw = async () => {
  const response = await tunnelApi.get('/action_subcategories');
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
  return list || [];
};

// ============================================================================
// Equipements
// ============================================================================

export const fetchEquipementsRaw = async () => {
  const response = await tunnelApi.get('/equipements');
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
  return list || [];
};

export const fetchEquipementRaw = async (id: string) => {
  const response = await tunnelApi.get(`/equipements/${id}`);
  return response.data?.data || response.data || {};
};

export const fetchEquipementStatsRaw = async (id: string, startDate?: string, endDate?: string) => {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await tunnelApi.get(`/equipements/${id}/stats`, { params });
  return response.data?.data || response.data || {};
};

export const fetchEquipementHealthRaw = async (id: string) => {
  const response = await tunnelApi.get(`/equipements/${id}/health`);
  return response.data?.data || response.data || {};
};

// ============================================================================
// Stats (Service Status)
// ============================================================================

export const fetchServiceStatusRaw = async (startDate?: string, endDate?: string) => {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await tunnelApi.get('/stats/service-status', { params });
  return response.data || {};
};
