import { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { ClipboardList } from 'lucide-react';

// Layout (toujours présent, pas de lazy)
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/layout/PageHeader';
import RequireRole from '@/auth/RequireRole';

// Pages — chargées à la demande
const Login = lazy(() => import('@/pages/auth/Login'));
const HomeSplit = lazy(() => import('@/pages/HomeSplit'));
const HomeBriefing = lazy(() => import('@/pages/HomeBriefing'));
const HomeOld = lazy(() => import('@/pages/home/HomeOld'));
const ServiceStatusPage = lazy(() => import('@/pages/service-status/ServiceStatusPage'));
const QualityDataPage = lazy(() => import('@/pages/quality-data/QualityDataPage'));
const InterventionsListPage = lazy(() => import('@/pages/interventions/InterventionsListPage'));
const InterventionDetailPage = lazy(() => import('@/pages/interventions/InterventionDetailPage'));
const InterventionCreatePage = lazy(() => import('@/pages/interventions/InterventionCreatePage'));
const PurchaseRequestPage = lazy(() => import('@/pages/purchase-requests/PurchaseRequestPage'));
const EquipementsPage = lazy(() => import('@/pages/equipements/EquipementsPage'));
const EquipementDetailPage = lazy(() => import('@/pages/equipements/EquipementDetailPage'));
const StockPage = lazy(() => import('@/pages/stock/StockPage'));
const BriefingPage = lazy(() => import('@/pages/briefing/BriefingPage'));
const PurchaseRequestsPage = lazy(() => import('@/pages/purchase/PurchaseRequestsPage'));
const AdminPreventivePlansPage = lazy(() => import('@/pages/admin/AdminPreventivePlansPage'));
const AdminPreventiveOccurrencesPage = lazy(() => import('@/pages/admin/AdminPreventiveOccurrencesPage'));
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'));
const PreventivePage = lazy(() => import('@/pages/preventive/PreventivePage'));

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
    <Suspense fallback={null}>
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

      {['/briefing', '/briefing/di/:id', '/briefing/iv/:id'].map((path) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <Layout>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                  <PageHeader title="Briefing" subtitle="Avancement des demandes au service technique" icon={ClipboardList} noMargin />
                  <div style={{ flex: 1, minHeight: 0, height: '100%' }}>
                    <BriefingPage />
                  </div>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />
      ))}

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
    </Suspense>
  );
}
