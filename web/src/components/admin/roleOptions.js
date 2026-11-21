/**
 * @fileoverview Options de rôle des formulaires admin, construites depuis la liste de l'API
 * @module components/admin/roleOptions
 */

// Rôle des clés d'API : l'API refuse de l'attribuer à une personne (ADM-01) ; on ne le propose pas.
const MACHINE_ROLE_CODES = ['MCP'];

/** Rôles proposés (code + libellé) ; `excludeCode` retire le rôle actuel d'un utilisateur. */
export function toRoleOptions(roles, excludeCode) {
  const excluded = excludeCode?.toUpperCase();
  return (Array.isArray(roles) ? roles : [])
    .filter((r) => r?.code && r.code.toUpperCase() !== excluded)
    .filter((r) => !MACHINE_ROLE_CODES.includes(r.code.toUpperCase()))
    .map((r) => ({ value: r.code, label: r.label ? `${r.label} (${r.code})` : r.code }));
}
