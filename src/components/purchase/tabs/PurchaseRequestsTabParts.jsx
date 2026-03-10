/**
 * Sous-composants et config colonnes pour PurchaseRequestsTab.
 * @module components/purchase/tabs/PurchaseRequestsTabParts
 */
import { Badge, Flex, Select, Text } from '@radix-ui/themes';
import { AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';
import { PURCHASE_URGENCY, PURCHASE_URGENCY_LIST } from '@/config/purchaseConfig';
import { INTERVENTION_TYPES } from '@/config/interventionTypes';

const INTERVENTION_TYPE_MAP = Object.fromEntries(INTERVENTION_TYPES.map((t) => [t.id, t]));

export function StatusBadge({ derivedStatus }) {
  if (!derivedStatus) return <Text size="1" color="gray">—</Text>;
  const { label, color } = derivedStatus;
  return (
    <Badge
      size="1"
      style={color ? { background: color + '22', color, border: `1px solid ${color}44` } : {}}
    >
      {label}
    </Badge>
  );
}

StatusBadge.propTypes = { derivedStatus: PropTypes.object };

export function InterventionBadge({ code }) {
  if (!code) return <Text size="1" color="gray">—</Text>;
  const typeId = String(code).slice(0, 3).toUpperCase();
  const type = INTERVENTION_TYPE_MAP[typeId];
  return (
    <Badge color={type?.color || 'gray'} variant="soft" size="1">
      {code}
    </Badge>
  );
}

InterventionBadge.propTypes = { code: PropTypes.string };

export const COLUMNS = [
  {
    header: 'Article',
    accessor: (row) => (
      <Flex direction="column" gap="1">
        <Flex align="center" gap="2">
          {row.urgent && <AlertTriangle size={12} color="var(--red-9)" />}
          <Text size="2" weight="medium">{row.item_label}</Text>
        </Flex>
        {row.stock_item_ref && (
          <Badge color="blue" variant="soft" size="1" style={{ width: 'fit-content' }}>
            {row.stock_item_ref}
          </Badge>
        )}
      </Flex>
    ),
  },
  {
    header: 'Qté',
    width: 80,
    accessor: (row) => <Text size="2">{row.quantity} {row.unit || 'pcs'}</Text>,
  },
  {
    header: 'Urgence',
    width: 90,
    accessor: (row) => (
      <Badge color={PURCHASE_URGENCY[row.urgency]?.color || 'gray'} variant="soft" size="1">
        {PURCHASE_URGENCY[row.urgency]?.label || 'Normal'}
      </Badge>
    ),
  },
  {
    header: 'Statut',
    width: 160,
    accessor: (row) => <StatusBadge derivedStatus={row.derived_status} />,
  },
  {
    header: 'Demandeur',
    width: 130,
    accessor: (row) => <Text size="1" color="gray">{row.requested_by || row.requester_name || '—'}</Text>,
  },
  {
    header: 'Intervention',
    width: 160,
    accessor: (row) => <InterventionBadge code={row.intervention_code} />,
  },
];

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
