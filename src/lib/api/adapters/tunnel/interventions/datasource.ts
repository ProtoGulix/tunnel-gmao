/**
 * Interventions Datasource - Tunnel Backend
 *
 * Raw HTTP calls only. Returns unprocessed tunnel-backend responses.
 *
 * @module lib/api/adapters/tunnel/interventions/datasource
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

tunnelApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
