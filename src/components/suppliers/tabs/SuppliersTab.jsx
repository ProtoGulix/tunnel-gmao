/**
 * @fileoverview Onglet fournisseurs — liste et detail
 * @module components/suppliers/tabs/SuppliersTab
 */

import { useCallback, useState } from 'react';
import { Box } from '@radix-ui/themes';
import { Truck } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import TwoPanelLayout from '@/components/ui/TwoPanelLayout';
import SuppliersTable from '@/components/suppliers/SuppliersTable';
import SupplierDetail from '@/components/suppliers/SupplierDetail';
import SupplierForm from '@/components/suppliers/SupplierForm';
import { useSuppliers } from '@/hooks/suppliers/useSuppliers';
import { useUrlSearch } from '@/hooks/shared/useUrlSearch';

export default function SuppliersTab() {
  const [urlSearch, setUrlSearch] = useUrlSearch('q');
  const { suppliers, loading, error, search, setSearch, refresh, createSupplier, updateSupplier } = useSuppliers({ initialSearch: urlSearch });
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null); // 'create' | 'edit'
  const [saving, setSaving] = useState(false);

  const handleSearch = useCallback((v) => { setSearch(v); setUrlSearch(v); }, [setSearch, setUrlSearch]);

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const handleSelect = (row) => {
    setSelected(row);
    setMode(null);
  };

  const handleCreate = async (data) => {
    try {
      setSaving(true);
      await createSupplier(data);
      setMode(null);
    } finally {
      setSaving(false);
    }
  };

  const rightPanel =
    mode === 'create' ? (
      <SupplierForm
        supplier={null}
        onSubmit={handleCreate}
        onCancel={() => setMode(null)}
        saving={saving}
      />
    ) : mode === 'edit' && selected ? (
      <SupplierForm
        supplier={selected}
        onSubmit={async (data) => {
          try {
            setSaving(true);
            const updated = await updateSupplier(selected.id, data);
            setSelected((prev) => ({ ...prev, ...updated }));
            setMode(null);
          } finally {
            setSaving(false);
          }
        }}
        onCancel={() => setMode(null)}
        saving={saving}
      />
    ) : selected ? (
      <SupplierDetail
        supplierId={selected.id}
        onEdit={() => setMode('edit')}
        onDeleted={() => { setSelected(null); refresh(); }}
      />
    ) : null;

  return (
    <Box>
      <TwoPanelLayout
        variant="proportional"
        separator={false}
        left={
          <SuppliersTable
            suppliers={suppliers}
            loading={loading}
            search={search}
            onSearchChange={handleSearch}
            selectedId={selected?.id}
            onSelect={handleSelect}
            onCreate={() => { setSelected(null); setMode('create'); }}
          />
        }
        right={rightPanel}
        emptyState={
          <EmptyState
            icon={<Truck size={48} />}
            title="Aucun fournisseur selectionne"
            description="Selectionnez un fournisseur dans la liste ou creez-en un nouveau."
          />
        }
      />
    </Box>
  );
}
