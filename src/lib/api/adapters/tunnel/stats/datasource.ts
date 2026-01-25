/**
 * Stats Datasource - Tunnel Backend
 *
 * Raw HTTP calls only. Returns unprocessed tunnel-backend responses.
 *
 * @module lib/api/adapters/tunnel/stats/datasource
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

export const fetchServiceStatusRaw = async (startDate?: string, endDate?: string) => {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await tunnelApi.get('/stats/service-status', { params });
  return response.data || {};
};
