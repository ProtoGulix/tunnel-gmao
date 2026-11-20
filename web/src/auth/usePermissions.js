import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Droits de l'utilisateur connecté (ADR 0007, point 7).
 *
 * `can(code)` teste un code d'endpoint du catalogue (voir permissionCodes.js) dans la
 * liste `permissions` de GET /auth/me ; ADMIN a tous les droits même si un code manque.
 * `canSkipObligatory` et `canCloseWithoutAction` viennent de `capabilities` (GET /auth/me,
 * ADR 0030) : le front ne connaît pas les rôles concernés, champ absent = refusé.
 * Ne sert qu'à masquer les actions inutiles : le backend reste la seule barrière.
 */
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase() ?? '';
  const isAdmin = role === 'ADMIN';
  const permissions = user?.permissions;
  const capabilities = user?.capabilities;
  const granted = useMemo(() => new Set(permissions ?? []), [permissions]);

  // Référence stable tant que les droits ne changent pas (utilisable dans les deps de hooks)
  const can = useCallback((code) => isAdmin || granted.has(code), [isAdmin, granted]);
  const canAny = useCallback((codes) => codes.some(can), [can]);

  return {
    isAdmin,
    isResp: role === 'RESP',
    canSkipObligatory: capabilities?.skip_obligatory_step === true,
    canCloseWithoutAction: capabilities?.close_task_without_action === true,
    hasRole: (roles) => roles.map((r) => r.toUpperCase()).includes(role),
    can,
    canAny,
  };
}
