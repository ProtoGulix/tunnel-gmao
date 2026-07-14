/**
 * Sous-composants partagés pour l'onglet paniers fournisseurs.
 * @module components/purchase/tabs/SupplierOrdersTabParts
 */
import { Badge, Flex, Text } from '@radix-ui/themes';
import { Building2, Clock, Package } from 'lucide-react';
import PropTypes from 'prop-types';

const AGE_COLOR_MAP = { gray: 'gray', orange: 'orange', red: 'red' };

// ─── Tuile liste ──────────────────────────────────────────────────────────────

export function SupplierOrderListItem({ item, isSelected, onClick }) {
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
        <Building2 size={13} color="var(--gray-9)" />
        <Text size="2" weight="bold" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--gray-12)' }}>
          {item.supplier?.name || '—'}
        </Text>
        {item.is_blocking && (
          <Badge color={AGE_COLOR_MAP[item.age_color] || 'gray'} variant="soft" size="1">
            <Clock size={10} /> {item.age_days}j
          </Badge>
        )}
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
        <Text size="1" color="gray">
          {item.total_amount != null ? `${Number(item.total_amount).toFixed(2)} €` : '—'}
        </Text>
        {dateStr && <Text size="1" color="gray">{dateStr}</Text>}
      </Flex>
    </div>
  );
}

SupplierOrderListItem.propTypes = {
  item: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};
