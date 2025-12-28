// ===== IMPORTS =====
// 1. React Router
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 2. Custom Components
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import NotFound from '@/pages/NotFound';

// 3. Config & Routes
import { PAGES_CONFIG } from '@/config/menuConfig';
import { getRouteComponent } from '@/pages/routes';

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
function App() {
  return (
    <Router>
      <Routes>
        {PAGES_CONFIG.map((page) => {
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