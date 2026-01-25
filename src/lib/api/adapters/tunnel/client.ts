/**
 * Tunnel Backend HTTP Client
 *
 * Centralized axios instance for all tunnel-backend datasources.
 * Handles authentication, headers, and interceptors.
 *
 * @module lib/api/adapters/tunnel/client
 */

import axios from 'axios';

const TUNNEL_BACKEND_URL = import.meta.env.VITE_TUNNEL_BACKEND_URL || 'http://localhost:8000';

export const tunnelApi = axios.create({
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

export const BASE_URL = TUNNEL_BACKEND_URL;
