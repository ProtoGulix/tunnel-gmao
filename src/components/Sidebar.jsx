// ===== IMPORTS =====
// 1. React core
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// 2. React Router
import { Link, useLocation, useNavigate } from 'react-router-dom';

// 3. Icons (Lucide React)
import { LogOut, LogIn } from 'lucide-react';

// 4. Utils
import { checkServerStatus } from '@/lib/serverStatus';

// 5. Config
import { getMenuSections } from '@/config/menuConfig';
import { MOBILE_BREAKPOINT, SIDEBAR_WIDTH, MOBILE_HEADER_HEIGHT } from '@/config/layoutConfig';
import COLOR_PALETTE from '@/config/colorPalette';
import { version as APP_VERSION } from '@/../package.json';
import SidebarActionButton from '@/components/common/SidebarActionButton';

// ===== MAIN COMPONENT =====
/**
 * Sidebar unifié pour l'application - S'adapte selon l'état d'authentification
 * @param {Object} props - Props du composant
 * @param {boolean} props.isAuthenticated - État de connexion utilisateur
 * @param {Object} props.user - Données utilisateur (first_name, last_name)
 * @param {Function} props.onLogout - Callback de déconnexion
 * @param {boolean} [props.isMobile] - Détection mobile externe (optionnel, sinon calculé en interne)
 * @returns {JSX.Element} Sidebar responsive avec navigation
 */
