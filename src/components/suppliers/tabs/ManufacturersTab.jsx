/**
 * @fileoverview Onglet fabricants — liste et gestion
 * @module components/suppliers/tabs/ManufacturersTab
 */

import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Table, Text } from '@radix-ui/themes';
import { Edit2, Factory, Trash2 } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import TwoPanelLayout from '@/components/ui/TwoPanelLayout';
import ManufacturersTable from '@/components/suppliers/ManufacturersTable';
import ManufacturerForm from '@/components/suppliers/ManufacturerForm';
import { useManufacturers } from '@/hooks/suppliers/useManufacturers';
import { useManufacturerDetail } from '@/hooks/suppliers/useManufacturerDetail';
import { useUrlSearch } from '@/hooks/shared/useUrlSearch';

function SupplierItemRow({ item }) {
  return (
    <Table.Row>
      <Table.Cell><Text size="2" weight="medium">{item.stock_item_ref || '—'}</Text></Table.Cell>
      <Table.Cell><Text size="2">{item.stock_item_name || '—'}</Text></Table.Cell>
      <Table.Cell><Text size="2">{item.supplier_name}{item.supplier_code ? ` (${item.supplier_code})` : ''}</Text></Table.Cell>
      <Table.Cell><Text size="2" color="gray">{item.supplier_ref}</Text></Table.Cell>
      <Table.Cell>
        {item.is_preferred && <Badge color="amber" variant="soft" size="1">Prefere</Badge>}
      </Table.Cell>
    </Table.Row>
  );
}

SupplierItemRow.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    stock_item_ref: PropTypes.string,
    stock_item_name: PropTypes.string,
    supplier_name: PropTypes.string,
    supplier_code: PropTypes.string,
    supplier_ref: PropTypes.string,
    is_preferred: PropTypes.bool,
  }).isRequired,
};

function SupplierItemsSection({ items, loading }) {
  if (loading) return <LoadingState message="Chargement des liaisons..." />;
  if (items.length === 0) return <Text size="2" color="gray">Aucune liaison pour ce fabricant.</Text>;
  return (
    <Table.Root variant="surface" size="1">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Ref. piece</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Piece</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Ref. fourn.</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Prefere</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((item) => <SupplierItemRow key={item.id} item={item} />)}
      </Table.Body>
    </Table.Root>
  );
}

SupplierItemsSection.propTypes = {
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool,
};

function resolveInfo(base, detail) {
  const d = detail || {};
  const b = base || {};
  return {
    name: d.manufacturer_name || b.manufacturer_name || '',
    ref: d.manufacturer_ref || b.manufacturer_ref,
    supplierItems: d.supplier_items || [],
  };
}

function ManufacturerDetail({ base, detail, detailLoading, onEdit, onDelete }) {
  const { name, ref, supplierItems } = resolveInfo(base, detail);

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start">
          <Flex align="center" gap="2">
            <Factory size={20} color="var(--gray-9)" />
            <Text size="4" weight="bold">{name}</Text>
          </Flex>
          <Flex gap="2">
            <Button size="2" variant="soft" color="gray" onClick={onEdit}><Edit2 size={14} /> Modifier</Button>
            <Button size="2" variant="soft" color="red" onClick={onDelete}><Trash2 size={14} /> Supprimer</Button>
          </Flex>
        </Flex>
        {ref && <Text size="2" color="gray">Ref. catalogue : {ref}</Text>}
        <Box>
          <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>
            Liaisons fournisseur-piece ({supplierItems.length})
          </Text>
          <SupplierItemsSection items={supplierItems} loading={detailLoading} />
        </Box>
      </Flex>
    </Card>
  );
}

ManufacturerDetail.propTypes = {
  base: PropTypes.shape({
    manufacturer_name: PropTypes.string,
    manufacturer_ref: PropTypes.string,
  }),
  detail: PropTypes.shape({
    manufacturer_name: PropTypes.string,
    manufacturer_ref: PropTypes.string,
    supplier_items: PropTypes.array,
  }),
  detailLoading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default function ManufacturersTab() {
  const [urlSearch, setUrlSearch] = useUrlSearch('mq');
  const {
    manufacturers, total, page, pageSize, loading, error, search,
    setSearch, setPage, setPageSize, refresh,
    createManufacturer, updateManufacturer, removeManufacturer,
  } = useManufacturers({ initialSearch: urlSearch });
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSearch = useCallback((v) => { setSearch(v); setUrlSearch(v); }, [setSearch, setUrlSearch]);

  const { detail, loading: detailLoading } = useManufacturerDetail(selected?.id);

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const handleSelect = (m) => { setSelected(m); setMode(null); };

  const handleCreate = async (data) => {
    try { setSaving(true); await createManufacturer(data); setMode(null); }
    finally { setSaving(false); }
  };

  const handleEdit = async (data) => {
    try {
      setSaving(true);
      const updated = await updateManufacturer(selected.id, data);
      setSelected((prev) => ({ ...prev, ...updated }));
      setMode(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await removeManufacturer(selected.id);
    setSelected(null);
  };

  const rightPanel =
    mode === 'create' ? (
      <ManufacturerForm onSubmit={handleCreate} onCancel={() => setMode(null)} saving={saving} />
    ) : mode === 'edit' && selected ? (
      <ManufacturerForm
        manufacturer={selected}
        onSubmit={handleEdit}
        onCancel={() => setMode(null)}
        saving={saving}
      />
    ) : selected ? (
      <ManufacturerDetail
        base={selected}
        detail={detail}
        detailLoading={detailLoading}
        onEdit={() => setMode('edit')}
        onDelete={handleDelete}
      />
    ) : null;

  return (
    <Box>
      <TwoPanelLayout
        variant="proportional"
        separator={false}
        left={
          <ManufacturersTable
            manufacturers={manufacturers}
            total={total}
            page={page}
            pageSize={pageSize}
            loading={loading}
            search={search}
            onSearchChange={handleSearch}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            selectedId={selected?.id}
            onSelect={handleSelect}
            onCreate={() => { setSelected(null); setMode('create'); }}
          />
        }
        right={rightPanel}
        emptyState={
          <EmptyState
            icon={<Factory size={48} />}
            title="Aucun fabricant selectionne"
            description="Selectionnez un fabricant dans la liste ou creez-en un nouveau."
          />
        }
      />
    </Box>
  );
}

