import { useAuth } from './useAuth';

const ELEVATED_ROLES = ['RESP', 'ADMIN'];

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase() ?? '';

  return {
    isAdmin: role === 'ADMIN',
    isResp: role === 'RESP',
    isElevated: ELEVATED_ROLES.includes(role),
    canSkipObligatory: ELEVATED_ROLES.includes(role),
    hasRole: (roles) => roles.map((r) => r.toUpperCase()).includes(role),
  };
}
