// Directus datasource for auth domain
import axios from 'axios';
import { api, BASE_URL } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

export const loginRequest = async (email: string, password: string) => {
  return apiCall(async () => {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: email.trim(),
      password,
    });
    return response.data?.data;
  }, 'Auth.login');
};

export const logoutRequest = async (refreshToken: string) => {
  return apiCall(async () => {
    await api.post('/auth/logout', { refresh_token: refreshToken });
  }, 'Auth.logout');
};

export const getCurrentUserRequest = async () => {
  return apiCall(async () => {
    const { data } = await api.get('/users/me', {
      params: {
        fields: 'id,email,first_name,last_name,role.id,role.name',
      },
    });
    return data?.data;
  }, 'Auth.getCurrentUser');
};
