/**
 * @fileoverview Section admin — raisons d'audit (référentiel du picker de raisons)
 * @module components/admin/AdminAuditReasonsSection
 */

import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Text } from '@radix-ui/themes';
import { Pencil, Plus } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { createAuditReason, updateAuditReason, toggleAuditReasonActive } from '@/api/adminAuditRules';
import { CreateReasonModal, EditReasonModal, CATEGORY_LABELS, EMPTY_REASON_FORM } from '@/components/admin/AdminAuditReasonModals';
import { ENTITY_LABELS } from '@/config/auditRuleEntities';

function ColorSwatch({ color }) {
  if (!color) return <Text color="gray">—</Text>;
  return (
    <Flex align="center" gap="2">
      <Box style={{ width: 14, height: 14, borderRadius: 3, background: color, border: '1px solid var(--gray-5)' }} />
      <Text size="1" color="gray">{color}</Text>
    </Flex>
  );
}
ColorSwatch.propTypes = { color: PropTypes.string };

export default function AdminAuditReasonsSection({ reasons, loading, onRefresh }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_REASON_FORM);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = useCallback(() => { setForm(EMPTY_REASON_FORM); setCreateOpen(true); }, []);

  const openEdit = useCallback((reason) => {
    setSelected(reason);
    setForm({
      code: reason.code,
      label: reason.label,
      category: reason.category,
      entity_types: reason.entity_types || [],
      color: reason.color || '',
      description: reason.description || '',
    });
    setEditOpen(true);
  }, []);

  const handleCreate = useCallback(async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAuditReason({
        code: form.code.trim(),
        label: form.label.trim(),
        category: form.category,
        entity_types: form.entity_types.length ? form.entity_types : null,
        color: form.color.trim() || null,
        description: form.description.trim() || null,
      });
      setCreateOpen(false);
      await onRefresh();
    } finally {
      setSubmitting(false);
    }
  }, [form, onRefresh]);

  const handleEdit = useCallback(async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateAuditReason(selected.id, {
        label: form.label.trim(),
        category: form.category,
        entity_types: form.entity_types.length ? form.entity_types : null,
        color: form.color.trim() || null,
        description: form.description.trim() || null,
      });
      setEditOpen(false);
      await onRefresh();
    } finally {
      setSubmitting(false);
    }
  }, [form, selected, onRefresh]);

  const handleToggleActive = useCallback(async (id, isActive) => {
    await toggleAuditReasonActive(id, isActive);
    await onRefresh();
  }, [onRefresh]);

  const columns = useMemo(() => [
    { key: 'code', header: 'Code', width: 180, render: (r) => <Text size="2" style={{ fontFamily: 'monospace' }}>{r.code}</Text> },
    { key: 'label', header: 'Libellé', render: (r) => <Text size="2" weight="medium">{r.label}</Text> },
    {
      key: 'category', header: 'Catégorie', width: 120,
      render: (r) => <Badge variant="soft" color="blue">{CATEGORY_LABELS[r.category] ?? r.category}</Badge>,
    },
    {
      key: 'entity_types', header: 'Entités', width: 220,
      render: (r) => (r.entity_types?.length
        ? <Flex gap="1" wrap="wrap">{r.entity_types.map((e) => <Badge key={e} variant="soft" color="gray">{ENTITY_LABELS[e] ?? e}</Badge>)}</Flex>
        : <Text size="2" color="gray">Toutes</Text>),
    },
    { key: 'color', header: 'Couleur', width: 120, render: (r) => <ColorSwatch color={r.color} /> },
    {
      key: 'is_active', header: 'Statut', width: 90,
      render: (r) => <Badge variant="soft" color={r.is_active ? 'green' : 'red'}>{r.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions', header: '', align: 'end', width: 140,
      render: (r) => (
        <Flex gap="1">
          <Button size="1" variant="soft" onClick={() => openEdit(r)}><Pencil size={12} /></Button>
          <Button size="1" variant="soft" color={r.is_active ? 'red' : 'green'} onClick={() => handleToggleActive(r.id, !r.is_active)}>
            {r.is_active ? 'Désactiver' : 'Activer'}
          </Button>
        </Flex>
      ),
    },
  ], [openEdit, handleToggleActive]);

  return (
    <Box mt="6">
      <CreateReasonModal open={createOpen} onOpenChange={setCreateOpen} form={form} setForm={setForm} onSubmit={handleCreate} submitting={submitting} />
      <EditReasonModal open={editOpen} onOpenChange={setEditOpen} form={form} setForm={setForm} onSubmit={handleEdit} submitting={submitting} />

      <DataTable
        headerProps={{
          title: "Raisons d'audit",
          count: reasons.length,
          showSearchInput: false,
          actions: (
            <Button size="2" onClick={openCreate}><Plus size={14} /> Nouvelle raison</Button>
          ),
        }}
        columns={columns}
        data={reasons}
        loading={loading}
        emptyState={{ title: 'Aucune raison', description: '' }}
      />
    </Box>
  );
}

AdminAuditReasonsSection.propTypes = {
  reasons: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onRefresh: PropTypes.func.isRequired,
};
