/**
 * @fileoverview Onglet familles et sous-familles
 * @module components/stock/tabs/StockFamiliesTab
 */

import { useState } from 'react';
import { Box, Text } from '@radix-ui/themes';
import { Layers } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import TwoPanelLayout from '@/components/ui/TwoPanelLayout';
import StockFamiliesTable from '@/components/stock/StockFamiliesTable';
import StockFamilyDetail from '@/components/stock/StockFamilyDetail';
import { useStockFamilies } from '@/hooks/stock/useStockFamilies';

export default function StockFamiliesTab() {
  const { families, loading: familiesLoading, error: familiesError, refresh: refreshFamilies } = useStockFamilies();
  const [selectedFamily, setSelectedFamily] = useState('');

  if (familiesError) return <ErrorState error={familiesError} onRetry={refreshFamilies} />;
  if (familiesLoading) return <LoadingState message="Chargement des familles..." />;

  return (
    <Box>
      <Text size="2" color="gray">
        Les familles sont deduites des sous-familles et ne peuvent pas etre editees directement.
      </Text>

      <TwoPanelLayout
        variant="proportional"
        separator={false}
        left={
          <StockFamiliesTable
            families={families}
            loading={familiesLoading}
            selectedFamily={selectedFamily}
            onSelectFamily={(row) => setSelectedFamily(row.family_code)}
          />
        }
        right={selectedFamily ? <StockFamilyDetail familyCode={selectedFamily} /> : null}
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
