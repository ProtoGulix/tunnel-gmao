import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "@/lib/api/facade";
import { loadAnomalyConfig } from "@/config/anomalyConfig";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (auth.isAuthenticated()) {
        try {
          const userData = await auth.getCurrentUser();
          setUser(userData);
          // Load anomaly config after successful authentication
          loadAnomalyConfig().catch(console.error);
        } catch (error) {
          console.error("Erreur lors du chargement de l'utilisateur:", error);
          // Clear generic tokens; client will handle redirects on 401
          localStorage.removeItem("auth_access_token");
          localStorage.removeItem("auth_refresh_token");
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      await auth.login(email, password);
      const userData = await auth.getCurrentUser();
      setUser(userData);
      // Load anomaly config after successful login
      loadAnomalyConfig().catch(console.error);
      return userData;
    } catch (error) {
      console.error("Erreur de connexion:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
      setUser(null);
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
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

// Hook personnalisé - doit être exporté séparément
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
