// ===== IMPORTS =====
// 1. React Router
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 2. Custom Components
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import NotFound from '@/pages/NotFound';

// 3. Config & Routes
import { PAGES_CONFIG } from '@/config/menuConfig';
import { getRouteComponent } from '@/pages/routes';
import { useAuth } from '@/auth/AuthContext';

// ===== MAIN COMPONENT =====
/**
 * Main application component with auto-generated routes.
 * Configures routing, authentication protection, and error handling.
 *
 * @component
 * @returns {JSX.Element} Application with all configured routes and 404 handling
 *
 * @example
 * // In main.jsx
 * <App />
 */

/**
 * Composant de redirection pour la page d'accueil
 * - Utilisateurs authentifiés → /technician
 * - Utilisateurs publics → /home (PublicHome)
 */
function HomeRedirect() {
  const { user, loading } = useAuth();
  
  // Attendre que l'état d'auth soit vérifié
  if (loading) {
    return null; // Ou une page de chargement
  }
  
  // Si authentifié, aller au pupitre atelier
  if (user) {
    return <Navigate to="/technician" replace />;
  }
  
  // Sinon afficher la page d'accueil publique
  const homePage = PAGES_CONFIG.find(p => p.id === 'home');
  if (!homePage) return <NotFound />;
  
  const Component = getRouteComponent('home');
  return (
    <Layout requiresAuth={false}>
      <Component />
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Route dynamique pour / : authentifié → /technician, public → /home */}
        <Route path="/" element={<HomeRedirect />} />
        
        {/* Autres routes générées automatiquement à partir de PAGES_CONFIG */}
        {PAGES_CONFIG.map((page) => {
          // Ignorer la page home (déjà gérée par HomeRedirect)
          if (page.id === 'home') {
            return null;
          }
          
          const Component = getRouteComponent(page.id);
          
          // Skip pages with missing components (log only in development)
          if (!Component) {
            if (import.meta.env.DEV) {
              console.warn(`Component not found for page: ${page.id}`);
            }
            return null;
          }

          const element = page.requiresAuth ? (
            <ProtectedRoute>
              <Layout requiresAuth>
                <Component />
              </Layout>
            </ProtectedRoute>
          ) : (
            <Layout requiresAuth={false}>
              <Component />
            </Layout>
          );

          return <Route key={page.id} path={page.path} element={element} />;
        })}
        
        {/* 404 - Catch all unknown routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;