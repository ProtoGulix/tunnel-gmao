/**
 * @fileoverview Detail d'une famille selectionnee
 * @module components/stock/StockFamilyDetail
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Flex, Text } from '@radix-ui/themes';
import { Edit2 } from 'lucide-react';
import StockSubFamiliesTable from '@/components/stock/StockSubFamiliesTable';
import StockSubFamilyForm from '@/components/stock/StockSubFamilyForm';
import { useStockFamilyDetail } from '@/hooks/stock/useStockFamilyDetail';

export default function StockFamilyDetail({ familyCode, onEdit }) {
  const { subFamilies, loading, stats, updateSubFamily, createSubFamily } =
    useStockFamilyDetail(familyCode);
  const [selectedSubFamily, setSelectedSubFamily] = useState(null);
  const [subFamilyMode, setSubFamilyMode] = useState(null); // 'create' | 'edit'
  const [saving, setSaving] = useState(false);

  const handleEditSubFamily = (row) => {
    setSelectedSubFamily(row);
    setSubFamilyMode('edit');
  };

  const handleCreateSubFamily = () => {
    setSelectedSubFamily(null);
    setSubFamilyMode('create');
  };

  const handleCancel = () => {
    setSubFamilyMode(null);
    setSelectedSubFamily(null);
  };

  const handleSave = async (data) => {
    try {
      setSaving(true);
      if (subFamilyMode === 'edit') {
        await updateSubFamily(selectedSubFamily.code, data);
      } else {
        await createSubFamily(data);
      }
      handleCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Flex justify="between" align="center" mb="2">
        <Text size="2" color="gray">
          {stats.withTemplate} avec modele - {stats.withoutTemplate} sans modele
        </Text>
        {onEdit && (
          <Button size="1" variant="soft" color="gray" onClick={onEdit}>
            <Edit2 size={12} /> Modifier la famille
          </Button>
        )}
      </Flex>

      <StockSubFamiliesTable
        subFamilies={subFamilies}
        loading={loading}
        onEdit={handleEditSubFamily}
        onCreate={handleCreateSubFamily}
      />

      {subFamilyMode && (
        <StockSubFamilyForm
          subFamily={subFamilyMode === 'edit' ? selectedSubFamily : null}
          onSubmit={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      )}
    </>
  );
}

StockFamilyDetail.propTypes = {
  familyCode: PropTypes.string.isRequired,
  onEdit: PropTypes.func,
};
