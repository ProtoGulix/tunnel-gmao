/**
 * @fileoverview Onglet fournisseurs — master-detail
 * @module components/suppliers/tabs/SuppliersTab
 */

import { useCallback, useState } from 'react';
import { Badge, Box, Button, Flex, Text } from '@radix-ui/themes';
import { Plus, Truck } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import SupplierDetail from '@/components/suppliers/SupplierDetail';
import SupplierForm from '@/components/suppliers/SupplierForm';
import { useSuppliers } from '@/hooks/suppliers/useSuppliers';
import { useUrlSearch } from '@/hooks/shared/useUrlSearch';

function SupplierItem({ supplier, isSelected, onClick }) {
  return (
    <Box
      onClick={() => onClick(supplier)}
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
          <Text size="2" weight="medium">{supplier.name}</Text>
          <Badge color={supplier.is_active ? 'green' : 'gray'} variant="soft" size="1">
            {supplier.is_active ? 'Actif' : 'Inactif'}
          </Badge>
        </Flex>
        <Flex gap="2" align="center">
          {supplier.code && (
            <Badge variant="outline" color="gray" size="1" style={{ fontFamily: 'monospace', fontSize: 10 }}>
              {supplier.code}
            </Badge>
          )}
          {supplier.contact_name && (
            <Text size="1" color="gray">{supplier.contact_name}</Text>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

export default function SuppliersTab() {
  const [urlSearch, setUrlSearch] = useUrlSearch('sq');
  const { suppliers, loading, error, search, setSearch, refresh, createSupplier, updateSupplier } =
    useSuppliers({ initialSearch: urlSearch });
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSearch = useCallback((v) => { setSearch(v); setUrlSearch(v); }, [setSearch, setUrlSearch]);

  const handleSelect = useCallback((row) => {
    if (row.id === selected?.id && mode !== 'edit') { setSelected(null); setMode(null); return; }
    setMode(null);
    setSelected(row);
  }, [selected, mode]);

  const handleCreate = async (data) => {
    try { setSaving(true); await createSupplier(data); setMode(null); }
    finally { setSaving(false); }
  };

  const handleEdit = async (data) => {
    try {
      setSaving(true);
      const updated = await updateSupplier(selected.id, data);
      setSelected((prev) => ({ ...prev, ...updated }));
      setMode(null);
    } finally { setSaving(false); }
  };

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const detailContent = () => {
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

  const masterList = suppliers.length === 0 && !loading ? (
    <Flex direction="column" align="center" justify="center" style={{ height: 200, padding: 24 }} gap="2">
      <Truck size={28} color="var(--gray-7)" />
      <Text size="2" color="gray">Aucun fournisseur trouvé</Text>
    </Flex>
  ) : suppliers.map((s) => (
    <SupplierItem key={s.id} supplier={s} isSelected={s.id === selected?.id} onClick={handleSelect} />
  ));

  return (
    <Box pt="3" style={{ height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
      {/* Bouton ajouter + formulaire de création */}
      <Flex justify="end" mb="2" style={{ flexShrink: 0 }}>
        <Button size="2" color="blue" onClick={() => { setSelected(null); setMode('create'); }}>
          <Plus size={14} /> Ajouter
        </Button>
      </Flex>
      {mode === 'create' && (
        <Box mb="3" style={{ flexShrink: 0 }}>
          <SupplierForm supplier={null} onSubmit={handleCreate} onCancel={() => setMode(null)} saving={saving} />
        </Box>
      )}

      <div style={{ flex: 1, minHeight: 0 }}>
        <MasterDetailLayout
          masterProps={{
            icon: Truck,
            title: 'Fournisseurs',
            count: suppliers.length,
            search,
            onSearchChange: handleSearch,
            loading,
            children: masterList,
          }}
          detailChildren={detailContent()}
          emptyLabel="Sélectionnez un fournisseur pour voir son détail"
        />
      </div>
    </Box>
  );
}
