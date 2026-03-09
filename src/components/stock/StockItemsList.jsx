/**
 * @fileoverview Liste des pièces référencées — panneau gauche (table uniquement)
 * @module components/stock/StockItemsList
 */

import PropTypes from 'prop-types';
import { Badge, Flex, Text } from '@radix-ui/themes';
import { Package } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

const columns = [
  {
    key: 'ref',
    header: 'Référence / Nom',
    render: (row) => (
      <Flex direction="column" gap="1" py="1">
        <Badge variant="soft" color="blue">{row.ref}</Badge>
        <Text size="1" color="gray">{row.name}</Text>
      </Flex>
    ),
  },
  {
    key: 'family',
    header: 'Famille',
    width: 75,
    render: (row) => row.family_code
      ? <Badge variant="outline" color="gray" size="1">{row.family_code}</Badge>
      : <Text size="1" color="gray">—</Text>,
  },
  {
    key: 'quantity',
    header: 'Qté',
    width: 70,
    align: 'right',
    render: (row) => (
      <Text size="2" weight="medium" color={row.quantity != null ? undefined : 'gray'}>
        {row.quantity != null ? `${row.quantity}${row.unit ? ` ${row.unit}` : ''}` : '—'}
      </Text>
    ),
  },
  {
    key: 'supplier',
    header: 'Fournisseur',
    width: 130,
    render: (row) => (
      <Text size="1" color="gray" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 125 }}>
        {row.preferred_supplier?.supplier_name ?? '—'}
      </Text>
    ),
  },
];

export default function StockItemsList({ items, loading, selectedId, onSelect, pagination, renderDetail }) {
  return (
    <DataTable
      columns={columns}
      data={items}
      loading={loading}
      onRowClick={onSelect}
      rowStyles={(row) => ({
        cursor: 'pointer',
        background: row.id === selectedId ? 'var(--accent-3)' : undefined,
        boxShadow: row.id === selectedId ? 'inset 3px 0 0 var(--accent-9)' : undefined,
      })}
      isRowExpanded={(row) => row.id === selectedId}
      renderExpandedRow={renderDetail ? () => renderDetail() : undefined}
      emptyState={{ icon: Package, title: 'Aucune pièce', description: 'Aucune pièce ne correspond à la recherche.' }}
      pagination={pagination}
    />
  );
}

StockItemsList.propTypes = {
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  pagination: PropTypes.object,
  renderDetail: PropTypes.func,
};

