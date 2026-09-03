/**
 * @fileoverview Onglet fournisseurs — toutes les references fournisseur, filtrables par fournisseur
 * @module components/suppliers/tabs/SuppliersTab
 */

import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Dialog, Flex, Table, Text, VisuallyHidden } from '@radix-ui/themes';
import { Link2, Truck } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import SupplierPartRefDetail from '@/components/suppliers/SupplierPartRefDetail';
import SupplierManageModal from '@/components/suppliers/SupplierManageModal';
import SupplierForm from '@/components/suppliers/SupplierForm';
import { useSuppliers } from '@/hooks/suppliers/useSuppliers';
import { useSupplierPartRefs } from '@/hooks/suppliers/useSupplierPartRefs';
import { useUrlSearch } from '@/hooks/shared/useUrlSearch';
import { ROW_PADDING_X, ROW_PADDING_Y, ROW_MIN_HEIGHT } from '@/styles/tokens/density';

const CELL_STYLE = { padding: `${ROW_PADDING_Y} ${ROW_PADDING_X}`, height: ROW_MIN_HEIGHT, boxSizing: 'border-box' };

function RefRow({ item, isSelected, onSelect }) {
  return (
    <Table.Row
      onClick={() => onSelect(item)}
      style={{ cursor: 'pointer', background: isSelected ? 'var(--accent-3)' : undefined }}
    >
      <Table.Cell style={CELL_STYLE}>
        <Badge variant="soft" color="gray">{item.supplier_name}</Badge>
      </Table.Cell>
      <Table.Cell style={CELL_STYLE}>
        <Badge variant="soft" color="blue">{item.internal_ref}</Badge>
      </Table.Cell>
      <Table.Cell style={CELL_STYLE}>
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium">{item.manufacturer_name}</Text>
          <Badge variant="soft" color="violet" style={{ alignSelf: 'flex-start' }}>{item.manufacturer_ref}</Badge>
        </Flex>
      </Table.Cell>
      <Table.Cell style={CELL_STYLE}>
        <Badge variant="soft" color="indigo">{item.supplier_ref}</Badge>
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
          <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Réf. interne</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Fabricant</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Réf. fournisseur</Table.ColumnHeaderCell>
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

const SuppliersTab = forwardRef(function SuppliersTab(props, ref) {
  const [urlSearch, setUrlSearch] = useUrlSearch('sq');
  const [supplierFilter, setSupplierFilter] = useState('');
  const { suppliers, createSupplier } = useSuppliers({});
  const { refs, loading, error, refresh, total, pagination } = useSupplierPartRefs({ supplierId: supplierFilter, search: urlSearch });
  const [selected, setSelected] = useState(null);
  const [manageSupplierId, setManageSupplierId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const sortedSuppliers = useMemo(
    () => [...suppliers].sort((a, b) => a.name.localeCompare(b.name)),
    [suppliers]
  );

  const handleSearch = (v) => { setUrlSearch(v); };
  const handleSelect = (ref) => setSelected((prev) => (prev?.id === ref.id ? null : ref));

  const handleCreate = async (data) => {
    try {
      setSaving(true);
      await createSupplier(data);
      setCreating(false);
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    openCreate: () => setCreating(true),
  }), []);

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
            count: total,
            search: urlSearch,
            onSearchChange: handleSearch,
            loading,
            headerExtra: filterSelect,
            pagination,
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

      <Dialog.Root open={creating} onOpenChange={(v) => { if (!v && !saving) setCreating(false); }}>
        <Dialog.Content style={{ maxWidth: 560 }}>
          <VisuallyHidden>
            <Dialog.Title>Nouveau fournisseur</Dialog.Title>
          </VisuallyHidden>
          <SupplierForm onSubmit={handleCreate} onCancel={() => setCreating(false)} saving={saving} />
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
});

export default SuppliersTab;
