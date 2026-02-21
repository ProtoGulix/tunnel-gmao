import PropTypes from 'prop-types';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

// Layout
import Layout from '@/components/layout/Layout';

// Pages
import Login from '@/pages/auth/Login';
import HomePage from '@/pages/home/HomePage';

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

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

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
      {/* Route publique - sans layout */}
      <Route path="/login" element={<Login />} />

      {/* Routes protégées - avec layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <HomePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Redirection par défaut */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
