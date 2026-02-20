/**
 * Auth Adapter - Tunnel Backend
 *
 * Backend-agnostic domain interface. Orchestrates datasource + mapper.
 *
 * @module lib/api/adapters/tunnel/auth/adapter
 */

import { apiCall } from '@/lib/api/errors';
import { clearAllCache } from '@/lib/api/client';
import * as datasource from './datasource';
import * as mapper from './mapper';

export const authAdapter = {
  async login(email: string, password: string) {
    return apiCall(async () => {
      const raw = await datasource.loginRaw(email, password);
      return mapper.mapAuthTokens(raw);
    }, 'TunnelAuth.login');
  },

  async logout() {
    return apiCall(async () => {
      await datasource.logoutRaw();
      clearAllCache();
    }, 'TunnelAuth.logout');
  },

  async getCurrentUser() {
    throw new Error('getCurrentUser not implemented for tunnel-backend');
  },

  async refreshToken() {
    throw new Error('refreshToken not implemented for tunnel-backend');
  },
};
