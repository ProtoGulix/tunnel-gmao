/**
 * @fileoverview Onglet familles et sous-familles
 * @module components/stock/tabs/StockFamiliesTab
 */

import { useCallback, useState } from 'react';
import { Badge, Box, Button, Flex, Text } from '@radix-ui/themes';
import { Layers, Plus } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import TableHeader from '@/components/ui/TableHeader';
import DataTable from '@/components/ui/DataTable';
import StockFamilyDetail from '@/components/stock/StockFamilyDetail';
import StockFamilyForm from '@/components/stock/StockFamilyForm';
import { useStockFamilies } from '@/hooks/stock/useStockFamilies';

const columns = [
  {
    key: 'family_code',
    header: 'Famille / Libellé',
    render: (row) => (
      <Flex direction="column" gap="1" py="1">
        <Badge variant="soft" color="blue">{row.family_code}</Badge>
        {row.label && <Text size="1" color="gray">{row.label}</Text>}
      </Flex>
    ),
  },
  {
    key: 'sub_family_count',
    header: 'Sous-familles',
    width: 120,
    align: 'right',
    render: (row) => <Text size="2" color="gray">{row.sub_family_count}</Text>,
  },
];

export default function StockFamiliesTab() {
  const { families, loading, error, refresh, createFamily, updateFamily } = useStockFamilies();
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [mode, setMode] = useState(null); // 'create' | 'edit' | null
  const [saving, setSaving] = useState(false);

  const handleSelectFamily = useCallback((row) => {
    if (row.family_code === selectedFamily?.family_code && mode !== 'edit') {
      setSelectedFamily(null);
      setMode(null);
      return;
    }
    setMode(null);
    setSelectedFamily(row);
  }, [selectedFamily, mode]);

  if (error) return <ErrorState error={error} onRetry={refresh} />;
  if (loading) return <LoadingState message="Chargement des familles..." />;

  const handleCreateFamily = async (data) => {
    try {
      setSaving(true);
      await createFamily(data);
      setMode(null);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFamily = async (data) => {
    try {
      setSaving(true);
      await updateFamily(selectedFamily.family_code, data);
      setMode(null);
    } finally {
      setSaving(false);
    }
  };

  const renderDetail = () => {
    if (mode === 'edit') return (
      <StockFamilyForm
        family={selectedFamily}
        onSubmit={handleUpdateFamily}
        onCancel={() => setMode(null)}
        saving={saving}
      />
    );
    if (!selectedFamily) return null;
    return (
      <StockFamilyDetail
        familyCode={selectedFamily.family_code}
        onEdit={() => setMode('edit')}
      />
    );
  };

  return (
    <Box>
      <TableHeader
        icon={Layers}
        title="Familles"
        count={families.length}
        showSearchInput={false}
        showRefreshButton={false}
        rightActions={
          <Button size="2" color="blue" onClick={() => { setSelectedFamily(null); setMode('create'); }}>
            <Plus size={14} /> Ajouter
          </Button>
        }
      />
      {mode === 'create' && (
        <Box mb="3">
          <StockFamilyForm
            family={null}
            onSubmit={handleCreateFamily}
            onCancel={() => setMode(null)}
            saving={saving}
          />
        </Box>
      )}
      <DataTable
        columns={columns}
        data={families}
        loading={loading}
        onRowClick={handleSelectFamily}
        getRowKey={(row) => row.family_code}
        rowStyles={(row) => ({
          cursor: 'pointer',
          background: row.family_code === selectedFamily?.family_code ? 'var(--accent-3)' : undefined,
          boxShadow: row.family_code === selectedFamily?.family_code ? 'inset 3px 0 0 var(--accent-9)' : undefined,
        })}
        isRowExpanded={(row) => row.family_code === selectedFamily?.family_code && mode !== 'create'}
        renderExpandedRow={renderDetail}
        emptyState={{ icon: Layers, title: 'Aucune famille', description: 'Aucune famille disponible.' }}
      />
    </Box>
  );
}
