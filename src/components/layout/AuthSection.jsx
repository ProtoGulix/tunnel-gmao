/**
 * @fileoverview Bloc auth du footer sidebar : identité + actions si connecté,
 * bouton de connexion sinon.
 *
 * @module components/layout/AuthSection
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { LogOut, LogIn, UserPen } from 'lucide-react';
import SidebarActionButton from '@/components/layout/SidebarActionButton';
import UserProfileModal from '@/components/profile/UserProfileModal';

function resolveRoleLabel(user) {
  const rawRole = user?.role;
  if (typeof rawRole === 'string') return rawRole;
  return rawRole?.name || rawRole?.label || rawRole?.code || '';
}

function resolveFullName(user) {
  const firstName = user?.first_name ?? user?.firstName ?? '';
  const lastName = user?.last_name ?? user?.lastName ?? '';
  return `${firstName} ${lastName}`;
}

function RoleLabel({ roleLabel, colors }) {
  if (!roleLabel) return null;
  return (
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
  );
}

RoleLabel.propTypes = {
  roleLabel: PropTypes.string.isRequired,
  colors: PropTypes.shape({ textMuted: PropTypes.string.isRequired }).isRequired,
};

function AuthenticatedFooter({ user, logoutConfirm, onLogout, onProfileUpdated, colors }) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <div style={{
        marginBottom: '0.5rem',
        color: colors.text,
        textAlign: 'center',
        fontWeight: 600,
        letterSpacing: '0.2px'
      }}>
        {resolveFullName(user)}
      </div>
      <RoleLabel roleLabel={resolveRoleLabel(user)} colors={colors} />
      <SidebarActionButton
        label='Mon profil'
        icon={UserPen}
        onClick={() => setProfileOpen(true)}
        variant='neutral'
        colors={colors}
      />
      <SidebarActionButton
        label={logoutConfirm ? 'Confirmer' : 'Déconnexion'}
        icon={LogOut}
        onClick={onLogout}
        variant='neutral'
        colors={colors}
      />
      <UserProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user}
        onProfileUpdated={onProfileUpdated}
      />
    </>
  );
}

AuthenticatedFooter.propTypes = {
  user: PropTypes.shape({
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    role: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ name: PropTypes.string, label: PropTypes.string })
    ]),
  }),
  logoutConfirm: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired,
  onProfileUpdated: PropTypes.func.isRequired,
  colors: PropTypes.shape({
    text: PropTypes.string.isRequired,
    textMuted: PropTypes.string.isRequired,
  }).isRequired,
};

/**
 * @component
 */
export default function AuthSection({ isAuthenticated, user, logoutConfirm, onLogout, onLogin, onProfileUpdated, colors }) {
  if (!isAuthenticated) {
    return (
      <SidebarActionButton
        label='Connexion'
        icon={LogIn}
        onClick={onLogin}
        variant='primary'
        colors={colors}
      />
    );
  }

  return (
    <AuthenticatedFooter
      user={user}
      logoutConfirm={logoutConfirm}
      onLogout={onLogout}
      onProfileUpdated={onProfileUpdated}
      colors={colors}
    />
  );
}

AuthSection.propTypes = {
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
  onProfileUpdated: PropTypes.func.isRequired,
  colors: PropTypes.shape({
    text: PropTypes.string.isRequired,
    textMuted: PropTypes.string.isRequired,
  }).isRequired,
};
