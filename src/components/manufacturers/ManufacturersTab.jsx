/**
 * @fileoverview Onglet fabricants — master-detail
 * @module components/manufacturers/ManufacturersTab
 */

import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Table, Text } from '@radix-ui/themes';
import { Factory, Plus } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import ManufacturerForm from '@/components/manufacturers/ManufacturerForm';
import { useManufacturers } from '@/hooks/suppliers/useManufacturers';
import { useManufacturerDetail } from '@/hooks/suppliers/useManufacturerDetail';
import { useUrlSearch } from '@/hooks/shared/useUrlSearch';

function ManufacturerItem({ manufacturer, isSelected, onClick }) {
  return (
    <Box
      onClick={() => onClick(manufacturer)}
      style={{
        padding: '10px 14px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--gray-4)',
        background: isSelected ? 'var(--accent-3)' : 'var(--gray-1)',
        boxShadow: isSelected ? 'inset 3px 0 0 var(--accent-9)' : undefined,
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--gray-3)'; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--gray-1)'; }}
    >
      <Flex direction="column" gap="1">
        <Flex align="center" gap="2">
          <Factory size={13} color="var(--gray-9)" />
          <Text size="2" weight="medium">{manufacturer.manufacturer_name}</Text>
        </Flex>
        <Flex gap="2" align="center">
          {manufacturer.manufacturer_ref && (
            <Badge variant="outline" color="gray" size="1" style={{ fontFamily: 'monospace', fontSize: 10 }}>
              {manufacturer.manufacturer_ref}
            </Badge>
          )}
          {manufacturer.designation && (
            <Text size="1" color="gray">{manufacturer.designation}</Text>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

ManufacturerItem.propTypes = {
  manufacturer: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};

function LinksTable({ links, loading }) {
  if (loading) return <LoadingState fullscreen={false} message="Chargement des liaisons…" />;
  if (!links.length) return <Text size="2" color="gray">Aucune liaison pièce-fournisseur pour ce fabricant.</Text>;
  return (
    <Table.Root variant="surface" size="1">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Réf. pièce</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Pièce</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Réf. fourn.</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {links.map((link) => (
          <Table.Row key={link.id}>
            <Table.Cell><Text size="2" weight="medium" style={{ fontFamily: 'monospace' }}>{link.stock_item_ref || '—'}</Text></Table.Cell>
            <Table.Cell><Text size="2">{link.stock_item_name || '—'}</Text></Table.Cell>
            <Table.Cell><Text size="2">{link.supplier_name}{link.supplier_code ? ` (${link.supplier_code})` : ''}</Text></Table.Cell>
            <Table.Cell><Text size="2" color="gray">{link.supplier_ref || '—'}</Text></Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

LinksTable.propTypes = {
  links: PropTypes.array.isRequired,
  loading: PropTypes.bool,
};

function ManufacturerDetailView({ base, detail, detailLoading, onEdit, onDelete }) {
  const name = detail?.manufacturer_name || base?.manufacturer_name || '';
  const ref = detail?.manufacturer_ref || base?.manufacturer_ref;
  const designation = detail?.designation || base?.designation;
  const links = detail?.supplier_items || [];

  return (
    <Flex direction="column" gap="4">
      {/* Header */}
      <Flex justify="between" align="start">
        <Flex direction="column" gap="1">
          <Flex align="center" gap="2">
            <Factory size={18} color="var(--gray-9)" />
            <Text size="4" weight="bold">{name}</Text>
            {ref && (
              <Badge variant="outline" color="gray" style={{ fontFamily: 'monospace' }}>{ref}</Badge>
            )}
          </Flex>
          {designation && <Text size="2" color="gray" ml="6">{designation}</Text>}
        </Flex>
        <Flex gap="2">
          <Button size="1" variant="soft" color="gray" onClick={onEdit}>Modifier</Button>
          <Button size="1" variant="soft" color="red" onClick={onDelete}>Supprimer</Button>
        </Flex>
      </Flex>

      {/* Liaisons */}
      <Box>
        <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>
          Liaisons pièce-fournisseur ({links.length})
        </Text>
        <LinksTable links={links} loading={detailLoading} />
      </Box>
    </Flex>
  );
}

ManufacturerDetailView.propTypes = {
  base: PropTypes.object,
  detail: PropTypes.object,
  detailLoading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default function ManufacturersTab() {
  const [urlSearch, setUrlSearch] = useUrlSearch('mq');
  const {
    manufacturers, total, page, pageSize, loading, error, search,
    setSearch, setPage, refresh,
    createManufacturer, updateManufacturer, removeManufacturer,
  } = useManufacturers({ initialSearch: urlSearch });
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSearch = useCallback((v) => { setSearch(v); setUrlSearch(v); }, [setSearch, setUrlSearch]);

  const handleSelect = useCallback((m) => {
    if (m.id === selected?.id && mode !== 'edit') { setSelected(null); setMode(null); return; }
    setMode(null);
    setSelected(m);
  }, [selected, mode]);

  const { detail, loading: detailLoading } = useManufacturerDetail(selected?.id);

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

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

  const masterList = manufacturers.length === 0 && !loading ? (
    <Flex direction="column" align="center" justify="center" style={{ height: 200, padding: 24 }} gap="2">
      <Factory size={28} color="var(--gray-7)" />
      <Text size="2" color="gray">Aucun fabricant trouvé</Text>
    </Flex>
  ) : manufacturers.map((m) => (
    <ManufacturerItem key={m.id} manufacturer={m} isSelected={m.id === selected?.id} onClick={handleSelect} />
  ));

  const detailContent = () => {
    if (mode === 'edit' && selected) return (
      <ManufacturerForm manufacturer={selected} onSubmit={handleEdit} onCancel={() => setMode(null)} saving={saving} />
    );
    if (!selected) return null;
    return (
      <ManufacturerDetailView
        base={selected}
        detail={detail}
        detailLoading={detailLoading && !detail}
        onEdit={() => setMode('edit')}
        onDelete={handleDelete}
      />
    );
  };

  return (
    <Box pt="3">
      <Flex justify="end" mb="2">
        <Button size="2" color="blue" onClick={() => { setSelected(null); setMode('create'); }}>
          <Plus size={14} /> Ajouter
        </Button>
      </Flex>
      {mode === 'create' && (
        <Box mb="3">
          <ManufacturerForm onSubmit={handleCreate} onCancel={() => setMode(null)} saving={saving} />
        </Box>
      )}

      <MasterDetailLayout
        masterProps={{
          icon: Factory,
          title: 'Fabricants',
          count: total,
          search,
          onSearchChange: handleSearch,
          loading,
          children: masterList,
          pagination: totalPages > 1 ? { currentPage: page, totalPages, onPageChange: setPage } : undefined,
        }}
        detailChildren={detailContent()}
        emptyLabel="Sélectionnez un fabricant pour voir ses liaisons"
      />
    </Box>
  );
}
