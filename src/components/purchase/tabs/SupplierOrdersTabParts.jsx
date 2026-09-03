/**
 * Sous-composants partagés pour l'onglet paniers fournisseurs.
 * @module components/purchase/tabs/SupplierOrdersTabParts
 */
import { Badge, Flex, Select, Text } from '@radix-ui/themes';
import { Building2, Clock, Package } from 'lucide-react';
import PropTypes from 'prop-types';
import { formatPrice } from '@/utils/formatPrice';
import { TERMINAL_SUPPLIER_ORDER_STATUSES } from '@/hooks/purchase/useSupplierOrders';
import { ACTIVE_STATUS_FILTER } from '@/hooks/purchase/useSupplierOrderFilters';

// ─── Filtre statut (select) ─────────────────────────────────────────────────────

function StatusSelectItem({ status, facets, isMember }) {
  return (
    <Select.Item
      value={status.code}
      style={isMember ? { paddingLeft: 30 } : undefined}
    >
      <Flex align="center" gap="2">
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: status.color,
          display: 'inline-block', flexShrink: 0,
        }} />
        <Text size="2">{status.label}</Text>
        {facets[status.code] != null && (
          <Badge color={status.radixColor} variant="soft" size="1">{facets[status.code]}</Badge>
        )}
      </Flex>
    </Select.Item>
  );
}
StatusSelectItem.propTypes = {
  status: PropTypes.object.isRequired,
  facets: PropTypes.object.isRequired,
  isMember: PropTypes.bool,
};

export function StatusSelect({ statusList, facets, activeTab, onChange }) {
  // Les statuts non terminaux sont "membres" du filtre virtuel "Actifs" — regroupés
  // visuellement sous lui (fond teinté + repère de rattachement), séparés des
  // statuts terminaux (Clôturé, Annulé) qui n'en font pas partie.
  const members = statusList.filter(
    (s) => s.code !== ACTIVE_STATUS_FILTER && !TERMINAL_SUPPLIER_ORDER_STATUSES.includes(s.code)
  );
  const others = statusList.filter(
    (s) => s.code !== ACTIVE_STATUS_FILTER && TERMINAL_SUPPLIER_ORDER_STATUSES.includes(s.code)
  );
  const activeStatus = statusList.find((s) => s.code === ACTIVE_STATUS_FILTER);

  return (
    <Flex direction="column" gap="1">
      <Text size="1" color="gray">Filtrer par statut</Text>
      <Select.Root value={activeTab} onValueChange={onChange}>
        <Select.Trigger variant="surface" style={{ width: '100%' }} />
        <Select.Content>
          {activeStatus && <StatusSelectItem status={activeStatus} facets={facets} />}
          {members.map((s) => <StatusSelectItem key={s.code} status={s} facets={facets} isMember />)}
          <Select.Separator />
          {others.map((s) => <StatusSelectItem key={s.code} status={s} facets={facets} />)}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}

StatusSelect.propTypes = {
  statusList: PropTypes.array.isRequired,
  facets: PropTypes.object.isRequired,
  activeTab: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

// ─── Filtre fournisseur (select) ─────────────────────────────────────────────────

const ALL_SUPPLIERS = '__all__';

export function SupplierFilterSelect({ suppliers, value, onChange }) {
  return (
    <Flex direction="column" gap="1">
      <Text size="1" color="gray">Filtrer par fournisseur</Text>
      <Select.Root
        value={value || ALL_SUPPLIERS}
        onValueChange={(v) => onChange(v === ALL_SUPPLIERS ? '' : v)}
      >
        <Select.Trigger variant="surface" style={{ width: '100%' }} />
        <Select.Content>
          <Select.Item value={ALL_SUPPLIERS}>Tous les fournisseurs</Select.Item>
          {suppliers.map((s) => <Select.Item key={s.id} value={s.id}>{s.name}</Select.Item>)}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}

SupplierFilterSelect.propTypes = {
  suppliers: PropTypes.array.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

const AGE_COLOR_MAP = { gray: 'gray', orange: 'orange', red: 'red' };

function cardStyle(isSelected) {
  return {
    marginBottom: 8,
    borderRadius: 8,
    border: isSelected ? '1px solid var(--accent-8)' : '1px solid var(--gray-4)',
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: isSelected ? '0 0 0 2px var(--accent-4)' : undefined,
  };
}

function formatOrderDate(createdAt) {
  if (!createdAt) return null;
  return new Date(createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function AgeBadge({ item }) {
  if (!item.is_blocking) return null;
  return (
    <Badge color={AGE_COLOR_MAP[item.age_color] || 'gray'} variant="soft" size="1">
      <Clock size={10} /> {item.age_days}j
    </Badge>
  );
}
AgeBadge.propTypes = { item: PropTypes.object.isRequired };

function OrderStatusBadge({ statusInfo }) {
  if (!statusInfo) return null;
  return (
    <Badge color={statusInfo.radixColor} variant="soft" size="1">
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusInfo.color, display: 'inline-block' }} />
      {statusInfo.label}
    </Badge>
  );
}
OrderStatusBadge.propTypes = { statusInfo: PropTypes.object };

// ─── Tuile liste ──────────────────────────────────────────────────────────────

export function SupplierOrderListItem({ item, isSelected, onClick, statusMap = {} }) {
  const dateStr = formatOrderDate(item.created_at);
  const statusInfo = statusMap[item.status];
  const headerBg = isSelected ? 'var(--accent-3)' : 'var(--gray-3)';

  return (
    <div onClick={() => onClick(item)} style={cardStyle(isSelected)}>
      <Flex align="center" gap="2" style={{ padding: '6px 10px', background: headerBg, borderBottom: '1px solid var(--gray-4)' }}>
        <Building2 size={13} color="var(--gray-9)" />
        <Text size="2" weight="bold" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--gray-12)' }}>
          {item.supplier?.name || '—'}
        </Text>
        <OrderStatusBadge statusInfo={statusInfo} />
        <AgeBadge item={item} />
      </Flex>

      <Flex align="center" gap="2" style={{ padding: '6px 10px', background: 'var(--color-panel-solid)' }}>
        <Text size="2" color="gray" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.order_number}
        </Text>
        <Flex align="center" gap="1">
          <Package size={12} color="var(--gray-9)" />
          <Text size="1" color="gray">{item.line_count ?? 0}</Text>
        </Flex>
      </Flex>

      <Flex align="center" justify="between" style={{ padding: '4px 10px', borderTop: '1px solid var(--gray-3)', background: 'var(--gray-2)' }}>
        <Text size="1" color="gray">{formatPrice(item.total_amount)}</Text>
        {dateStr && <Text size="1" color="gray">{dateStr}</Text>}
      </Flex>
    </div>
  );
}

SupplierOrderListItem.propTypes = {
  item: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  statusMap: PropTypes.object,
};
