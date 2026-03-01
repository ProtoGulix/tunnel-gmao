/**
 * @fileoverview Onglet familles et sous-familles
 * @module components/stock/tabs/StockFamiliesTab
 */

import { useState } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import StockFamiliesTable from '@/components/stock/StockFamiliesTable';
import StockFamilyDetail from '@/components/stock/StockFamilyDetail';
import { useStockFamilies } from '@/hooks/stock/useStockFamilies';

export default function StockFamiliesTab() {
  const { families, loading: familiesLoading, error: familiesError, refresh: refreshFamilies } = useStockFamilies();
  const [selectedFamily, setSelectedFamily] = useState('');

  const handleSelectFamily = (row) => {
    setSelectedFamily(row.family_code);
  };

  const handleRetry = () => {
    refreshFamilies();
  };

  if (familiesError) {
    return <ErrorState error={familiesError} onRetry={handleRetry} />;
  }

  if (familiesLoading) {
    return <LoadingState message="Chargement des familles..." />;
  }

  return (
    <Box>
      <Text size="2" color="gray">
        Les familles sont deduites des sous-familles et ne peuvent pas etre editees directement.
      </Text>

      <Flex direction={{ initial: 'column', md: 'row' }} gap="4" mt="4">
        <Box style={{ flex: 1 }}>
          <StockFamiliesTable
            families={families}
            loading={familiesLoading}
            selectedFamily={selectedFamily}
            onSelectFamily={handleSelectFamily}
          />
        </Box>

        <Box style={{ flex: 2 }}>
          {selectedFamily && <StockFamilyDetail familyCode={selectedFamily} />}
        </Box>
      </Flex>
    </Box>
  );
}
