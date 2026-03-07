/**
 * @fileoverview Onglet fournisseurs — liste et detail
 * @module components/suppliers/tabs/SuppliersTab
 */

import { useCallback, useState } from 'react';
import { Badge, Box, Button, Flex, Text } from '@radix-ui/themes';
import { Plus, Truck } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import TableHeader from '@/components/ui/TableHeader';
import DataTable from '@/components/ui/DataTable';
import SupplierDetail from '@/components/suppliers/SupplierDetail';
import SupplierForm from '@/components/suppliers/SupplierForm';
import { useSuppliers } from '@/hooks/suppliers/useSuppliers';
import { useUrlSearch } from '@/hooks/shared/useUrlSearch';

const columns = [
  {
    key: 'name',
    header: 'Nom / Code',
    render: (row) => (
      <Flex direction="column" gap="1" py="1">
        <Text weight="medium">{row.name}</Text>
        {row.code && <Text size="1" color="gray">{row.code}</Text>}
      </Flex>
    ),
  },
  {
    key: 'contact_name',
    header: 'Contact',
    render: (row) => <Text size="2" color="gray">{row.contact_name || '—'}</Text>,
  },
  {
    key: 'is_active',
    header: 'Statut',
    width: 90,
    render: (row) => (
      <Badge color={row.is_active ? 'green' : 'gray'} variant="soft">
        {row.is_active ? 'Actif' : 'Inactif'}
      </Badge>
    ),
  },
];

export default function SuppliersTab() {
  const [urlSearch, setUrlSearch] = useUrlSearch('q');
  const { suppliers, loading, error, search, setSearch, refresh, createSupplier, updateSupplier } =
    useSuppliers({ initialSearch: urlSearch });
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null); // 'create' | 'edit'
  const [saving, setSaving] = useState(false);

  const handleSearch = useCallback((v) => { setSearch(v); setUrlSearch(v); }, [setSearch, setUrlSearch]);

  const handleSelect = useCallback((row) => {
    if (row.id === selected?.id && mode !== 'edit') {
      setSelected(null);
      setMode(null);
      return;
    }
    setMode(null);
    setSelected(row);
  }, [selected, mode]);

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const handleCreate = async (data) => {
    try {
      setSaving(true);
      await createSupplier(data);
      setMode(null);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data) => {
    try {
      setSaving(true);
      const updated = await updateSupplier(selected.id, data);
      setSelected((prev) => ({ ...prev, ...updated }));
      setMode(null);
    } finally {
      setSaving(false);
    }
  };

  const renderDetail = () => {
    if (mode === 'edit' && selected) return (
      <SupplierForm supplier={selected} onSubmit={handleEdit} onCancel={() => setMode(null)} saving={saving} />
    );
    if (!selected) return null;
    return (
      <SupplierDetail
        supplierId={selected.id}
        onEdit={() => setMode('edit')}
        onDeleted={() => { setSelected(null); refresh(); }}
      />
    );
  };

  return (
    <Box>
      <TableHeader
        icon={Truck}
        title="Fournisseurs"
        count={suppliers.length}
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
          <SupplierForm supplier={null} onSubmit={handleCreate} onCancel={() => setMode(null)} saving={saving} />
        </Box>
      )}
      <DataTable
        columns={columns}
        data={suppliers}
        loading={loading}
        onRowClick={handleSelect}
        rowStyles={(row) => ({
          cursor: 'pointer',
          background: row.id === selected?.id ? 'var(--accent-3)' : undefined,
          boxShadow: row.id === selected?.id ? 'inset 3px 0 0 var(--accent-9)' : undefined,
        })}
        isRowExpanded={(row) => row.id === selected?.id && mode !== 'create'}
        renderExpandedRow={renderDetail}
        emptyState={{ icon: Truck, title: 'Aucun fournisseur', description: 'Aucun fournisseur ne correspond a la recherche.' }}
        getRowKey={(row) => row.id}
      />
    </Box>
  );
}
