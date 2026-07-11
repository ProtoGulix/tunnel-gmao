/**
 * Sous-composants partagés pour les onglets demandes d'achat.
 * @module components/purchase/tabs/PurchaseRequestsTabParts
 */
import { Badge, Flex, Select, Text } from '@radix-ui/themes';
import { AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';
import { PURCHASE_URGENCY, PURCHASE_URGENCY_LIST } from '@/config/purchaseConfig';

// ─── Tuile liste ──────────────────────────────────────────────────────────────

export function PurchaseRequestListItem({ item, isSelected, onClick }) {
  const urgency = PURCHASE_URGENCY[item.urgency] ?? { label: 'Normal', color: 'gray' };
  const statusColor = item.derived_status?.color;
  const statusLabel = item.derived_status?.label;
  const accentColor = statusColor ?? 'var(--gray-6)';
  const demandeur = item.requested_by || item.requester_name;
  const dateStr = item.created_at
    ? new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <div
      onClick={() => onClick(item)}
      style={{
        marginBottom: 8,
        borderRadius: 8,
        border: isSelected ? '1px solid var(--accent-8)' : '1px solid var(--gray-4)',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: isSelected ? '0 0 0 2px var(--accent-4)' : undefined,
      }}
    >
      <Flex align="center" gap="2" style={{ padding: '6px 10px', background: isSelected ? 'var(--accent-3)' : 'var(--gray-3)', borderBottom: '1px solid var(--gray-4)' }}>
        {item.urgent && <AlertTriangle size={12} color="var(--red-9)" />}
        <Text size="2" weight="bold" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--gray-12)' }}>
          {item.item_label}
        </Text>
        <Text size="1" color="gray" style={{ flexShrink: 0, fontFamily: 'monospace' }}>
          {item.quantity} {item.unit || 'pcs'}
        </Text>
      </Flex>

      <Flex align="center" gap="2" style={{ padding: '6px 10px', background: 'var(--color-panel-solid)', borderLeft: `3px solid ${accentColor}` }}>
        {item.part_internal_ref && <Badge color="blue" variant="soft" size="1">{item.part_internal_ref}</Badge>}
        {!item.part_internal_ref && item.stock_item_ref && <Badge color="gray" variant="soft" size="1">{item.stock_item_ref}</Badge>}
        <Badge color={urgency.color} variant="soft" size="1">{urgency.label}</Badge>
        {statusLabel && (
          <Badge size="1" style={statusColor ? { background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44` } : {}}>
            {statusLabel}
          </Badge>
        )}
      </Flex>

      <Flex align="center" justify="between" style={{ padding: '4px 10px', borderTop: '1px solid var(--gray-3)', background: 'var(--gray-2)' }}>
        <Text size="1" color="gray">{demandeur ?? '—'}</Text>
        {dateStr && <Text size="1" color="gray">{dateStr}</Text>}
      </Flex>
    </div>
  );
}

PurchaseRequestListItem.propTypes = {
  item: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};

// ─── Filtres ──────────────────────────────────────────────────────────────────

export function PrFilters({ status, setStatus, statuses, urgency, setUrgency }) {
  return (
    <Flex gap="2" align="center">
      <Select.Root
        value={status || '__all__'}
        onValueChange={(v) => setStatus(v === '__all__' ? '' : v)}
      >
        <Select.Trigger
          placeholder="Tous les statuts"
          variant={status ? 'soft' : 'surface'}
          color={status ? 'blue' : undefined}
        />
        <Select.Content>
          <Select.Item value="__all__">Tous les statuts</Select.Item>
          {statuses.map((s) => (
            <Select.Item key={s.code} value={s.code}>{s.label}</Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <Select.Root
        value={urgency || '__all__'}
        onValueChange={(v) => setUrgency(v === '__all__' ? '' : v)}
      >
        <Select.Trigger
          placeholder="Toutes urgences"
          variant={urgency ? 'soft' : 'surface'}
          color={urgency ? 'orange' : undefined}
        />
        <Select.Content>
          <Select.Item value="__all__">Toutes urgences</Select.Item>
          {PURCHASE_URGENCY_LIST.map((u) => (
            <Select.Item key={u.value} value={u.value}>{u.label}</Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}

PrFilters.propTypes = {
  status: PropTypes.string,
  setStatus: PropTypes.func.isRequired,
  statuses: PropTypes.array.isRequired,
  urgency: PropTypes.string,
  setUrgency: PropTypes.func.isRequired,
};

