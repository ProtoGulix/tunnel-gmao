import { useCallback, useMemo } from 'react'
import { useAuth } from '../../auth/AuthContext'

/**
 * Droits de l'utilisateur connecté (ADR 0007, point 7).
 *
 * `can(code)` teste un code d'endpoint du catalogue (voir auth/permissionCodes.js) dans la
 * liste `permissions` de GET /auth/me ; ADMIN a tous les droits même si un code manque.
 * Ne sert qu'à masquer les actions inutiles : le backend reste la seule barrière.
 */
export function usePermissions() {
  const { user } = useAuth()
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN'
  const permissions = user?.permissions
  const granted = useMemo(() => new Set(permissions ?? []), [permissions])

  const can = useCallback((code) => isAdmin || granted.has(code), [isAdmin, granted])
  return { can, isAdmin }
}
