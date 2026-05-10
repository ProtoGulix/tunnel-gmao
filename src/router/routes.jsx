import PropTypes from 'prop-types';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

// Layout
import Layout from '@/components/layout/Layout';

// Pages
import Login from '@/pages/auth/Login';
import HomeSplit from '@/pages/HomeSplit';
import HomeBriefing from '@/pages/HomeBriefing';
import HomeOld from '@/pages/home/HomeOld';
import ServiceStatusPage from '@/pages/service-status/ServiceStatusPage';
import QualityDataPage from '@/pages/quality-data/QualityDataPage';
import InterventionsListPage from '@/pages/interventions/InterventionsListPage';
import InterventionDetailPage from '@/pages/interventions/InterventionDetailPage';
import InterventionCreatePage from '@/pages/interventions/InterventionCreatePage';
import PurchaseRequestPage from '@/pages/purchase-requests/PurchaseRequestPage';
import EquipementsPage from '@/pages/equipements/EquipementsPage';
import EquipementDetailPage from '@/pages/equipements/EquipementDetailPage';
import StockPage from '@/pages/stock/StockPage';
import BriefingPage from '@/pages/briefing/BriefingPage';
import PurchaseRequestsPage from '@/pages/purchase/PurchaseRequestsPage';
import AdminPreventivePlansPage from '@/pages/admin/AdminPreventivePlansPage';
import AdminPreventiveOccurrencesPage from '@/pages/admin/AdminPreventiveOccurrencesPage';
import AdminPage from '@/pages/admin/AdminPage';
import PreventivePage from '@/pages/preventive/PreventivePage';
import RequireRole from '@/auth/RequireRole';

/**
 * Composant de route protégée
 * Redirige vers /login si l'utilisateur n'est pas authentifié
 * 
 * @param {Object} props
 * @param {JSX.Element} props.children - Composant à afficher si authentifié
 * @returns {JSX.Element}
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function InterventionAliasRedirect() {
  const { id } = useParams();
  return <Navigate to={`/intervention/${id}`} replace />;
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

      {/* Route publique - avec layout non authentifié */}
      <Route
        path="/public/purchase-request"
        element={
          <Layout requiresAuth={false}>
            <PurchaseRequestPage />
          </Layout>
        }
      />

      {/* Routes protégées - avec layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <HomeSplit />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/home-briefing"
        element={
          <ProtectedRoute>
            <Layout>
              <HomeBriefing />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/home-old"
        element={
          <ProtectedRoute>
            <Layout>
              <HomeOld />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/service-status"
        element={
          <ProtectedRoute>
            <Layout>
              <ServiceStatusPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/quality-data"
        element={
          <ProtectedRoute>
            <Layout>
              <QualityDataPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/interventions"
        element={
          <ProtectedRoute>
            <Layout>
              <InterventionsListPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/intervention/new"
        element={
          <ProtectedRoute>
            <Layout>
              <InterventionCreatePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/intervention/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <InterventionDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/interventions/:id"
        element={
          <ProtectedRoute>
            <InterventionAliasRedirect />
          </ProtectedRoute>
        }
      />

      <Route
        path="/equipements"
        element={
          <ProtectedRoute>
            <Layout>
              <EquipementsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/equipements/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <EquipementDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/briefing"
        element={
          <ProtectedRoute>
            <Layout>
              <BriefingPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/stock"
        element={
          <ProtectedRoute>
            <Layout>
              <StockPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/suppliers"
        element={
          <ProtectedRoute>
            <Navigate to="/stock?tab=suppliers" replace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/achats"
        element={
          <ProtectedRoute>
            <Layout>
              <PurchaseRequestsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/preventive"
        element={
          <ProtectedRoute>
            <Layout>
              <PreventivePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RequireRole roles={['RESP', 'ADMIN']}>
              <Layout>
                <AdminPage />
              </Layout>
            </RequireRole>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/preventive-plans"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminPreventivePlansPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/preventive-occurrences"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminPreventiveOccurrencesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/intervention-requests"
        element={
          <ProtectedRoute>
            <Navigate to="/interventions?tab=demandes" replace />
          </ProtectedRoute>
        }
      />

      {/* Redirection par défaut */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
