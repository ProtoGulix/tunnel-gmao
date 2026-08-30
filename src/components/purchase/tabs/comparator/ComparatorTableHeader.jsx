/**
 * En-tête du tableau comparateur, unifié en 2 lignes alignées sur les colonnes
 * du tableau : la synthèse par panier (total/lignes retenues/délai, avec retrait)
 * juste au-dessus des libellés de colonnes, plus une colonne fantôme pour ajouter
 * un panier (même pattern que GhostCreateRow). Sticky par cellule (et non sur
 * <thead>, non fiable inter-navigateurs) : fond opaque pour masquer les lignes
 * qui défilent dessous.
 * @module components/purchase/tabs/comparator/ComparatorTableHeader
 */
import { Box, Table, Text } from '@radix-ui/themes';
import PropTypes from 'prop-types';
import { formatPrice } from '@/utils/formatPrice';
import GhostAddOrderCell from './GhostAddOrderCell';
import { RemoveButton } from './ComparatorChip';
import { MAX_COMPARED_ORDERS, ORDER_COLUMN_WIDTH } from './comparatorHelpers';

const STICKY_ROW1 = { position: 'sticky', top: 0, zIndex: 2, background: 'var(--color-panel-solid)' };
const STICKY_ROW2 = { position: 'sticky', top: 49, zIndex: 2, background: 'var(--color-panel-solid)' };
// Toutes les colonnes panier (synthèse, fantôme, cellules du corps) partagent cette
// largeur fixe — sinon la colonne fantôme au repos (contenu minimal) se rétrécit et
// désaligne tout le tableau dès qu'un panier vient d'être ajouté ou retiré.
const ORDER_COLUMN_STYLE = { width: ORDER_COLUMN_WIDTH, minWidth: ORDER_COLUMN_WIDTH, maxWidth: ORDER_COLUMN_WIDTH };

function OrderSummaryHeaderCell({ order, total, selectedCount, maxDelay, onRemove }) {
  return (
    <Table.ColumnHeaderCell style={{ ...STICKY_ROW1, ...ORDER_COLUMN_STYLE, verticalAlign: 'top' }}>
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <Text size="1" weight="bold" color="gray" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.order_number}>
          {order.order_number}
        </Text>
        <RemoveButton orderNumber={order.order_number} onRemove={onRemove} />
      </Box>
      <Text size="4" weight="bold" style={{ display: 'block' }}>{formatPrice(total)}</Text>
      <Text size="1" color="gray" style={{ display: 'block' }}>
        {selectedCount} ligne{selectedCount > 1 ? 's' : ''} retenue{selectedCount > 1 ? 's' : ''} · {maxDelay != null ? `${maxDelay} j max` : 'délai —'}
      </Text>
    </Table.ColumnHeaderCell>
  );
}
OrderSummaryHeaderCell.propTypes = {
  order: PropTypes.object.isRequired,
  total: PropTypes.number,
  selectedCount: PropTypes.number.isRequired,
  maxDelay: PropTypes.number,
  onRemove: PropTypes.func.isRequired,
};

export default function ComparatorTableHeader({ orders, totalsByOrderId, selectedCountByOrderId, maxDelayByOrderId, onRemove, candidates, onAddOrder }) {
  const canAddMore = orders.length < MAX_COMPARED_ORDERS;
  return (
    <Table.Header>
      <Table.Row>
        <Table.ColumnHeaderCell style={STICKY_ROW1} />
        <Table.ColumnHeaderCell style={STICKY_ROW1} />
        {orders.map((order) => (
          <OrderSummaryHeaderCell
            key={order.id}
            order={order}
            total={totalsByOrderId[order.id]}
            selectedCount={selectedCountByOrderId[order.id] ?? 0}
            maxDelay={maxDelayByOrderId[order.id]}
            onRemove={() => onRemove(order.id)}
          />
        ))}
        {canAddMore && (
          <Table.ColumnHeaderCell style={{ ...STICKY_ROW1, ...ORDER_COLUMN_STYLE, verticalAlign: 'top' }}>
            <GhostAddOrderCell candidates={candidates} onSelect={onAddOrder} />
          </Table.ColumnHeaderCell>
        )}
      </Table.Row>
      <Table.Row>
        <Table.ColumnHeaderCell style={STICKY_ROW2}>Article</Table.ColumnHeaderCell>
        <Table.ColumnHeaderCell style={{ ...STICKY_ROW2, textAlign: 'right' }}>Qté</Table.ColumnHeaderCell>
        {orders.map((order) => (
          <Table.ColumnHeaderCell key={order.id} style={{ ...STICKY_ROW2, ...ORDER_COLUMN_STYLE }} />
        ))}
        {canAddMore && <Table.ColumnHeaderCell style={{ ...STICKY_ROW2, ...ORDER_COLUMN_STYLE }} />}
      </Table.Row>
    </Table.Header>
  );
}
ComparatorTableHeader.propTypes = {
  orders: PropTypes.array.isRequired,
  totalsByOrderId: PropTypes.object.isRequired,
  selectedCountByOrderId: PropTypes.object.isRequired,
  maxDelayByOrderId: PropTypes.object.isRequired,
  onRemove: PropTypes.func.isRequired,
  candidates: PropTypes.array.isRequired,
  onAddOrder: PropTypes.func.isRequired,
};
