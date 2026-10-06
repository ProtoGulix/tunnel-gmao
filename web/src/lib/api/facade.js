import { login, logout, isAuthenticated, getMe, refreshToken } from '@/api/auth';

export const auth = {
  login: async (email, password) => {
    const data = await login(email, password);
    if (data?.access_token) {
      localStorage.setItem('auth_access_token', data.access_token);
    }
    if (data?.refresh_token) {
      localStorage.setItem('auth_refresh_token', data.refresh_token);
    }
    return data;
  },

  logout: async () => {
    await logout();
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
  },

  getCurrentUser: () => getMe(),

  isAuthenticated,

  refreshToken,
};
