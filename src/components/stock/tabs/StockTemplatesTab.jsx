/**
 * @fileoverview Onglet gestion des modeles de pieces
 * @module components/stock/tabs/StockTemplatesTab
 */

import { useState } from 'react';
import { Box, Flex, Separator } from '@radix-ui/themes';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import PartTemplatesList from '@/components/stock/PartTemplatesList';
import PartTemplateDetail from '@/components/stock/PartTemplateDetail';
import PartTemplateCreateForm from '@/components/stock/PartTemplateCreateForm';
import { usePartTemplates } from '@/hooks/stock/usePartTemplates';

export default function StockTemplatesTab() {
  const { templates, loading, error, addTemplate, removeTemplate } = usePartTemplates();
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCreateNew = () => {
    setSelected(null);
    setShowCreate(true);
  };

  const handleSelect = (tpl) => {
    setSelected(tpl);
    setShowCreate(false);
  };

  const handleSave = async (payload) => {
    try {
      setSaving(true);
      const created = await addTemplate(payload);
      setShowCreate(false);
      setSelected(created);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId) => {
    try {
      setDeleting(true);
      await removeTemplate(templateId);
      setSelected(null);
    } finally {
      setDeleting(false);
    }
  };

  if (error) {
    return <ErrorState error={error} />;
  }

  if (loading) {
    return <LoadingState message="Chargement des modeles..." />;
  }

  const showRight = selected || showCreate;

  return (
    <Flex gap="4" direction={{ initial: 'column', md: 'row' }}>
      <Box style={{ flex: showRight ? 1 : 3 }}>
        <PartTemplatesList
          templates={templates}
          loading={loading}
          selectedId={selected?.id}
          onSelect={handleSelect}
          onCreateNew={handleCreateNew}
        />
      </Box>

      {showRight && (
        <>
          <Separator orientation="vertical" />
          <Box style={{ flex: 2 }}>
            {showCreate && (
              <PartTemplateCreateForm
                onSave={handleSave}
                onCancel={() => setShowCreate(false)}
                saving={saving}
              />
            )}
            {!showCreate && selected && (
              <PartTemplateDetail
                template={selected}
                onDelete={handleDelete}
                deleting={deleting}
              />
            )}
          </Box>
        </>
      )}
    </Flex>
  );
}
