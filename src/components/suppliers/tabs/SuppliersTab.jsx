/**
 * @fileoverview Onglet fournisseurs — toutes les references fournisseur, filtrables par fournisseur
 * @module components/suppliers/tabs/SuppliersTab
 */

import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Flex, Radio, Table, Text } from '@radix-ui/themes';
import { Link2, Truck } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import SupplierPartRefDetail from '@/components/suppliers/SupplierPartRefDetail';
import SupplierManageModal from '@/components/suppliers/SupplierManageModal';
import { useSuppliers } from '@/hooks/suppliers/useSuppliers';
import { useSupplierPartRefs } from '@/hooks/suppliers/useSupplierPartRefs';
import { useUrlSearch } from '@/hooks/shared/useUrlSearch';

function RefRow({ item, isSelected, onSelect }) {
  return (
    <Table.Row
      onClick={() => onSelect(item)}
      style={{ cursor: 'pointer', background: isSelected ? 'var(--accent-3)' : undefined }}
    >
      <Table.Cell>
        <Radio checked={isSelected} onCheckedChange={() => onSelect(item)} />
      </Table.Cell>
      <Table.Cell>
        <Badge variant="soft" color="gray">{item.supplier_name}</Badge>
      </Table.Cell>
      <Table.Cell>
        <Flex direction="column" gap="1">
          <Text size="2">{item.internal_ref}</Text>
          <Text size="1" color="gray">{item.manufacturer_name} — {item.manufacturer_ref}</Text>
        </Flex>
      </Table.Cell>
      <Table.Cell>
        <Badge variant="soft" color="indigo">{item.supplier_ref}</Badge>
      </Table.Cell>
      <Table.Cell>
        <Text size="2">{item.unit_price != null ? `${item.unit_price} €` : '-'}</Text>
      </Table.Cell>
    </Table.Row>
  );
}

RefRow.propTypes = {
  item: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

function RefsTable({ refs, selectedId, onSelect }) {
  if (refs.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ height: 200, padding: 24 }} gap="2">
        <Link2 size={28} color="var(--gray-7)" />
        <Text size="2" color="gray">Aucune référence fournisseur trouvée</Text>
      </Flex>
    );
  }
  return (
    <Table.Root variant="surface" size="1">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell style={{ width: 36 }} />
          <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Pièce / fabricant</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Réf. fournisseur</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Prix</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {refs.map((ref) => (
          <RefRow key={ref.id} item={ref} isSelected={ref.id === selectedId} onSelect={onSelect} />
        ))}
      </Table.Body>
    </Table.Root>
  );
}

RefsTable.propTypes = {
  refs: PropTypes.array.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};

export default function SuppliersTab() {
  const [urlSearch, setUrlSearch] = useUrlSearch('sq');
  const [supplierFilter, setSupplierFilter] = useState('');
  const { suppliers } = useSuppliers({});
  const { refs, loading, error, refresh } = useSupplierPartRefs({ supplierId: supplierFilter, search: urlSearch });
  const [selected, setSelected] = useState(null);
  const [manageSupplierId, setManageSupplierId] = useState(null);

  const sortedSuppliers = useMemo(
    () => [...suppliers].sort((a, b) => a.name.localeCompare(b.name)),
    [suppliers]
  );

  const handleSearch = (v) => { setUrlSearch(v); };
  const handleSelect = (ref) => setSelected((prev) => (prev?.id === ref.id ? null : ref));

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const filterSelect = (
    <select
      value={supplierFilter}
      onChange={(e) => setSupplierFilter(e.target.value)}
      style={{
        width: '100%', height: 32, padding: '0 8px',
        borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-7)',
        fontSize: 'var(--font-size-2)', background: 'var(--color-background)',
      }}
    >
      <option value="">Tous les fournisseurs</option>
      {sortedSuppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
    </select>
  );

  return (
    <Box pt="3" style={{ height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <MasterDetailLayout
          masterProps={{
            icon: Truck,
            title: 'Références fournisseur',
            count: refs.length,
            search: urlSearch,
            onSearchChange: handleSearch,
            loading,
            headerExtra: filterSelect,
            children: <RefsTable refs={refs} selectedId={selected?.id} onSelect={handleSelect} />,
          }}
          detailChildren={selected && (
            <SupplierPartRefDetail item={selected} onManageSupplier={setManageSupplierId} />
          )}
          emptyLabel="Sélectionnez une référence pour voir son détail"
        />
      </div>

      <SupplierManageModal
        open={!!manageSupplierId}
        onOpenChange={(v) => { if (!v) setManageSupplierId(null); }}
        supplierId={manageSupplierId}
      />
    </Box>
  );
}
