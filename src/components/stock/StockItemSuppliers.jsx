/**
 * @fileoverview Section fournisseurs du détail d'une pièce référencée
 * @module components/stock/StockItemSuppliers
 */

import PropTypes from 'prop-types';
import { Badge, Box, Flex, Separator, Text } from '@radix-ui/themes';
import { Star } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

const SUPPLIER_COLUMNS = [
  {
    key: 'name',
    header: 'Fournisseur',
    render: (row) => (
      <Flex align="center" gap="1">
        {row.is_preferred && <Star size={11} fill="var(--amber-9)" color="var(--amber-9)" />}
        <Text size="2" weight={row.is_preferred ? 'medium' : 'regular'}>{row.supplier_name}</Text>
      </Flex>
    ),
  },
  {
    key: 'ref',
    header: 'Réf. fourn.',
    render: (row) => <Badge variant="soft" color="indigo" size="1">{row.supplier_ref}</Badge>,
  },
  {
    key: 'manufacturer',
    header: 'Réf. fabricant',
    render: (row) => row.manufacturer_item ? (
      <Flex direction="column" gap="0">
        <Badge variant="soft" color="violet" size="1">{row.manufacturer_item.manufacturer_ref}</Badge>
        <Text size="1" color="gray">{row.manufacturer_item.manufacturer_name}</Text>
      </Flex>
    ) : <Text size="1" color="gray">—</Text>,
  },
  {
    key: 'price',
    header: 'Prix unit.',
    align: 'right',
    render: (row) => <Text size="2">{row.unit_price != null ? `${row.unit_price} €` : '—'}</Text>,
  },
  {
    key: 'moq',
    header: 'Qté min.',
    align: 'right',
    render: (row) => <Text size="2" color="gray">{row.min_order_quantity ?? '—'}</Text>,
  },
  {
    key: 'delay',
    header: 'Délai',
    align: 'right',
    render: (row) => <Text size="2" color="gray">{row.delivery_time_days != null ? `${row.delivery_time_days} j` : '—'}</Text>,
  },
];

export function SuppliersSection({ suppliers }) {
  return (
    <>
      <Separator size="4" />
      <Box>
        <Text size="2" weight="bold" color="gray" style={{ display: 'block', marginBottom: 8 }}>
          Fournisseurs ({suppliers.length})
        </Text>
        {suppliers.length === 0
          ? <Text size="2" color="gray">Aucun fournisseur référencé.</Text>
          : <DataTable columns={SUPPLIER_COLUMNS} data={suppliers} size="1" variant="ghost" getRowKey={(r) => r.id} />}
      </Box>
    </>
  );
}

SuppliersSection.propTypes = { suppliers: PropTypes.array.isRequired };