export default function Sidebar({ isAuthenticated, user, onLogout, isMobile: isMobileProp }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [serverStatus, setServerStatus] = useState({
    online: true,
    health: 'ok',
    latencyMs: null,
    lastChecked: null,
  });
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobileInternal, setIsMobileInternal] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  const COLORS = {
    background: '#2E2E2E',
    text: '#E5E9EF',
    textMuted: '#A0A8B5',
    hoverBg: 'rgba(255,255,255,0.1)',
    activeBg: '#3B4F70',
    activeText: '#F8FAFD',
    accent: COLOR_PALETTE.primary,
    accentSoft: '#6D7F97', // primary lightened ~35% for dark backgrounds
    border: 'rgba(255,255,255,0.08)'
  };

  const LOGO_SRC = '/brand/sidebar-mark-duotone.svg';

  const statusColorMap = {
    ok: 'rgba(46, 125, 50, 0.6)',
    degraded: 'rgba(237, 108, 2, 0.6)',
    down: 'rgba(198, 40, 40, 0.65)',
    unknown: 'rgba(160, 168, 181, 0.6)',
  };

  // Utiliser prop isMobile si fournie, sinon state interne
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileInternal;

  // Détecter le redimensionnement de la fenêtre (seulement si isMobile non fourni en prop)
  useEffect(() => {
    if (isMobileProp !== undefined) return; // Skip si contrôlé par parent

    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobileInternal(mobile);
      if (!mobile) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileProp]);

  // Fermer le menu lors du changement de route (mobile)
  useEffect(() => {
    if (isMobile) {
      setMenuOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Vérifier le statut du serveur
  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkServerStatus();
      setServerStatus({
        online: status.online,
        health: status.health || (status.online ? 'ok' : 'down'),
        latencyMs: typeof status.latencyMs === 'number' ? status.latencyMs : null,
        lastChecked: status.lastChecked || new Date().toISOString(),
      });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  // Récupérer les sections du menu selon l'état d'authentification
  const menuSections = getMenuSections(isAuthenticated);

  const latencyLabel = serverStatus.latencyMs !== null ? `${Math.round(serverStatus.latencyMs)} ms` : 'N/A';
  const lastCheckedLabel = serverStatus.lastChecked ? new Date(serverStatus.lastChecked).toLocaleString() : 'N/A';
  const statusColor = statusColorMap[serverStatus.health] || statusColorMap.unknown;
  const statusHaloColor = statusColor.startsWith('rgba')
    ? statusColor.replace(/0\.\d+\)$/,'0.08)')
    : statusColor;
  const statusTooltip = `Latence: ${latencyLabel} | API: ${serverStatus.online ? 'OK' : 'KO'} | Dernier check: ${lastCheckedLabel}`;

  const handleLogoutClick = () => {
    if (logoutConfirm) {
      onLogout();
      return;
    }
    setLogoutConfirm(true);
    setTimeout(() => setLogoutConfirm(false), 2500);
  };

  return (
    <>
      {/* Bouton hamburger (mobile uniquement) */}
      {isMobile && (
        <>
          {/* Header mobile */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '56px',
            background: COLORS.background,
            color: COLORS.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            zIndex: 1000,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.text,
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px'
              }}
              aria-label='Toggle menu'
            >
              {menuOpen ? '✕' : '☰'}
            </button>
            
            <div style={{ 
              fontWeight: '600', 
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <img
                src={LOGO_SRC}
                alt="Tunnel GMAO"
                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
              />
              <span style={{ letterSpacing: '0.5px' }}>TUNNEL</span>
            </div>

            <div style={{ width: '40px' }} />
          </div>

          {/* Overlay pour fermer le menu en cliquant à côté */}
          {menuOpen && (
            <div
              onClick={() => setMenuOpen(false)}
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
      )}

      {/* Sidebar */}
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
        {/* Header desktop uniquement */}
        {!isMobile && (
          <div style={{ 
            padding: '1rem', 
            borderBottom: `1px solid ${COLORS.border}`,
            fontWeight: '600',
            fontSize: '1.1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img
                  src={LOGO_SRC}
                  alt="Tunnel GMAO"
                  style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                />
                <span style={{ letterSpacing: '0.6px' }}>TUNNEL GMAO</span>
              </div>
            </div>
          </div>
        )}

        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {/* Section principale (privée si connecté, publique sinon) */}
          {menuSections.main && (
            <>
              {menuSections.main.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    color: location.pathname === item.path ? COLORS.activeText : COLORS.text,
                    background: location.pathname === item.path ? COLORS.activeBg : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    borderLeft: location.pathname === item.path ? `4px solid ${COLORS.accent}` : '4px solid transparent',
                    fontWeight: location.pathname === item.path ? 700 : 500,
                    boxShadow: location.pathname === item.path ? `inset 0 0 0 1px ${COLORS.border}` : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== item.path) {
                      e.currentTarget.style.background = COLORS.hoverBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== item.path) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <item.icon size={18} />
                  <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
                </Link>
              ))}
            </>
          )}

          {/* Section publique (si connecté, afficher avec séparateur) */}
          {menuSections.public && menuSections.public.length > 0 && (
            <>
              {isAuthenticated && (
                <>
                  <div style={{ 
                    margin: '0.5rem 1rem', 
                    borderTop: `1px solid ${COLORS.border}` 
                  }} />
                  
                  <div style={{ 
                    padding: '0 1rem 0.5rem 1rem', 
                    fontSize: '0.75rem', 
                    color: COLORS.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Accès Public
                  </div>
                </>
              )}

              {menuSections.public.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    color: location.pathname === item.path ? COLORS.activeText : COLORS.text,
                    background: location.pathname === item.path ? COLORS.activeBg : 'rgba(255,255,255,0.02)',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    borderLeft: location.pathname === item.path ? `4px solid ${COLORS.accent}` : '4px solid transparent',
                    fontWeight: location.pathname === item.path ? 700 : 500,
                    boxShadow: location.pathname === item.path ? `inset 0 0 0 1px ${COLORS.border}` : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== item.path) {
                      e.currentTarget.style.background = COLORS.hoverBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== item.path) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <item.icon size={18} />
                  <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Footer - Connexion ou Déconnexion */}
        <div style={{ 
          padding: '1rem', 
          borderTop: `1px solid ${COLORS.border}`,
          fontSize: '0.85rem'
        }}>
          {isAuthenticated ? (
            // Mode connecté - afficher user et déconnexion
            <>
              <div style={{ marginBottom: '0.5rem', color: COLORS.textMuted }}>
                {user?.first_name} {user?.last_name}
              </div>
              <SidebarActionButton
                label={logoutConfirm ? 'Confirmer' : 'Déconnexion'}
                icon={LogOut}
                onClick={handleLogoutClick}
                variant='neutral'
                colors={COLORS}
              />
            </>
          ) : (
            // Mode public - afficher bouton connexion
            <SidebarActionButton
              label='Connexion'
              icon={LogIn}
              onClick={() => navigate('/login')}
              variant='primary'
              colors={COLORS}
            />
          )}

          {/* Version */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: `1px solid ${COLORS.border}`,
            color: COLORS.textMuted,
            fontSize: '0.85rem',
            marginBottom: '0.5rem'
          }}>
            <span>v{APP_VERSION}</span>
            <span
              title={statusTooltip}
              aria-label={statusTooltip}
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: statusColor,
                boxShadow: `0 0 0 4px ${statusHaloColor}`,
                opacity: 0.7
              }}
            />
            <a
              href='https://github.com/ProtoGulix/tunnel-gmao'
              target='_blank'
              rel='noopener noreferrer'
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: COLORS.textMuted,
                textDecoration: 'none',
                transition: 'color 0.2s',
                fontSize: '1.2rem',
                lineHeight: '1'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = COLORS.accent}
              onMouseLeave={(e) => e.currentTarget.style.color = COLORS.textMuted}
              title='GitHub Repository'
            >
              <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor' xmlns='http://www.w3.org/2000/svg'>
                <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'/>
              </svg>
            </a>
          </div>

          {/* Made in France */}
          <div style={{ 
            textAlign: 'center',
            fontSize: '0.65rem',
            color: COLORS.textMuted,
            fontStyle: 'italic',
            letterSpacing: '0.3px'
          }}>
            Fièrement développé en France 🇫🇷
          </div>
        </div>
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
