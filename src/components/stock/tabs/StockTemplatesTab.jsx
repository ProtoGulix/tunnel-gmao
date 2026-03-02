/**
 * @fileoverview Onglet gestion des trames de reference de pieces
 * @module components/stock/tabs/StockTemplatesTab
 */

import { useState } from 'react';
import { Shapes } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import TwoPanelLayout from '@/components/ui/TwoPanelLayout';
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

  if (error) return <ErrorState error={error} />;
  if (loading) return <LoadingState message="Chargement des trames de reference..." />;

  const handleCreateNew = () => { setSelected(null); setShowCreate(true); };
  const handleSelect = (tpl) => { setSelected(tpl); setShowCreate(false); };

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

  const rightPanel = showCreate
    ? <PartTemplateCreateForm onSave={handleSave} onCancel={() => setShowCreate(false)} saving={saving} />
    : selected
    ? <PartTemplateDetail template={selected} onDelete={handleDelete} deleting={deleting} />
    : null;

  return (
    <TwoPanelLayout
      left={
        <PartTemplatesList
          templates={templates}
          loading={loading}
          selectedId={selected?.id}
          onSelect={handleSelect}
          onCreateNew={handleCreateNew}
        />
      }
      right={rightPanel}
      emptyState={
        <EmptyState
          icon={<Shapes size={48} />}
          title="Aucune trame selectionnee"
          description="Selectionnez une trame de reference dans la liste ou creez-en une nouvelle."
        />
      }
    />
  );
}
