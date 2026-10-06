/**
 * Cellules "identité article" (référence, fabricant, désignation) + quantité,
 * communes à toutes les colonnes paniers d'une ligne du tableau comparateur.
 * @module components/purchase/tabs/comparator/ComparatorArticleCell
 */
import { Badge, Flex, Table, Text } from '@radix-ui/themes';
import PropTypes from 'prop-types';

function StockRefBadge({ anyLine }) {
  if (!anyLine?.stock_item_ref) return null;
  return (
    <Badge color={anyLine.part_id ? 'blue' : 'gray'} variant="soft" size="1" style={{ fontFamily: 'monospace', opacity: 0.8 }}>
      {anyLine.stock_item_ref}
    </Badge>
  );
}
StockRefBadge.propTypes = { anyLine: PropTypes.object };

function ManufacturerLine({ anyLine }) {
  if (!anyLine?.manufacturer?.name) return null;
  return (
    <Text size="1" color="gray">{anyLine.manufacturer.name}{anyLine.manufacturer.ref ? ` · ${anyLine.manufacturer.ref}` : ''}</Text>
  );
}
ManufacturerLine.propTypes = { anyLine: PropTypes.object };

export function ArticleCell({ row }) {
  const anyLine = Object.values(row.linesByOrderId).find(Boolean);
  return (
    <Table.Cell style={{ verticalAlign: 'middle', minWidth: 200 }}>
      <Flex align="center" gap="2">
        <StockRefBadge anyLine={anyLine} />
        <Text size="2" weight="medium">{anyLine?.stock_item_name || '—'}</Text>
      </Flex>
      <ManufacturerLine anyLine={anyLine} />
    </Table.Cell>
  );
}
ArticleCell.propTypes = { row: PropTypes.object.isRequired };

export function QtyCell({ row }) {
  const anyLine = Object.values(row.linesByOrderId).find(Boolean);
  return (
    <Table.Cell style={{ verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
      <Text size="2" weight="medium">{anyLine?.quantity ?? '—'}</Text>
      <Text size="1" color="gray"> {anyLine?.stock_item_unit || 'pcs'}</Text>
    </Table.Cell>
  );
}
QtyCell.propTypes = { row: PropTypes.object.isRequired };
