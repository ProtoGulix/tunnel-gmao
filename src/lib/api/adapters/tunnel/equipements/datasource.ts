/**
 * Equipements Datasource - Tunnel Backend
 *
 * Raw HTTP calls only. Returns unprocessed tunnel-backend responses.
 *
 * @module lib/api/adapters/tunnel/equipements/datasource
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
