/**
 * @fileoverview Onglet pièces référencées — liste et détail
 * @module components/stock/tabs/StockItemsTab
 */

import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
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

function FamilyFilters({ facets, familyCode, onFamilyChange, subFamilyCode, onSubFamilyChange }) {
  const selectedFamily = useMemo(
    () => facets.families.find((f) => f.code === familyCode),
    [facets, familyCode]
  );
  const subFamilies = selectedFamily?.sub_families ?? [];
  return (
    <Flex direction="column" gap="2">
      <Flex gap="1" wrap="wrap" align="center">
        <Text size="1" color="gray" style={{ marginRight: 4 }}>Famille :</Text>
        <Button size="1" variant={familyCode ? 'soft' : 'solid'} color="blue" onClick={() => onFamilyChange('')}>
          Toutes
        </Button>
        {facets.families.map((f) => (
          <Button
            key={f.code}
            size="1"
            variant={familyCode === f.code ? 'solid' : 'soft'}
            color={familyCode === f.code ? 'blue' : 'gray'}
            onClick={() => onFamilyChange(f.code)}
          >
            {f.code} ({f.count})
          </Button>
        ))}
      </Flex>
      <Flex gap="1" wrap="wrap" align="center">
          <Text size="1" color="gray" style={{ marginRight: 4 }}>Sous-famille :</Text>
          <Button size="1" variant={subFamilyCode ? 'soft' : 'solid'} color="indigo" onClick={() => onSubFamilyChange('')}>
            Toutes
          </Button>
          {subFamilies.map((s) => (
            <Button
              key={s.code}
              size="1"
              variant={subFamilyCode === s.code ? 'solid' : 'soft'}
              color={subFamilyCode === s.code ? 'indigo' : 'gray'}
              onClick={() => onSubFamilyChange(s.code)}
            >
              {s.label} ({s.count})
            </Button>
          ))}
        </Flex>
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
      <StockItemDetail item={selected} onEdit={() => setMode('edit')} onDelete={handleDelete} />
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
        rightActions={
          <Button size="2" color="blue" onClick={() => { setSelected(null); setMode('create'); }}>
            <Plus size={14} /> Ajouter
          </Button>
        }
      >
        <FamilyFilters
          facets={facets}
          familyCode={familyCode}
          onFamilyChange={handleFamilyChange}
          subFamilyCode={subFamilyCode}
          onSubFamilyChange={handleSubFamilyChange}
        />
      </TableHeader>
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

