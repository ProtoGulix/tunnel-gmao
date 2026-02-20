/**
 * Auth Datasource - Tunnel Backend
 *
 * Raw HTTP calls only. Returns unprocessed tunnel-backend responses.
 *
 * @module lib/api/adapters/tunnel/auth/datasource
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { tunnelApi } from '../client';

export const loginRaw = async (email: string, password: string) => {
  const { data } = await tunnelApi.post('/auth/login', { email, password, mode: 'session' });
  return data?.data || data;
};

export const logoutRaw = async () => {
  localStorage.removeItem('auth_access_token');
  localStorage.removeItem('auth_refresh_token');
};
