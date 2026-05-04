/**
 * Contexte d'authentification — Tunnel GMAO V3
 *
 * JWT souverain : access_token + refresh_token + user (avec role).
 * Le refresh automatique sur 401 est géré par le client HTTP (client.js).
 *
 * @module auth/AuthContext
 */

import { createContext, useState, useEffect } from 'react';
import * as authApi from '@/api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaurer l'utilisateur depuis le cache localStorage au démarrage
    const cached = localStorage.getItem('auth_user');
    if (cached && authApi.isAuthenticated()) {
      try {
        setUser(JSON.parse(cached));
      } catch {
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login(email, password);

    // Le backend retourne { access_token, refresh_token, expires_in, user }
    const { access_token, refresh_token, user: userData } = response;

    localStorage.setItem('auth_access_token', access_token);
    if (refresh_token) {
      localStorage.setItem('auth_refresh_token', refresh_token);
    }
    localStorage.setItem('auth_user', JSON.stringify(userData));

    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignorer les erreurs réseau
    } finally {
      setUser(null);
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_user');
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
