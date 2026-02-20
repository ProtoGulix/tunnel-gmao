/**
 * @fileoverview Sidebar unifié avec navigation adaptative selon authentification
 *
 * Barre latérale responsive avec menu dynamique, statut serveur et gestion d'authentification.
 * S'adapte automatiquement entre mobile et desktop avec menu hamburger.
 *
 * @module components/Sidebar
 * @requires react
 * @requires prop-types
 * @requires react-router-dom
 * @requires lucide-react
 */

// ===== IMPORTS =====
// 1. React core
import { useState } from 'react';
import PropTypes from 'prop-types';

// 2. React Router
import { useNavigate } from 'react-router-dom';

// 3. Components
import MobileHeader from '@/components/common/MobileHeader';
import SidebarMenuItem from '@/components/common/SidebarMenuItem';
import SidebarFooter from '@/components/common/SidebarFooter';
import BrandLogo from '@/components/common/BrandLogo';

// 4. Config
import { getMenuSections } from '@/config/menuConfig';
import { MOBILE_BREAKPOINT, SIDEBAR_WIDTH, MOBILE_HEADER_HEIGHT } from '@/config/layoutConfig';
import COLOR_PALETTE from '@/config/colorPalette';
import { version as APP_VERSION } from '@/../package.json';

// 5. Hooks
import { useSidebarState } from './common/useSidebarState';

// ===== CONSTANTES =====
const COLORS = {
  background: '#2E2E2E',
  text: '#E5E9EF',
  textMuted: '#A0A8B5',
  hoverBg: 'rgba(255,255,255,0.1)',
  activeBg: '#3B4F70',
  activeText: '#F8FAFD',
  accent: COLOR_PALETTE.primary,
  accentSoft: '#6D7F97',
  border: 'rgba(255,255,255,0.08)'
};

const STATUS_COLOR_MAP = {
  ok: 'rgba(46, 125, 50, 0.6)',
  degraded: 'rgba(237, 108, 2, 0.6)',
  down: 'rgba(198, 40, 40, 0.65)',
  unknown: 'rgba(160, 168, 181, 0.6)',
};

const LOGOUT_CONFIRM_DELAY = 2500;

// ===== HELPERS =====

/**
 * Render mobile header with overlay
 * @param {boolean} isMobile - Mobile flag
 * @param {boolean} menuOpen - Menu open state
 * @param {Function} onToggle - Toggle handler
 * @param {Function} onClose - Close handler
 * @param {Object} colors - Color configuration
 * @returns {JSX.Element|null} Mobile header or null
 */
const renderMobileHeader = (isMobile, menuOpen, onToggle, onClose, colors) => {
  if (!isMobile) return null;
  
  return (
    <>
      <MobileHeader menuOpen={menuOpen} onToggle={onToggle} colors={colors} />
      {menuOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
          }}
        />
      )}
    </>
  );
};

/**
 * Render desktop header
 * @param {boolean} isMobile - Mobile flag
 * @param {Object} colors - Color configuration
 * @returns {JSX.Element|null} Desktop header or null
 */
const renderDesktopHeader = (isMobile, colors) => {
  if (isMobile) return null;
  
  return (
    <div style={{ 
      padding: '1rem', 
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    }}>
      <BrandLogo size="desktop" showTitle={true} />
    </div>
  );
};

/**
 * Render public section separator
 * @param {boolean} isAuthenticated - Authentication state
 * @param {Object} colors - Color configuration
 * @returns {JSX.Element|null} Separator or null
 */
const renderPublicSeparator = (isAuthenticated, colors) => {
  if (!isAuthenticated) return null;
  
  return (
    <>
      <div style={{ 
        margin: '0.5rem 1rem', 
        borderTop: `1px solid ${colors.border}` 
      }} />
      
      <div style={{ 
        padding: '0 1rem 0.5rem 1rem', 
        fontSize: '0.75rem', 
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Accès Public
      </div>
    </>
  );
};

// ===== MAIN COMPONENT =====
/**
 * Sidebar unifié pour l'application - S'adapte selon l'état d'authentification
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isAuthenticated - État de connexion utilisateur
 * @param {Object} [props.user] - Données utilisateur (first_name, last_name)
 * @param {Function} props.onLogout - Callback de déconnexion
 * @param {boolean} [props.isMobile] - Détection mobile externe (optionnel)
 * @returns {JSX.Element} Sidebar responsive avec navigation
 *
 * @example
 * <Sidebar
 *   isAuthenticated={true}
 *   user={{ first_name: 'John', last_name: 'Doe' }}
 *   onLogout={handleLogout}
 * />
 */
export default function Sidebar({ isAuthenticated, user, onLogout, isMobile: isMobileProp }) {
  const navigate = useNavigate();
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Hook personnalisé pour gérer les effets et l'état
  const { serverStatus, isMobile } = useSidebarState(isMobileProp, setMenuOpen, MOBILE_BREAKPOINT);

  // Récupérer les sections du menu selon l'état d'authentification
  const menuSections = getMenuSections(isAuthenticated);

  const handleLogoutClick = () => {
    if (logoutConfirm) {
      onLogout();
      return;
    }
    setLogoutConfirm(true);
    setTimeout(() => setLogoutConfirm(false), LOGOUT_CONFIRM_DELAY);
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);
  const handleLogin = () => navigate('/login');

  return (
    <>
      {renderMobileHeader(isMobile, menuOpen, toggleMenu, closeMenu, COLORS)}

      <aside style={{
        width: `${SIDEBAR_WIDTH}px`,
        background: COLORS.background,
        color: COLORS.text,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        left: isMobile ? (menuOpen ? 0 : `-${SIDEBAR_WIDTH}px`) : 0,
        top: isMobile ? `${MOBILE_HEADER_HEIGHT}px` : 0,
        zIndex: 999,
        transition: 'left 0.3s ease',
        boxShadow: isMobile && menuOpen ? '2px 0 8px rgba(0,0,0,0.3)' : 'none'
      }}>
        {renderDesktopHeader(isMobile, COLORS)}

        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {menuSections.main && menuSections.main.map((item) => (
            <SidebarMenuItem key={item.id} item={item} colors={COLORS} />
          ))}

          {menuSections.public && menuSections.public.length > 0 && (
            <>
              {renderPublicSeparator(isAuthenticated, COLORS)}
              {menuSections.public.map((item) => (
                <SidebarMenuItem key={item.id} item={item} colors={COLORS} isPublic />
              ))}
            </>
          )}
        </nav>

        <SidebarFooter
          isAuthenticated={isAuthenticated}
          user={user}
          logoutConfirm={logoutConfirm}
          onLogout={handleLogoutClick}
          onLogin={handleLogin}
          serverStatus={serverStatus}
          appVersion={APP_VERSION}
          colors={COLORS}
          statusColorMap={STATUS_COLOR_MAP}
        />
      </aside>
    </>
  );
}

// ===== PROP TYPES =====
Sidebar.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    first_name: PropTypes.string,
    last_name: PropTypes.string,
  }),
  onLogout: PropTypes.func.isRequired,
  isMobile: PropTypes.bool, // Optionnel : détection mobile externe (Layout.jsx)
};
