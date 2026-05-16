import { useState, useEffect } from 'react';
import { getAuditReasons, subscribeAuditReasons } from '@/lib/auditReasonsCache';
import type { AuditReason } from '@/lib/auditReasonsCache';

export type { AuditReason };

export function useAuditReasons(): AuditReason[] {
  const [reasons, setReasons] = useState<AuditReason[]>(getAuditReasons);
  useEffect(() => subscribeAuditReasons(setReasons), []);
  return reasons;
}
