/**
 * @fileoverview Footer de la sidebar avec authentification et version
 *
 * @module components/common/SidebarFooter
 * @requires react
 * @requires prop-types
 * @requires lucide-react
 */

import PropTypes from 'prop-types';
import { LogOut, LogIn } from '@/lib/icons';
import SidebarActionButton from '@/components/common/SidebarActionButton';

const CHANGELOG_URL = 'https://github.com/ProtoGulix/tunnel-gmao/blob/main/docs/CHANGELOG.md';

/**
 * Footer de la sidebar avec connexion/déconnexion et infos
 * @component
 * @param {Object} props
 * @param {boolean} props.isAuthenticated - État de connexion
 * @param {Object} [props.user] - Données utilisateur
 * @param {string} [props.user.first_name] - Prénom
 * @param {string} [props.user.last_name] - Nom
 * @param {boolean} props.logoutConfirm - État de confirmation déconnexion
 * @param {Function} props.onLogout - Callback déconnexion
 * @param {Function} props.onLogin - Callback connexion
 * @param {Object} props.serverStatus - Statut du serveur
 * @param {string} props.appVersion - Version de l'application
 * @param {Object} props.colors - Palette de couleurs
 * @param {Object} props.statusColorMap - Map des couleurs de statut
 * @returns {JSX.Element}
 */
export default function SidebarFooter(props) {
  const {
    isAuthenticated,
    user,
    logoutConfirm,
    onLogout,
    onLogin,
    serverStatus,
    appVersion,
    colors,
    statusColorMap,
  } = props;

  const latencyLabel = serverStatus.latencyMs !== null 
    ? `${Math.round(serverStatus.latencyMs)} ms` 
    : 'N/A';
  const lastCheckedLabel = serverStatus.lastChecked 
    ? new Date(serverStatus.lastChecked).toLocaleString() 
    : 'N/A';
  const statusColor = statusColorMap[serverStatus.health] || statusColorMap.unknown;
  const statusHaloColor = statusColor.startsWith('rgba')
    ? statusColor.replace(/0\.\d+\)$/, '0.08)')
    : statusColor;
  const statusTooltip = `Latence: ${latencyLabel} | API: ${serverStatus.online ? 'OK' : 'KO'} | Dernier check: ${lastCheckedLabel}`;
  const firstName = user?.first_name ?? user?.firstName ?? '';
  const lastName = user?.last_name ?? user?.lastName ?? '';
  const roleLabel = user?.role?.name || user?.role?.label || user?.role || '';

  const openChangelog = () => {
    window.open(CHANGELOG_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ 
      padding: '1rem', 
      borderTop: `1px solid ${colors.border}`,
      fontSize: '0.85rem'
    }}>
      {isAuthenticated ? (
        <>
          <div style={{
            marginBottom: '0.5rem',
            color: colors.text,
            textAlign: 'center',
            fontWeight: 600,
            letterSpacing: '0.2px'
          }}>
            {firstName} {lastName}
          </div>
          {roleLabel && (
            <div style={{
              marginTop: '-0.35rem',
              marginBottom: '0.75rem',
              color: colors.textMuted,
              fontSize: '0.8rem',
              textAlign: 'center',
              letterSpacing: '0.1px'
            }}>
              {roleLabel}
            </div>
          )}
          <SidebarActionButton
            label={logoutConfirm ? 'Confirmer' : 'Déconnexion'}
            icon={LogOut}
            onClick={onLogout}
            variant='neutral'
            colors={colors}
          />
        </>
      ) : (
        <SidebarActionButton
          label='Connexion'
          icon={LogIn}
          onClick={onLogin}
          variant='primary'
          colors={colors}
        />
      )}

      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: `1px solid ${colors.border}`,
        color: colors.textMuted,
        fontSize: '0.85rem',
        marginBottom: '0.5rem'
      }}>
        <button
          type='button'
          onClick={openChangelog}
          title='Voir le changelog'
          aria-label='Voir le changelog'
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            color: colors.textMuted,
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500,
            letterSpacing: '0.2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.15rem',
            opacity: 0.8
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = colors.accentSoft}
          onMouseLeave={(e) => e.currentTarget.style.color = colors.textMuted}
        >
          <span style={{ textDecoration: 'none' }}>v{appVersion}</span>
        </button>
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
            color: colors.textMuted,
            textDecoration: 'none',
            transition: 'color 0.2s',
            fontSize: '1.2rem',
            lineHeight: '1'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
          onMouseLeave={(e) => e.currentTarget.style.color = colors.textMuted}
          title='GitHub Repository'
        >
          <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor' xmlns='http://www.w3.org/2000/svg'>
            <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'/>
          </svg>
        </a>
      </div>

      <div style={{ 
        textAlign: 'center',
        fontSize: '0.65rem',
        color: colors.textMuted,
        fontStyle: 'italic',
        letterSpacing: '0.3px'
      }}>
        Fièrement développé en France 🇫🇷
      </div>
    </div>
  );
}

SidebarFooter.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    role: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        name: PropTypes.string,
        label: PropTypes.string,
      })
    ]),
  }),
  logoutConfirm: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
  serverStatus: PropTypes.shape({
    online: PropTypes.bool.isRequired,
    health: PropTypes.string.isRequired,
    latencyMs: PropTypes.number,
    lastChecked: PropTypes.string,
  }).isRequired,
  appVersion: PropTypes.string.isRequired,
  colors: PropTypes.shape({
    border: PropTypes.string.isRequired,
    textMuted: PropTypes.string.isRequired,
    accent: PropTypes.string.isRequired,
  }).isRequired,
  statusColorMap: PropTypes.objectOf(PropTypes.string).isRequired,
};
