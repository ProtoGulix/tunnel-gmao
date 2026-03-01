/**
 * @fileoverview Detail d'une famille selectionnee
 * @module components/stock/StockFamilyDetail
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Text, TextField } from '@radix-ui/themes';
import StockSubFamiliesTable from '@/components/stock/StockSubFamiliesTable';
import StockSubFamilyEditor from '@/components/stock/StockSubFamilyEditor';
import { useStockFamilyDetail } from '@/hooks/stock/useStockFamilyDetail';

export default function StockFamilyDetail({ familyCode }) {
  const { subFamilies, loading, search, setSearch, stats, updateSubFamily } = useStockFamilyDetail(familyCode);
  const [selectedSubFamily, setSelectedSubFamily] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleEditSubFamily = (row) => {
    setSelectedSubFamily(row);
  };

  const handleSaveSubFamily = async (updates) => {
    if (!selectedSubFamily) return;

    try {
      setSaving(true);
      await updateSubFamily(selectedSubFamily.code, updates);
      setSelectedSubFamily(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Flex direction="column" gap="2" mb="3">
        <TextField.Root
          placeholder="Rechercher une sous-famille..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Text size="1" color="gray">
          {stats.withTemplate} avec modele - {stats.withoutTemplate} sans modele
        </Text>
      </Flex>

      <StockSubFamiliesTable
        subFamilies={subFamilies}
        loading={loading}
        onEdit={handleEditSubFamily}
      />

      <Box mt="4">
        <StockSubFamilyEditor
          subFamily={selectedSubFamily}
          onSave={handleSaveSubFamily}
          onCancel={() => setSelectedSubFamily(null)}
          saving={saving}
        />
      </Box>
    </>
  );
}

StockFamilyDetail.propTypes = {
  familyCode: PropTypes.string.isRequired,
};
