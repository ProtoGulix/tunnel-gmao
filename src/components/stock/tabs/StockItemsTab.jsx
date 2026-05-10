/**
 * @fileoverview Onglet pièces référencées — master-detail
 * @module components/stock/tabs/StockItemsTab
 */

import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Select, Text } from '@radix-ui/themes';
import { Factory, Package, Plus } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import StockDetailPanel from '@/components/stock/StockDetailPanel';
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
    <Flex gap="2" wrap="wrap">
      <Select.Root value={familyCode || ALL} onValueChange={(v) => onFamilyChange(v === ALL ? '' : v)} size="1">
        <Select.Trigger placeholder="Toutes les familles" variant={familyCode ? 'soft' : 'surface'} color={familyCode ? 'blue' : undefined} />
        <Select.Content>
          <Select.Item value={ALL}>Toutes les familles</Select.Item>
          {facets.families.map((f) => (
            <Select.Item key={f.code} value={f.code}>{f.code}{f.label ? ` — ${f.label}` : ''}</Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <Select.Root value={subFamilyCode || ALL} onValueChange={(v) => onSubFamilyChange(v === ALL ? '' : v)} disabled={subFamilies.length === 0} size="1">
        <Select.Trigger placeholder="Sous-famille" variant={subFamilyCode ? 'soft' : 'surface'} color={subFamilyCode ? 'indigo' : undefined} />
        <Select.Content>
          <Select.Item value={ALL}>Toutes</Select.Item>
          {subFamilies.map((s) => (
            <Select.Item key={s.code} value={s.code}>{s.code}{s.label ? ` — ${s.label}` : ''}</Select.Item>
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

function StockBadge({ quantity, unit }) {
  if (quantity == null) return <Badge color="gray" variant="soft" size="1">Non renseigné</Badge>;
  if (quantity === 0) return <Badge color="red" variant="soft" size="1">Rupture</Badge>;
  if (quantity <= 3) return <Badge color="orange" variant="soft" size="1">Stock bas · {quantity}{unit ? ` ${unit}` : ''}</Badge>;
  return <Badge color="green" variant="soft" size="1">{quantity}{unit ? ` ${unit}` : ''}</Badge>;
}

StockBadge.propTypes = { quantity: PropTypes.number, unit: PropTypes.string };

function StockItem({ item, isSelected, onClick }) {
  const primaryMfr = item.manufacturer_refs?.[0];

  return (
    <Box
      onClick={() => onClick(item)}
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
        {/* Ligne 1 : label fabricant + nom pièce */}
        <Flex align="center" gap="2" wrap="wrap">
          {primaryMfr ? (
            <Flex align="center" gap="1" style={{ background: 'var(--violet-3)', borderRadius: 'var(--radius-2)', padding: '1px 6px' }}>
              <Factory size={11} color="var(--violet-9)" />
              <Text size="1" weight="medium" style={{ color: 'var(--violet-11)' }}>{primaryMfr.name}</Text>
              <Text size="1" weight="bold" style={{ color: 'var(--violet-11)', fontFamily: 'monospace' }}>{primaryMfr.ref}</Text>
            </Flex>
          ) : (
            <Flex align="center" gap="1" style={{ background: 'var(--gray-3)', borderRadius: 'var(--radius-2)', padding: '1px 6px' }}>
              <Factory size={11} color="var(--gray-8)" />
              <Text size="1" color="gray">Sans fabricant</Text>
            </Flex>
          )}
          <Text size="2" weight="medium" style={{ lineHeight: 1.3 }}>{item.name}</Text>
        </Flex>
        {/* Ligne 2 : ref stock, état, nb fournisseurs */}
        <Flex gap="2" align="center" wrap="wrap">
          <Badge variant="outline" color="gray" size="1" style={{ fontFamily: 'monospace', fontSize: 10 }}>{item.ref}</Badge>
          <StockBadge quantity={item.quantity} unit={item.unit} />
          {item.supplier_refs_count > 0
            ? <Badge color="blue" variant="soft" size="1">{item.supplier_refs_count} fourn.</Badge>
            : <Badge color="gray" variant="outline" size="1">À qualifier</Badge>
          }
          {!primaryMfr && item.supplier_refs_count === 0 && (
            <Badge color="orange" variant="soft" size="1">Non référencé</Badge>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

StockItem.propTypes = {
  item: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
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
  const [mode, setMode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleSearch = useCallback((v) => { setSearch(v); setUrlSearch(v); }, [setSearch, setUrlSearch]);

  const handleSelect = useCallback(async (row) => {
    if (row.id === selected?.id && mode !== 'edit') { setSelected(null); setMode(null); return; }
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
    try { setSaving(true); await createItem(data); setMode(null); }
    finally { setSaving(false); }
  };

  const handleEdit = async (data) => {
    try {
      setSaving(true);
      await editItem(selected.id, data);
      const detail = await fetchStockItemDetail(selected.id);
      setSelected(detail);
      setMode(null);
    } finally { setSaving(false); }
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

  const totalPages = pagination.totalPages ?? 1;

  const masterList = items.length === 0 && !loading ? (
    <Flex direction="column" align="center" justify="center" style={{ height: 200, padding: 24 }} gap="2">
      <Package size={28} color="var(--gray-7)" />
      <Text size="2" color="gray">Aucune pièce trouvée</Text>
    </Flex>
  ) : items.map((item) => (
    <StockItem key={item.id} item={item} isSelected={item.id === selected?.id} onClick={handleSelect} />
  ));

  const detailContent = () => {
    if (mode === 'edit' && selected) return (
      <StockItemForm item={selected} onSubmit={handleEdit} onCancel={() => setMode(null)} saving={saving} />
    );
    if (!selected) return null;
    return (
      <StockDetailPanel
        item={selected}
        onEdit={() => setMode('edit')}
        onDelete={handleDelete}
        onRefresh={handleRefreshDetail}
        onClose={() => { setSelected(null); setMode(null); }}
      />
    );
  };

  return (
    <Box pt="3">
      <Flex justify="end" mb="2">
        <Button size="2" color="blue" onClick={() => { setSelected(null); setMode('create'); }}>
          <Plus size={14} /> Ajouter
        </Button>
      </Flex>
      {mode === 'create' && (
        <Box mb="3">
          <StockItemForm onSubmit={handleCreate} onCancel={() => setMode(null)} saving={saving} />
        </Box>
      )}

      <MasterDetailLayout
        masterProps={{
          icon: Package,
          title: 'Pièces référencées',
          count: pagination.total,
          search,
          onSearchChange: handleSearch,
          loading,
          children: masterList,
          headerExtra: (
            <FamilyFilters
              facets={facets}
              familyCode={familyCode}
              onFamilyChange={handleFamilyChange}
              subFamilyCode={subFamilyCode}
              onSubFamilyChange={handleSubFamilyChange}
            />
          ),
          pagination: totalPages > 1 ? { currentPage: pagination.page, totalPages, onPageChange: goToPage } : undefined,
        }}
        detailChildren={detailContent()}
        detailLoading={detailLoading}
        emptyLabel="Sélectionnez une pièce pour voir son détail"
      />
    </Box>
  );
}
