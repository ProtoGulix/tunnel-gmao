import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

// Pages
import Login from '@/pages/Login';
import HomePage from '@/pages/HomePage';

/**
 * Composant de route protégée
 * Redirige vers /login si l'utilisateur n'est pas authentifié
 * 
 * @param {Object} props
 * @param {JSX.Element} props.children - Composant à afficher si authentifié
 * @returns {JSX.Element}
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * Configuration des routes — Tunnel GMAO V3
 * 
 * Routes disponibles :
 * - /login : Page de connexion (publique)
 * - / : Page d'accueil (protégée)
 * 
 * @returns {JSX.Element} Router configuré
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Route publique */}
      <Route path="/login" element={<Login />} />

      {/* Routes protégées */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      {/* Redirection par défaut */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
