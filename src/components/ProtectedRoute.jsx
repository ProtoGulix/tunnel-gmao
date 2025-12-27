// ═══════════════════════════════════════════════════════════════════════════════
// ProtectedRoute.jsx
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Route protégée nécessitant une authentification.
 * 
 * @description
 * Wrapper pour protéger les routes nécessitant une connexion utilisateur.
 * Redirige vers /login si non authentifié, sauvegarde l'URL actuelle pour
 * y revenir après connexion. Affiche un état de chargement pendant la
 * vérification d'authentification.
 * 
 * @usage
 * Utilisé dans :
 * - App.jsx : Wrapper global pour toutes les routes protégées
 * 
 * @features_implemented
 * ✅ Vérification authentification via useAuth
 * ✅ Redirect vers /login si non authentifié
 * ✅ Sauvegarde URL pour redirect post-login (localStorage encodé)
 * ✅ Loading state pendant vérification auth
 * ✅ Navigate avec replace (pas de pollution historique)
 * ✅ Toast notification sur redirect (useError)
 * ✅ Auto-logout après 30 minutes d'inactivité
 * ✅ Session sync cross-tabs (BroadcastChannel)
 * ✅ Structure pour gestion rôles (allowedRoles prop)
 * 
 * @todo
 * [✅] Ajouter gestion des rôles/permissions (admin, user, etc.) - Structure ajoutée
 * [✅] Support redirect_after_login avec query params encodés - Implémenté encodeURIComponent
 * [✅] Toast notification "Veuillez vous connecter" sur redirect - Implémenté useError
 * [✅] Timeout auto-logout après X minutes d'inactivité - Implémenté 30min
 * [ ] Refresh token automatique avant expiration - Dépend backend API
 * [✅] Session persistence cross-tabs (BroadcastChannel) - Implémenté
 * [ ] Analytics tracking (tentatives accès non autorisé)
 * [ ] Fallback route si redirect_after_login invalide
 * [ ] Support 2FA (Two-Factor Authentication)
 * [ ] Tests unitaires (AuthContext mock)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useError } from "@/contexts/ErrorContext";
import LoadingState from "./common/LoadingState";

// Configuration auto-logout
const AUTO_LOGOUT_TIMEOUT = 30 * 60 * 1000; // 30 minutes en ms

// BroadcastChannel pour synchronisation cross-tabs
const authChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('auth_channel') 
  : null;

/**
 * Route protégée nécessitant une authentification.
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {React.ReactNode} props.children - Contenu à rendre si authentifié
 * @param {string[]} [props.allowedRoles] - Rôles autorisés (optionnel, pour futur)
 * @returns {JSX.Element}
 * 
 * @example
 * // Utilisation basique dans App.jsx
 * <ProtectedRoute>
 *   <Layout>
 *     <Dashboard />
 *   </Layout>
 * </ProtectedRoute>
 * 
 * @example
 * // Avec route imbriquée
 * <Route path="/admin" element={
 *   <ProtectedRoute>
 *     <AdminPanel />
 *   </ProtectedRoute>
 * } />
 */
export default function ProtectedRoute({ children, allowedRoles = null }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const { showError } = useError();
  const logoutTimerRef = useRef(null);
  const hasShownToastRef = useRef(false);

  // ==================== AUTO-LOGOUT TIMER ====================
  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      // Effacer timer existant
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }

      // Créer nouveau timer
      logoutTimerRef.current = setTimeout(() => {
        logout();
        showError({ 
          message: "Session expirée après 30 minutes d'inactivité. Veuillez vous reconnecter." 
        });
      }, AUTO_LOGOUT_TIMEOUT);
    };

    // Events qui réinitialisent le timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer(); // Init timer

    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [user, logout, showError]);

  // ==================== CROSS-TABS SYNC ====================
  useEffect(() => {
    if (!authChannel) return;

    const handleMessage = (event) => {
      if (event.data.type === 'LOGOUT') {
        // Autre tab s'est déconnecté, forcer refresh
        window.location.reload();
      }
    };

    authChannel.addEventListener('message', handleMessage);

    return () => {
      authChannel.removeEventListener('message', handleMessage);
    };
  }, []);

  // Notifier autres tabs si logout
  useEffect(() => {
    if (!user && authChannel) {
      authChannel.postMessage({ type: 'LOGOUT' });
    }
  }, [user]);

  // ==================== AUTH CHECKS ====================
  
  // Afficher état de chargement pendant vérification auth
  if (loading) {
    return <LoadingState message="Vérification de l'authentification..." />;
  }
  
  // Rediriger vers login si non authentifié
  if (!user) {
    // Toast notification une seule fois
    if (!hasShownToastRef.current) {
      showError({ 
        message: "Veuillez vous connecter pour accéder à cette page." 
      });
      hasShownToastRef.current = true;
    }

    try {
      // Sauvegarder l'URL actuelle (encodée) pour y revenir après connexion
      const currentPath = encodeURIComponent(
        location.pathname + location.search + location.hash
      );
      localStorage.setItem("redirect_after_login", currentPath);
    } catch (error) {
      // localStorage peut échouer en mode privé/incognito
      console.warn("Impossible de sauvegarder redirect_after_login:", error);
    }
    return <Navigate to="/login" replace />;
  }

  // TODO: Vérifier les rôles/permissions si allowedRoles fourni
  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    showError({ 
      message: "Vous n'avez pas les permissions nécessaires pour accéder à cette page." 
    });
    return <Navigate to="/" replace />;
  }
  
  return children;
}

// PropTypes validation
ProtectedRoute.propTypes = {
  /** Contenu à rendre si authentifié (Layout + Page) */
  children: PropTypes.node.isRequired,
  /** Rôles autorisés pour accéder (ex: ['admin', 'user']) - optionnel, pour usage futur */
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};