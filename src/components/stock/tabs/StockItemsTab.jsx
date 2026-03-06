/**
 * @fileoverview Onglet pièces référencées — liste et détail
 * @module components/stock/tabs/StockItemsTab
 */

import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { Package, Plus } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import TableHeader from '@/components/ui/TableHeader';
import TwoPanelLayout from '@/components/ui/TwoPanelLayout';
import StockItemsList from '@/components/stock/StockItemsList';
import StockItemDetail from '@/components/stock/StockItemDetail';
import StockItemForm from '@/components/stock/StockItemForm';
import { useStockItems } from '@/hooks/stock/useStockItems';
import { useUrlSearch } from '@/hooks/shared/useUrlSearch';

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

  const handleSearch = useCallback((v) => { setSearch(v); setUrlSearch(v); }, [setSearch, setUrlSearch]);
  const handleSelect = (row) => { setSelected(row); setMode(null); };
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
      const updated = await editItem(selected.id, data);
      setSelected((prev) => ({ ...prev, ...updated }));
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

  const rightPanel = mode === 'create' ? (
    <StockItemForm onSubmit={handleCreate} onCancel={() => setMode(null)} saving={saving} />
  ) : mode === 'edit' && selected ? (
    <StockItemForm item={selected} onSubmit={handleEdit} onCancel={() => setMode(null)} saving={saving} />
  ) : selected ? (
    <StockItemDetail
      item={selected}
      onEdit={() => setMode('edit')}
      onDelete={handleDelete}
    />
  ) : null;

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
      <TwoPanelLayout
        variant="proportional"
        separator={false}
        left={
          <StockItemsList
            items={items}
            loading={loading}
            selectedId={selected?.id}
            onSelect={handleSelect}
            pagination={paginationProps}
          />
        }
        right={rightPanel}
        emptyState={
          <EmptyState
            icon={<Package size={48} />}
            title="Sélectionnez une pièce"
            description="Cliquez sur une pièce dans la liste pour afficher ses détails."
          />
        }
      />
    </Box>
  );
}

