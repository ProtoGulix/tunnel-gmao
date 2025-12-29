// Adapter for auth domain (Directus)
import * as datasource from './datasource';
import * as mapper from './mapper';

/**
 * Authenticates user and stores tokens in localStorage.
 */
export const login = async (email: string, password: string) => {
  const backendData = await datasource.loginRequest(email, password);
  const tokens = mapper.mapAuthTokensToDomain(backendData);
  
  if (!tokens) {
    throw new Error('Invalid auth response');
  }

  // Store using generic keys only
  localStorage.setItem('auth_access_token', tokens.accessToken);
  if (tokens.refreshToken) {
    localStorage.setItem('auth_refresh_token', tokens.refreshToken);
  }
  localStorage.setItem('login_timestamp', Date.now().toString());

  return tokens;
};

/**
 * Logs out user and clears tokens from localStorage.
 */
export const logout = async () => {
  const refreshToken = localStorage.getItem('auth_refresh_token');
  
  if (refreshToken) {
    await datasource.logoutRequest(refreshToken);
  }
  
  localStorage.removeItem('auth_access_token');
  localStorage.removeItem('auth_refresh_token');
  localStorage.removeItem('login_timestamp');
};

/**
 * Fetches current authenticated user.
 */
export const getCurrentUser = async () => {
  const backendData = await datasource.getCurrentUserRequest();
  const user = mapper.mapAuthUserToDomain(backendData);
  
  if (!user) {
    throw new Error('Invalid user response');
  }
  
  return user;
};

/**
 * Checks if user is authenticated by verifying token existence.
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('auth_access_token');
};

export const authAdapter = {
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
};
