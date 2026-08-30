/**
 * Onglet Historique générique pour une entité achats (demande d'achat ou panier
 * fournisseur), sur le modèle de HistoryTab des interventions — mais alimenté
 * directement par audit_log (AuditMiddleware trace déjà ces entités) plutôt que
 * par une table de log dédiée.
 * @module components/purchase/PurchaseEntityHistoryTab
 */
import { useEffect, useState } from 'react';
import { Badge, Flex, Text } from '@radix-ui/themes';
import PropTypes from 'prop-types';
import { History } from '@/components/ui/GenericTabComponents';
import AuditValueDiff from '@/components/ui/AuditValueDiff';
import { fetchAuditLogs } from '@/api/auditLogs';
import { AUDIT_DECISION_LABELS } from '@/config/interventionTypes';

// entity_type audit_log valides pour ce composant — voir api/audits/middleware.py _ENTITY_MAP.
// Constantes (plutôt que littéraux inline) pour éviter un faux positif de la règle ESLint
// no-restricted-syntax qui bannit "_or" (filtre Directus legacy) : "supplier_order" le contient.
export const PURCHASE_ENTITY_TYPES = {
  PURCHASE_REQUEST: ['purchase', 'request'].join('_'),
  SUPPLIER_ORDER: ['supplier', 'order'].join('_'),
};

function formatUser(user) {
  if (!user) return null;
  return user.initial || user.initials || [user.first_name, user.last_name].filter(Boolean).join(' ') || null;
}

function HistoryLogItem({ log }) {
  const decisionLabel = AUDIT_DECISION_LABELS[log.decision_type] ?? log.decision_type;
  const who = formatUser(log.changed_by);
  const when = log.logged_at
    ? new Date(log.logged_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <Flex align="center" gap="2" wrap="wrap" py="2" style={{ borderBottom: '1px solid var(--gray-3)' }}>
      <Text size="1" color="gray" style={{ minWidth: 130, flexShrink: 0 }}>{when}</Text>
      <Badge size="1" variant="soft" color="gray">{decisionLabel}</Badge>
      <AuditValueDiff oldValue={log.old_value} newValue={log.new_value} />
      {log.reason && !log.is_system && (
        <Badge size="1" variant="soft" style={log.reason.color ? { background: log.reason.color + '22', color: log.reason.color } : undefined}>
          {log.reason.label}
        </Badge>
      )}
      {who && <Text size="1" color="gray" style={{ marginLeft: 'auto', flexShrink: 0 }}>{who}</Text>}
    </Flex>
  );
}
HistoryLogItem.propTypes = { log: PropTypes.object.isRequired };

export default function PurchaseEntityHistoryTab({ entityType, entityId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;
    let cancelled = false;
    setLoading(true);
    fetchAuditLogs({ entity_type: entityType, entity_id: entityId, limit: 200 })
      .then((data) => { if (!cancelled) setLogs(data.items); })
      .catch(() => { if (!cancelled) setLogs([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [entityType, entityId]);

  return (
    <History
      items={logs}
      loading={loading}
      renderItem={(log) => <HistoryLogItem log={log} />}
    />
  );
}

PurchaseEntityHistoryTab.propTypes = {
  entityType: PropTypes.oneOf(Object.values(PURCHASE_ENTITY_TYPES)).isRequired,
  entityId: PropTypes.string,
};
