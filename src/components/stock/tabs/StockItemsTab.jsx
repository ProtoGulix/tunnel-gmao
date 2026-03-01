/**
 * @fileoverview Onglet pieces referencees
 * @module components/stock/tabs/StockItemsTab
 */

import { useMemo } from 'react';
import { Box, Flex, Select, Text } from '@radix-ui/themes';
import { Package } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import ErrorState from '@/components/ui/ErrorState';
import { useStockItems } from '@/hooks/stock/useStockItems';

const buildColumns = () => [
  { key: 'ref', header: 'Reference', render: (row) => row.ref },
  { key: 'name', header: 'Nom', render: (row) => row.name },
  { key: 'family_code', header: 'Famille', width: 90, render: (row) => row.family_code },
  { key: 'sub_family_code', header: 'Sous-famille', width: 120, render: (row) => row.sub_family_code },
  { key: 'spec', header: 'Spec', width: 100, render: (row) => row.spec || '-' },
  { key: 'dimension', header: 'Dimension', width: 120, render: (row) => row.dimension || '-' },
  { key: 'quantity', header: 'Stock', width: 80, render: (row) => row.quantity ?? 0 },
  { key: 'unit', header: 'Unite', width: 80, render: (row) => row.unit || '-' },
  { key: 'location', header: 'Emplacement', width: 120, render: (row) => row.location || '-' },
  { 
    key: 'preferred_supplier', 
    header: 'Fournisseur pref.', 
    width: 150,
    render: (row) => row.preferred_supplier?.supplier_name || '-',
  },
];

export default function StockItemsTab() {
  const {
    items,
    loading,
    error,
    search,
    setSearch,
    familyCode,
    setFamilyCode,
    subFamilyCode,
    setSubFamilyCode,
    facets,
    pagination,
    goToPage,
    changePageSize,
    refresh,
  } = useStockItems();

  const selectedFamily = useMemo(() => {
    return facets.families.find((f) => f.code === familyCode);
  }, [facets, familyCode]);

  const columns = useMemo(buildColumns, []);

  const familyValue = familyCode || 'all';
  const subFamilyValue = subFamilyCode || 'all';

  const handleFamilyChange = (value) => {
    const nextFamily = value === 'all' ? '' : value;
    setFamilyCode(nextFamily);
    setSubFamilyCode('');
  };

  const handleSubFamilyChange = (value) => {
    setSubFamilyCode(value === 'all' ? '' : value);
  };

  if (error) {
    return <ErrorState error={error} onRetry={refresh} />;
  }

  return (
    <DataTable
      headerProps={{
        icon: Package,
        title: 'Pieces referencees',
        count: pagination.total,
        searchValue: search,
        onSearchChange: setSearch,
        onRefresh: refresh,
        loading,
        actions: (
          <Flex align="end" gap="3" wrap="wrap">
            <Box style={{ minWidth: 180 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>
                Famille
              </Text>
              <Select.Root value={familyValue} onValueChange={handleFamilyChange}>
                <Select.Trigger variant="soft" />
                <Select.Content>
                  <Select.Item value="all">Toutes</Select.Item>
                  {facets.families.map((family) => (
                    <Select.Item key={family.code} value={family.code}>
                      {family.code} ({family.count})
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            <Box style={{ minWidth: 200 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>
                Sous-famille
              </Text>
              <Select.Root value={subFamilyValue} onValueChange={handleSubFamilyChange}>
                <Select.Trigger variant="soft" />
                <Select.Content>
                  <Select.Item value="all">Toutes</Select.Item>
                  {selectedFamily?.sub_families?.map((sub) => (
                    <Select.Item key={sub.code} value={sub.code}>
                      {sub.label} ({sub.count})
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
          </Flex>
        ),
      }}
      columns={columns}
      data={items}
      loading={loading}
      emptyState={{
        icon: Package,
        title: 'Aucune piece',
        description: 'Aucune piece referencee ne correspond a la recherche.',
      }}
      pagination={
        pagination.totalPages > 1
          ? {
              currentPage: pagination.page,
              total: pagination.total,
              pageSize: pagination.pageSize,
              totalPages: pagination.totalPages,
              onPageChange: goToPage,
              onPageSizeChange: changePageSize,
              pageSizeOptions: [50, 100, 200],
            }
          : undefined
      }
    />
  );
}
