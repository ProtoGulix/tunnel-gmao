// ===== IMPORTS =====
// 2. React Router
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 2. Custom Components
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';

// 3. Config
import { PAGES_CONFIG } from '@/config/menuConfig';

// ===== MAIN COMPONENT =====
/**
 * Application principale - Routeur avec routes générées automatiquement
 * @returns {JSX.Element} Application avec toutes les routes configurées
 */
function App() {
  return (
    <Router>
      <Routes>
        {PAGES_CONFIG.map((page) => {
          const Component = page.component;
          
          if (!Component) {
            // TODO: Implémenter un système de logging approprié
            console.warn(`Composant non trouvé: ${page.id}`);
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
      </Routes>
    </Router>
  );
}

export default App;