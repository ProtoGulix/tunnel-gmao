/**
 * @fileoverview Onglet pièces référencées — vue master-detail côte-à-côte
 * @module components/stock/tabs/StockItemsTab
 */

import { useCallback, useState } from 'react';
import { Box, Button, Flex } from '@radix-ui/themes';
import { Package, Plus } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import StockItemForm from '@/components/stock/StockItemForm';
import StockMasterList from '@/components/stock/StockMasterList';
import StockDetailPanel from '@/components/stock/StockDetailPanel';
import { useStockItems } from '@/hooks/stock/useStockItems';
import { useUrlSearch } from '@/hooks/shared/useUrlSearch';
import { fetchStockItemDetail } from '@/api/stock';

export default function StockItemsTab() {
  const [urlSearch, setUrlSearch] = useUrlSearch('q');
  const {
    items, loading, error,
    search, setSearch,
    familyCode, setFamilyCode,
    subFamilyCode, setSubFamilyCode,
    facets, pagination, goToPage, changePageSize,
    refresh, createItem, editItem, removeItem,
  } = useStockItems({ initialSearch: urlSearch });

  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null); // 'create' | 'edit'
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleSearch = useCallback((v) => { setSearch(v); setUrlSearch(v); }, [setSearch, setUrlSearch]);

  const handleSelect = useCallback(async (row) => {
    if (row.id === selected?.id && mode !== 'edit') {
      setSelected(null);
      setMode(null);
      return;
    }
    setMode(null);
    setSelected(null);
    setDetailLoading(true);
    try {
      const detail = await fetchStockItemDetail(row.id);
      setSelected(detail);
    } finally {
      setDetailLoading(false);
    }
  }, [selected, mode]);

  const handleFamilyChange = useCallback((v) => { setFamilyCode(v); setSubFamilyCode(''); }, [setFamilyCode, setSubFamilyCode]);
  const handleSubFamilyChange = useCallback((v) => setSubFamilyCode(v), [setSubFamilyCode]);

  const handleCreate = async (data) => {
    try {
      setSaving(true);
      await createItem(data);
      setMode(null);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data) => {
    try {
      setSaving(true);
      await editItem(selected.id, data);
      const detail = await fetchStockItemDetail(selected.id);
      setSelected(detail);
      setMode(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await removeItem(selected.id);
    setSelected(null);
    setMode(null);
  };

  const handleRefreshDetail = useCallback(async () => {
    if (!selected) return;
    const detail = await fetchStockItemDetail(selected.id);
    setSelected(detail);
  }, [selected]);

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const paginationProps = pagination.totalPages > 1 ? {
    currentPage: pagination.page,
    total: pagination.total,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
    onPageChange: goToPage,
    onPageSizeChange: changePageSize,
    pageSizeOptions: [50, 100, 200],
  } : undefined;

  return (
    <Box>
      {/* Barre d'actions globale */}
      <Flex justify="end" py="2">
        <Button size="2" color="blue" onClick={() => { setSelected(null); setMode('create'); }}>
          <Plus size={14} /> Ajouter
        </Button>
      </Flex>

      {/* Formulaire de création */}
      {mode === 'create' && (
        <Box mb="3">
          <StockItemForm onSubmit={handleCreate} onCancel={() => setMode(null)} saving={saving} />
        </Box>
      )}

      {/* Layout master-detail — toujours 2 colonnes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.3fr',
        gap: '12px',
        alignItems: 'start',
      }}>
        <StockMasterList
          items={items}
          loading={loading}
          search={search}
          onSearchChange={handleSearch}
          facets={facets}
          familyCode={familyCode}
          onFamilyChange={handleFamilyChange}
          subFamilyCode={subFamilyCode}
          onSubFamilyChange={handleSubFamilyChange}
          selectedId={selected?.id}
          onSelect={handleSelect}
          pagination={paginationProps}
          count={pagination.total}
        />

        <StockDetailPanel
          item={selected}
          loading={detailLoading}
          mode={mode}
          saving={saving}
          onEdit={() => setMode('edit')}
          onEditSubmit={handleEdit}
          onEditCancel={() => setMode(null)}
          onDelete={handleDelete}
          onRefresh={handleRefreshDetail}
          onClose={() => { setSelected(null); setMode(null); }}
        />
      </div>
    </Box>
  );
}
