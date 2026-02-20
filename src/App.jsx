/**
 * Application principale — Tunnel GMAO V3
 * 
 * Point d'entrée de l'application React.
 * Configure le router et le contexte d'authentification.
 * 
 * @component
 * @returns {JSX.Element} Application complète avec routing et auth
 */

import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import AppRoutes from '@/router/routes';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}