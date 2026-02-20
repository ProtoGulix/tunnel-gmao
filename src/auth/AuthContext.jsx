/**
 * Contexte d'authentification — Tunnel GMAO V3
 * 
 * Gère l'état d'authentification global de l'application.
 * Utilise l'API backend pour login/logout et récupération de l'utilisateur.
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
    const loadUser = async () => {
      if (authApi.isAuthenticated()) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Erreur lors du chargement de l\'utilisateur:', error);
          // Nettoyer les tokens en cas d'erreur
          localStorage.removeItem('auth_access_token');
          localStorage.removeItem('auth_refresh_token');
          localStorage.removeItem('auth_user');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      // Login : le backend configure automatiquement un cookie session_token
      const response = await authApi.login(email, password);
      
      // Optionnel : stocker le token en fallback pour mobile ou cookies désactivés
      if (response.access_token) {
        localStorage.setItem('auth_access_token', response.access_token);
      }
      if (response.refresh_token) {
        localStorage.setItem('auth_refresh_token', response.refresh_token);
      }
      
      // Récupérer les infos utilisateur (le cookie est maintenant actif)
      const userData = await authApi.getCurrentUser();
      setUser(userData);
      
      // Stocker en cache pour éviter un appel au démarrage
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    } finally {
      // Nettoyer le state et localStorage
      // Note : le cookie session_token est géré côté serveur
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
