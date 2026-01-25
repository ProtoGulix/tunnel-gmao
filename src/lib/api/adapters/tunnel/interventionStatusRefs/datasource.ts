/**
 * Intervention Status Refs Datasource - Tunnel Backend
 *
 * Raw HTTP calls only. Returns unprocessed tunnel-backend responses.
 *
 * @module lib/api/adapters/tunnel/interventionStatusRefs/datasource
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

export const fetchStatusRefsRaw = async () => {
  const response = await tunnelApi.get('/intervention_status');
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
  return list || [];
};
