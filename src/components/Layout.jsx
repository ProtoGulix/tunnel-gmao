/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🏗️ Layout.jsx - Layout principal application (authentifié + public)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Layout wrapper unifié pour toutes les pages de l'application
 * - Mode authentifié : Sidebar avec user + logout (requiresAuth=true)
 * - Mode public : Sidebar sans auth (requiresAuth=false)
 * - Responsive mobile/desktop avec breakpoint 768px
 * - Sidebar 220px desktop, header 56px mobile
 * - Background var(--gray-1) conforme COLOR_PALETTE.md
 * 
 * Utilisé dans :
 * - App.jsx : wrapper automatique pour toutes les routes via PAGES_CONFIG
 * - Routes protégées : <Layout requiresAuth>{children}</Layout>
 * - Routes publiques : <Layout requiresAuth={false}>{children}</Layout>
 * 
 * ✅ Implémenté :
 * - Fusion Layout + PublicLayout (ancien doublon éliminé)
 * - Prop requiresAuth pour contrôler isAuthenticated Sidebar
 * - Hook useMediaQuery custom pour responsive
 * - CSS module pour externaliser styles
 * - Constants layoutConfig (SIDEBAR_WIDTH, MOBILE_BREAKPOINT, etc.)
 * - Cleanup resize listener automatique
 * - Background var(--gray-1) Radix UI
 * - Accessibilité role="main"
 * 
 * 📋 TODO : Améliorations futures
 * - [ ] Dark mode : adapter couleurs background pour thème sombre
 * - [ ] Breadcrumbs : afficher fil d'ariane en haut du main
 * - [ ] Skip to content : lien accessibilité sauter navigation
 * - [ ] Print styles : optimiser layout pour impression
 * - [ ] Sticky header mobile : header collant au scroll
 * - [ ] Animation transition : smooth entre pages (Framer Motion)
 * - [ ] Footer global : ajouter footer en bas de page
 * - [ ] Scroll to top : bouton retour en haut
 * - [ ] Loading bar : barre progression chargement page
 * - [ ] Offline indicator : bannière "Vous êtes hors ligne"
 * - [ ] Layout variants : compact, wide, fullscreen
 * - [ ] Safe area : gérer notch iPhone/Android
 * 
 * @module components/Layout
 * @requires react
 * @requires react-router-dom
 * @requires auth/AuthContext
 * @requires hooks/useMediaQuery
 * @requires config/layoutConfig
 */

import PropTypes from 'prop-types';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import Sidebar from "./Sidebar";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MOBILE_QUERY } from "@/config/layoutConfig";
import styles from './Layout.module.css';

/**
 * Layout principal avec Sidebar + contenu responsive
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {React.ReactNode} props.children - Contenu de la page à afficher
 * @param {boolean} [props.requiresAuth=true] - Mode authentifié (true) ou public (false)
 * @returns {JSX.Element} Layout avec sidebar et contenu
 * 
 * @example
 * // Layout authentifié (par défaut)
 * <Layout>
 *   <DashboardPage />
 * </Layout>
 * 
 * @example
 * // Layout public
 * <Layout requiresAuth={false}>
 *   <LoginPage />
 * </Layout>
 */
export default function Layout({ children, requiresAuth = true }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const isMobile = useMediaQuery(MOBILE_QUERY);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className={styles.container}>
      <Sidebar 
        isAuthenticated={requiresAuth ? true : isAuthenticated} 
        user={user} 
        onLogout={handleLogout}
        isMobile={isMobile}
      />

      <main className={styles.main} role="main" aria-label="Contenu principal">
        {children}
      </main>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  requiresAuth: PropTypes.bool
};