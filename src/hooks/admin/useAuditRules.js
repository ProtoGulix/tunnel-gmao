import { useEffect, useState } from 'react';
import * as auditRulesApi from '@/api/adminAuditRules';
import { useFetchList } from '@/hooks/shared/useFetchList';

export function useAuditRules() {
  const { items, setItems, loading, error, refresh } = useFetchList(
    auditRulesApi.fetchAuditRules,
    "Erreur chargement règles d'audit"
  );
  return { items, setItems, loading, error, refresh };
}

export function useAuditReasons() {
  const { items, setItems, loading, error, refresh } = useFetchList(
    auditRulesApi.fetchAuditReasons,
    'Erreur chargement raisons d\'audit'
  );
  return { items, setItems, loading, error, refresh };
}

/**
 * Champs déjà observés pour une entité (règles existantes + historique des
 * modifications), rechargés à chaque changement d'entityType.
 */
export function useAuditKnownFields(entityType) {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entityType) { setFields([]); return; }
    let cancelled = false;
    setLoading(true);
    auditRulesApi.fetchAuditKnownFields(entityType)
      .then((data) => { if (!cancelled) setFields(data); })
      .catch(() => { if (!cancelled) setFields([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [entityType]);

  return { fields, loading };
}
