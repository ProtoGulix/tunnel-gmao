import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';

const ELEVATED_ROLES = ['RESP', 'ADMIN'];

/**
 * Droits de l'utilisateur connecté (ADR 0007, point 7).
 *
 * `can(code)` teste un code d'endpoint du catalogue (voir permissionCodes.js) dans la
 * liste `permissions` de GET /auth/me ; ADMIN a tous les droits même si un code manque.
 * Ne sert qu'à masquer les actions inutiles : le backend reste la seule barrière.
 */
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase() ?? '';
  const isAdmin = role === 'ADMIN';
  const permissions = user?.permissions;
  const granted = useMemo(() => new Set(permissions ?? []), [permissions]);

  // Référence stable tant que les droits ne changent pas (utilisable dans les deps de hooks)
  const can = useCallback((code) => isAdmin || granted.has(code), [isAdmin, granted]);
  const canAny = useCallback((codes) => codes.some(can), [can]);

  return {
    isAdmin,
    isResp: role === 'RESP',
    isElevated: ELEVATED_ROLES.includes(role),
    canSkipObligatory: ELEVATED_ROLES.includes(role),
    hasRole: (roles) => roles.map((r) => r.toUpperCase()).includes(role),
    can,
    canAny,
  };
}
