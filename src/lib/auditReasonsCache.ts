/**
 * Cache singleton pour les raisons d'audit.
 *
 * L'API retourne audit.reasons dans chaque GET — ce module centralise
 * ces raisons pour éviter des appels séparés à /audit/reasons.
 * Chaque response API qui inclut audit.reasons appelle storeAuditReasons().
 */

export interface AuditReason {
  code: string;
  label: string;
  color: string;
  requires_text?: boolean;
}

type Listener = (reasons: AuditReason[]) => void;

let cached: AuditReason[] = [];
const listeners = new Set<Listener>();

export function storeAuditReasons(reasons: AuditReason[]) {
  if (!reasons.length) return;
  cached = reasons;
  listeners.forEach((fn) => fn(cached));
}

export function getAuditReasons(): AuditReason[] {
  return cached;
}

export function subscribeAuditReasons(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
