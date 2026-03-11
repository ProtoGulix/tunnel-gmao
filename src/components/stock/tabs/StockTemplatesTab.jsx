/**
 * @fileoverview Onglet gestion des trames de reference de pieces
 * @module components/stock/tabs/StockTemplatesTab
 */

import { useCallback, useState } from 'react';
import { Badge, Box, Button, Flex, Text } from '@radix-ui/themes';
import { Plus, Shapes } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import TableHeader from '@/components/ui/TableHeader';
import DataTable from '@/components/ui/DataTable';
import PartTemplateDetail from '@/components/stock/PartTemplateDetail';
import PartTemplateCreateForm from '@/components/stock/PartTemplateCreateForm';
import { usePartTemplates } from '@/hooks/stock/usePartTemplates';

const columns = [
  {
    key: 'code',
    header: 'Code',
    render: (row) => (
      <Flex direction="column" gap="1" py="1">
        <Badge variant="soft" color="blue">{row.code}</Badge>
        <Text size="1" color="gray">{row.label}</Text>
      </Flex>
    ),
  },
  {
    key: 'version',
    header: 'Version',
    width: 90,
    render: (row) => <Badge color="gray" variant="outline" size="1">v{row.version}</Badge>,
  },
  {
    key: 'fields',
    header: 'Champs',
    width: 90,
    align: 'right',
    render: (row) => (
      <Text size="2" color="gray">{row.fields?.length ?? 0}</Text>
    ),
  },
];

export default function StockTemplatesTab() {
  const { templates, loading, error, addTemplate, addVersion, removeTemplate } = usePartTemplates();
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSelect = useCallback((row) => {
    if (row.id === selected?.id && !showCreate && !showEdit) {
      setSelected(null);
      return;
    }
    setShowCreate(false);
    setShowEdit(false);
    setSelected(row);
  }, [selected, showCreate, showEdit]);

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

  const handleEdit = async (payload) => {
    try {
      setSaving(true);
      const { pattern, fields } = payload;
      const updated = await addVersion(selected.id, { pattern, fields });
      setShowEdit(false);
      setSelected((prev) => ({ ...prev, ...updated }));
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

  if (error) return <ErrorState error={error} />;
  if (loading) return <LoadingState message="Chargement des trames de reference..." />;

  const renderDetail = () => {
    if (!selected) return null;
    if (showEdit) return (
      <PartTemplateCreateForm
        template={selected}
        onSave={handleEdit}
        onCancel={() => setShowEdit(false)}
        saving={saving}
      />
    );
    return (
      <PartTemplateDetail
        template={selected}
        onEdit={() => setShowEdit(true)}
        onDelete={handleDelete}
        deleting={deleting}
      />
    );
  };

  return (
    <Box>
      <TableHeader
        icon={Shapes}
        title="Trames de reference"
        count={templates.length}
        showSearchInput={false}
        showRefreshButton={false}
        rightActions={
          <Button size="2" color="blue" onClick={() => { setSelected(null); setShowCreate(true); }}>
            <Plus size={14} /> Ajouter
          </Button>
        }
      />
      {showCreate && (
        <Box mb="3">
          <PartTemplateCreateForm
            onSave={handleSave}
            onCancel={() => setShowCreate(false)}
            saving={saving}
          />
        </Box>
      )}
      <DataTable
        columns={columns}
        data={templates}
        loading={loading}
        onRowClick={handleSelect}
        getRowKey={(row) => row.id}
        rowStyles={(row) => ({
          cursor: 'pointer',
          background: row.id === selected?.id ? 'var(--accent-3)' : undefined,
          boxShadow: row.id === selected?.id ? 'inset 3px 0 0 var(--accent-9)' : undefined,
        })}
        isRowExpanded={(row) => row.id === selected?.id && !showCreate}
        renderExpandedRow={renderDetail}
        emptyState={{ icon: Shapes, title: 'Aucune trame', description: 'Aucune trame de reference definie.' }}
      />
    </Box>
  );
}
