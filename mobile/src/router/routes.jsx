import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import AppShell from '../components/layout/AppShell'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import LoginPage from '../pages/LoginPage'
import HomePage from '../pages/home/HomePage'
import InterventionsPage from '../pages/interventions/InterventionsPage'
import InterventionDetailPage from '../pages/interventions/InterventionDetailPage'
import AddActionPage from '../pages/interventions/AddActionPage'
import AddPurchasePage from '../pages/interventions/AddPurchasePage'
import StockPage from '../pages/stock/StockPage'
import InterventionRequestsPage from '../pages/intervention-requests/InterventionRequestsPage'
import EquipementsPage from '../pages/equipements/EquipementsPage'
import QrCodePage from '../pages/qrcode/QrCodePage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <PrivateRoute>
          <AppShell />
        </PrivateRoute>
      }>
        <Route index element={<ErrorBoundary><HomePage /></ErrorBoundary>} />

        {/* Interventions — ?tab=planning|liste|demandes */}
        <Route path="interventions" element={<ErrorBoundary><InterventionsPage /></ErrorBoundary>} />
        <Route path="interventions/:id" element={<ErrorBoundary><InterventionDetailPage /></ErrorBoundary>} />
        <Route path="interventions/:id/add-action" element={<ErrorBoundary><AddActionPage /></ErrorBoundary>} />
        <Route path="interventions/:id/add-purchase" element={<ErrorBoundary><AddPurchasePage /></ErrorBoundary>} />

        {/* Demandes d'intervention */}
        <Route path="intervention-requests" element={<ErrorBoundary><InterventionRequestsPage /></ErrorBoundary>} />
        <Route path="intervention-requests/:requestId" element={<ErrorBoundary><InterventionRequestsPage /></ErrorBoundary>} />

        {/* Compatibilité anciennes routes */}
        <Route path="demande-intervention" element={<Navigate to="/intervention-requests" replace />} />
        <Route path="achats" element={<Navigate to="/stock" replace />} />

        {/* Stock — ?tab=stock|achats, détail article via /stock/items/:id?purchase=1 */}
        <Route path="stock" element={<ErrorBoundary><StockPage /></ErrorBoundary>} />
        <Route path="stock/items/:itemId" element={<ErrorBoundary><StockPage /></ErrorBoundary>} />

        {/* Équipements — UUID dans l'URL pour QR code */}
        <Route path="equipements" element={<ErrorBoundary><EquipementsPage /></ErrorBoundary>} />
        <Route path="equipements/:uuid" element={<ErrorBoundary><EquipementsPage /></ErrorBoundary>} />

        {/* QR Code */}
        <Route path="qrcode" element={<ErrorBoundary><QrCodePage /></ErrorBoundary>} />

        {/* 404 */}
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center h-full px-6 text-center bg-[#F4F6F8]">
            <p className="text-base font-semibold text-[#2E2E2E] mb-1">Page introuvable</p>
            <p className="text-xs text-[#616161]">Cette URL n'existe pas.</p>
          </div>
        } />
      </Route>
    </Routes>
  )
}
