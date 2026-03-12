/**
 * @fileoverview Onglet fabricants — liste et gestion
 * @module components/manufacturers/ManufacturersTab
 */

import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Table, Text } from '@radix-ui/themes';
import { Edit2, Factory, Plus, Trash2 } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import TableHeader from '@/components/ui/TableHeader';
import DataTable from '@/components/ui/DataTable';
import ManufacturerForm from '@/components/manufacturers/ManufacturerForm';
import { useManufacturers } from '@/hooks/suppliers/useManufacturers';
import { useManufacturerDetail } from '@/hooks/suppliers/useManufacturerDetail';
import { useUrlSearch } from '@/hooks/shared/useUrlSearch';

/**
 * Ligne d'une liaison pièce-fournisseur utilisant ce fabricant.
 * Données issues de ManufacturerItemDetail.supplier_items.
 */
function ManufacturerLinkRow({ link }) {
  return (
    <Table.Row>
      <Table.Cell><Text size="2" weight="medium" style={{ fontFamily: 'monospace' }}>{link.stock_item_ref || '—'}</Text></Table.Cell>
      <Table.Cell><Text size="2">{link.stock_item_name || '—'}</Text></Table.Cell>
      <Table.Cell><Text size="2">{link.supplier_name}{link.supplier_code ? ` (${link.supplier_code})` : ''}</Text></Table.Cell>
      <Table.Cell><Text size="2" color="gray">{link.supplier_ref || '—'}</Text></Table.Cell>
    </Table.Row>
  );
}

ManufacturerLinkRow.propTypes = {
  link: PropTypes.shape({
    id: PropTypes.string.isRequired,
    stock_item_ref: PropTypes.string,
    stock_item_name: PropTypes.string,
    supplier_name: PropTypes.string,
    supplier_code: PropTypes.string,
    supplier_ref: PropTypes.string,
  }).isRequired,
};

function ManufacturerLinksSection({ links, loading }) {
  if (loading) return <LoadingState message="Chargement des liaisons..." />;
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
        {links.map((link) => <ManufacturerLinkRow key={link.id} link={link} />)}
      </Table.Body>
    </Table.Root>
  );
}

ManufacturerLinksSection.propTypes = {
  links: PropTypes.array.isRequired,
  loading: PropTypes.bool,
};

function ManufacturerDetail({ base, detail, detailLoading, onEdit, onDelete }) {
  const name = detail?.manufacturer_name || base?.manufacturer_name || '';
  const ref = detail?.manufacturer_ref || base?.manufacturer_ref;
  const designation = detail?.designation || base?.designation;
  const links = detail?.supplier_items || [];

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start">
          <Flex direction="column" gap="1">
            <Flex align="center" gap="2">
              <Factory size={20} color="var(--gray-9)" />
              <Text size="4" weight="bold">{name}</Text>
              {ref && <Text size="2" color="gray" style={{ fontFamily: 'monospace' }}>{ref}</Text>}
            </Flex>
            {designation && <Text size="2" color="gray" ml="6">{designation}</Text>}
          </Flex>
          <Flex gap="2">
            <Button size="2" variant="soft" color="gray" onClick={onEdit}><Edit2 size={14} /> Modifier</Button>
            <Button size="2" variant="soft" color="red" onClick={onDelete}><Trash2 size={14} /> Supprimer</Button>
          </Flex>
        </Flex>
        <Box>
          <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>
            Liaisons pièce-fournisseur ({links.length})
          </Text>
          <ManufacturerLinksSection links={links} loading={detailLoading} />
        </Box>
      </Flex>
    </Card>
  );
}

ManufacturerDetail.propTypes = {
  base: PropTypes.shape({
    manufacturer_name: PropTypes.string,
    manufacturer_ref: PropTypes.string,
    designation: PropTypes.string,
  }),
  detail: PropTypes.shape({
    manufacturer_name: PropTypes.string,
    manufacturer_ref: PropTypes.string,
    designation: PropTypes.string,
    supplier_items: PropTypes.array,
  }),
  detailLoading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

const columns = [
  {
    key: 'manufacturer_name',
    header: 'Fabricant',
    render: (row) => (
      <Flex align="center" gap="2" py="1">
        <Factory size={13} color="var(--gray-9)" />
        <Text size="2" weight="medium">{row.manufacturer_name}</Text>
      </Flex>
    ),
  },
  {
    key: 'manufacturer_ref',
    header: 'Référence',
    render: (row) => row.manufacturer_ref
      ? <Badge color="gray" variant="outline" radius="small">{row.manufacturer_ref}</Badge>
      : <Text size="2" color="gray">—</Text>,
  },
  {
    key: 'designation',
    header: 'Désignation',
    render: (row) => <Text size="2" color="gray">{row.designation || '—'}</Text>,
  },
];

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

  const handleSelect = useCallback((m) => {
    if (m.id === selected?.id && mode !== 'edit') {
      setSelected(null);
      setMode(null);
      return;
    }
    setMode(null);
    setSelected(m);
  }, [selected, mode]);

  const { detail, loading: detailLoading } = useManufacturerDetail(selected?.id);

  if (error) return <ErrorState error={error} onRetry={refresh} />;

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

  const paginationProps = total > pageSize ? {
    currentPage: page,
    total,
    pageSize,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
    pageSizeOptions: [25, 50, 100],
  } : undefined;

  const renderDetail = () => {
    if (mode === 'edit' && selected) return (
      <ManufacturerForm manufacturer={selected} onSubmit={handleEdit} onCancel={() => setMode(null)} saving={saving} />
    );
    if (!selected) return null;
    return (
      <ManufacturerDetail
        base={selected}
        detail={detail}
        detailLoading={detailLoading}
        onEdit={() => setMode('edit')}
        onDelete={handleDelete}
      />
    );
  };

  return (
    <Box>
      <TableHeader
        icon={Factory}
        title="Fabricants"
        count={total}
        searchValue={search}
        onSearchChange={handleSearch}
        loading={loading}
        showRefreshButton={false}
        rightActions={
          <Button size="2" color="blue" onClick={() => { setSelected(null); setMode('create'); }}>
            <Plus size={14} /> Ajouter
          </Button>
        }
      />
      {mode === 'create' && (
        <Box mb="3">
          <ManufacturerForm onSubmit={handleCreate} onCancel={() => setMode(null)} saving={saving} />
        </Box>
      )}
      <DataTable
        columns={columns}
        data={manufacturers}
        loading={loading}
        onRowClick={handleSelect}
        getRowKey={(row) => row.id}
        rowStyles={(row) => ({
          cursor: 'pointer',
          background: row.id === selected?.id ? 'var(--accent-3)' : undefined,
          boxShadow: row.id === selected?.id ? 'inset 3px 0 0 var(--accent-9)' : undefined,
        })}
        isRowExpanded={(row) => row.id === selected?.id && mode !== 'create'}
        renderExpandedRow={renderDetail}
        emptyState={{ icon: Factory, title: 'Aucun fabricant', description: 'Aucun fabricant trouvé.' }}
        pagination={paginationProps}
      />
    </Box>
  );
}