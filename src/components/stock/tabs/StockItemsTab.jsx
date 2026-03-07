/**
 * @fileoverview Onglet pièces référencées — liste et détail
 * @module components/stock/tabs/StockItemsTab
 */

import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Flex, Select } from '@radix-ui/themes';
import { Package, Plus } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import TableHeader from '@/components/ui/TableHeader';
import StockItemsList from '@/components/stock/StockItemsList';
import StockItemDetail from '@/components/stock/StockItemDetail';
import StockItemForm from '@/components/stock/StockItemForm';
import { useStockItems } from '@/hooks/stock/useStockItems';
import { useUrlSearch } from '@/hooks/shared/useUrlSearch';
import { fetchStockItemDetail } from '@/api/stock';

const ALL = '__all__';

function FamilyFilters({ facets, familyCode, onFamilyChange, subFamilyCode, onSubFamilyChange }) {
  const selectedFamily = useMemo(
    () => facets.families.find((f) => f.code === familyCode),
    [facets, familyCode]
  );
  const subFamilies = selectedFamily?.sub_families ?? [];
  return (
    <Flex gap="2" align="center" wrap="wrap">
      <Select.Root
        value={familyCode || ALL}
        onValueChange={(v) => onFamilyChange(v === ALL ? '' : v)}
        color={familyCode ? 'blue' : undefined}
      >
        <Select.Trigger
          placeholder="Toutes les familles"
          variant={familyCode ? 'soft' : 'surface'}
        />
        <Select.Content>
          <Select.Item value={ALL}>Toutes les familles</Select.Item>
          {facets.families.map((f) => (
            <Select.Item key={f.code} value={f.code}>
              {f.code}{f.label ? ` — ${f.label}` : ''}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
      <Select.Root
        value={subFamilyCode || ALL}
        onValueChange={(v) => onSubFamilyChange(v === ALL ? '' : v)}
        disabled={subFamilies.length === 0}
        color={subFamilyCode ? 'indigo' : undefined}
      >
        <Select.Trigger
          placeholder="Toutes les sous-familles"
          variant={subFamilyCode ? 'soft' : 'surface'}
        />
        <Select.Content>
          <Select.Item value={ALL}>Toutes les sous-familles</Select.Item>
          {subFamilies.map((s) => (
            <Select.Item key={s.code} value={s.code}>
              {s.code}{s.label ? ` — ${s.label}` : ''}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}

FamilyFilters.propTypes = {
  facets: PropTypes.shape({ families: PropTypes.array.isRequired }).isRequired,
  familyCode: PropTypes.string,
  onFamilyChange: PropTypes.func.isRequired,
  subFamilyCode: PropTypes.string,
  onSubFamilyChange: PropTypes.func.isRequired,
};

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
  const handleFamilyChange = (v) => { setFamilyCode(v); setSubFamilyCode(''); };
  const handleSubFamilyChange = (v) => setSubFamilyCode(v);

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

  const renderDetail = () => {
    if (detailLoading) return <LoadingState fullscreen={false} message="Chargement du détail..." />;
    if (!selected) return null;
    if (mode === 'edit') return (
      <StockItemForm item={selected} onSubmit={handleEdit} onCancel={() => setMode(null)} saving={saving} />
    );
    return (
      <StockItemDetail item={selected} onEdit={() => setMode('edit')} onDelete={handleDelete} onRefresh={handleRefreshDetail} />
    );
  };

  return (
    <Box>
      <TableHeader
        icon={Package}
        title="Pièces référencées"
        count={pagination.total}
        searchValue={search}
        onSearchChange={handleSearch}
        loading={loading}
        showRefreshButton={false}
        actions={
          <FamilyFilters
            facets={facets}
            familyCode={familyCode}
            onFamilyChange={handleFamilyChange}
            subFamilyCode={subFamilyCode}
            onSubFamilyChange={handleSubFamilyChange}
          />
        }
        rightActions={
          <Button size="2" color="blue" onClick={() => { setSelected(null); setMode('create'); }}>
            <Plus size={14} /> Ajouter
          </Button>
        }
      />
      {mode === 'create' && (
        <Box mb="3">
          <StockItemForm onSubmit={handleCreate} onCancel={() => setMode(null)} saving={saving} />
        </Box>
      )}
      <StockItemsList
        items={items}
        loading={loading}
        selectedId={selected?.id}
        onSelect={handleSelect}
        pagination={paginationProps}
        renderDetail={renderDetail}
      />
    </Box>
  );
}

