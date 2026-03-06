/**
 * @fileoverview Onglet familles et sous-familles
 * @module components/stock/tabs/StockFamiliesTab
 */

import { useState } from 'react';
import { Box } from '@radix-ui/themes';
import { Layers } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import TwoPanelLayout from '@/components/ui/TwoPanelLayout';
import StockFamiliesTable from '@/components/stock/StockFamiliesTable';
import StockFamilyDetail from '@/components/stock/StockFamilyDetail';
import StockFamilyForm from '@/components/stock/StockFamilyForm';
import { useStockFamilies } from '@/hooks/stock/useStockFamilies';

export default function StockFamiliesTab() {
  const { families, loading, error, refresh, createFamily, updateFamily } = useStockFamilies();
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [mode, setMode] = useState(null); // 'create' | 'edit' | null
  const [saving, setSaving] = useState(false);

  if (error) return <ErrorState error={error} onRetry={refresh} />;
  if (loading) return <LoadingState message="Chargement des familles..." />;

  const handleSelectFamily = (row) => {
    setSelectedFamily(row);
    setMode(null);
  };

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

  const rightPanel =
    mode === 'create' || mode === 'edit' ? (
      <StockFamilyForm
        family={mode === 'edit' ? selectedFamily : null}
        onSubmit={mode === 'create' ? handleCreateFamily : handleUpdateFamily}
        onCancel={() => setMode(null)}
        saving={saving}
      />
    ) : selectedFamily ? (
      <StockFamilyDetail
        familyCode={selectedFamily.family_code}
        onEdit={() => setMode('edit')}
      />
    ) : null;

  return (
    <Box>
      <TwoPanelLayout
        variant="proportional"
        separator={false}
        left={
          <StockFamiliesTable
            families={families}
            loading={loading}
            selectedFamily={selectedFamily?.family_code}
            onSelectFamily={handleSelectFamily}
            onCreate={() => { setSelectedFamily(null); setMode('create'); }}
          />
        }
        right={rightPanel}
        emptyState={
          <EmptyState
            icon={<Layers size={48} />}
            title="Aucune famille selectionnee"
            description="Selectionnez une famille dans le tableau pour afficher ses sous-familles et les modifier."
          />
        }
      />
    </Box>
  );
}
