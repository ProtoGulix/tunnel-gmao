import axios from 'axios';
import { api, BASE_URL } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

/**
 * Directus Auth Adapter
 * Maps Directus responses to domain contracts and isolates technical details.
 */
export const authAdapter = {
  /**
   * @param {string} email
   * @param {string} password
   * @returns {Promise<import("../../../..//domain/auth.contract").AuthTokens>}
   */
  async login(email, password) {
    return apiCall(async () => {
      const { data } = await axios.post(`${BASE_URL}/auth/login`, {
        email: email.trim(),
        password,
      });

      const { access_token, refresh_token } = data.data;

      // Store using generic keys for front; mirror directus_* for current client compatibility
      localStorage.setItem('auth_access_token', access_token);
      localStorage.setItem('auth_refresh_token', refresh_token);
      localStorage.setItem('login_timestamp', Date.now().toString());

      // Backward-compat during migration
      localStorage.setItem('directus_token', access_token);
      localStorage.setItem('directus_refresh_token', refresh_token);

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
      };
    }, 'Auth.login');
  },

  /**
   * @returns {Promise<void>}
   */
  async logout() {
    return apiCall(async () => {
      const refreshToken =
        localStorage.getItem('auth_refresh_token') ||
        localStorage.getItem('directus_refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
      // Backward-compat during migration
      localStorage.removeItem('directus_token');
      localStorage.removeItem('directus_refresh_token');
    }, 'Auth.logout');
  },

  /**
   * @returns {Promise<import("../../../..//domain/auth.contract").AuthUser>}
   */
  async getCurrentUser() {
    return apiCall(async () => {
      const { data } = await api.get('/users/me', {
        params: {
          fields: 'id,email,first_name,last_name,role.id,role.name',
        },
      });

      const u = data.data;
      return {
        id: u.id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        role: u.role ? { id: u.role.id, name: u.role.name } : undefined,
      };
    }, 'Auth.getCurrentUser');
  },

  /**
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!(localStorage.getItem('auth_access_token') || localStorage.getItem('directus_token'));
  },
};
