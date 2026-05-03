/**
 * @fileoverview Sections référentiel interventions (types, statuts)
 * @module components/admin/AdminRefInterventionsSection
 */

import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Text, TextField, Dialog } from '@radix-ui/themes';
import { Lock, Plus, Pencil } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

function ImmutableCode({ code }) {
  return (
    <Flex align="center" gap="1">
      <Text size="2" color="gray" style={{ fontFamily: 'monospace' }}>{code}</Text>
      <Lock size={11} color="var(--gray-8)" />
    </Flex>
  );
}

function ColorSwatch({ color }) {
  if (!color) return <Text color="gray">—</Text>;
  return (
    <Flex align="center" gap="2">
      <Box style={{ width: 14, height: 14, borderRadius: 3, background: color, border: '1px solid var(--gray-5)' }} />
      <Text size="1" color="gray">{color}</Text>
    </Flex>
  );
}

// ---- Section types d'intervention ----
export function InterventionTypesSection({ items, loading, onCreate, onUpdate, onToggleActive }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ label: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = useCallback(async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onCreate(form); setCreateOpen(false); setForm({ label: '' }); }
    finally { setSubmitting(false); }
  }, [form, onCreate]);

  const handleEdit = useCallback(async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onUpdate(selected.id, form); setEditOpen(false); }
    finally { setSubmitting(false); }
  }, [form, selected, onUpdate]);

  const openEdit = (item) => { setSelected(item); setForm({ label: item.label || '' }); setEditOpen(true); };

  const columns = useMemo(() => [
    { key: 'label', header: 'Libellé', render: (i) => <Text size="2" weight="medium">{i.label}</Text> },
    {
      key: 'status', header: 'Statut', width: 90,
      render: (i) => <Badge variant="soft" color={i.is_active ? 'green' : 'red'}>{i.is_active ? 'Actif' : 'Inactif'}</Badge>,
    },
    {
      key: 'actions', header: '', align: 'end', width: 120,
      render: (i) => (
        <Flex gap="1">
          <Button size="1" variant="soft" onClick={() => openEdit(i)}><Pencil size={12} /></Button>
          <Button size="1" variant="soft" color={i.is_active ? 'red' : 'green'} onClick={() => onToggleActive(i.id, !i.is_active)}>
            {i.is_active ? 'Désactiver' : 'Activer'}
          </Button>
        </Flex>
      ),
    },
  ], [onToggleActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const LabelForm = ({ onSubmit, submitLabel }) => (
    <form onSubmit={onSubmit}>
      <Flex direction="column" gap="3" mt="4">
        <label>
          <Text size="2" weight="bold" mb="1" as="div">Libellé *</Text>
          <TextField.Root value={form.label} onChange={(e) => setForm({ label: e.target.value })} required />
        </label>
      </Flex>
      <Flex gap="3" mt="4" justify="end">
        <Dialog.Close><Button variant="soft" color="gray" type="button">Annuler</Button></Dialog.Close>
        <Button type="submit" disabled={submitting}>{submitting ? 'En cours...' : submitLabel}</Button>
      </Flex>
    </form>
  );

  return (
    <Box mb="6">
      <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
        <Dialog.Content style={{ maxWidth: 380 }}>
          <Dialog.Title>Nouveau type d'intervention</Dialog.Title>
          <LabelForm onSubmit={handleCreate} submitLabel="Créer" />
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Content style={{ maxWidth: 380 }}>
          <Dialog.Title>Modifier le type</Dialog.Title>
          <LabelForm onSubmit={handleEdit} submitLabel="Enregistrer" />
        </Dialog.Content>
      </Dialog.Root>

      <DataTable
        headerProps={{
          title: "Types d'intervention",
          count: items.length,
          showSearchInput: false,
          actions: <Button size="2" onClick={() => { setForm({ label: '' }); setCreateOpen(true); }}><Plus size={14} /> Nouveau type</Button>,
        }}
        columns={columns}
        data={items}
        loading={loading}
        emptyState={{ title: 'Aucun type', description: '' }}
      />
    </Box>
  );
}

// ---- Section statuts d'intervention (lecture + modif label+couleur seulement) ----
export function InterventionStatusesSection({ items, loading, onUpdate }) {
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ label: '', color: '' });
  const [submitting, setSubmitting] = useState(false);

  const openEdit = (item) => {
    setSelected(item);
    setForm({ label: item.label || '', color: item.color || '' });
    setEditOpen(true);
  };

  const handleEdit = useCallback(async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onUpdate(selected.id, form); setEditOpen(false); }
    finally { setSubmitting(false); }
  }, [form, selected, onUpdate]);

  const columns = useMemo(() => [
    { key: 'code', header: 'Code', width: 140, render: (i) => <ImmutableCode code={i.code} /> },
    { key: 'label', header: 'Libellé', render: (i) => <Text size="2" weight="medium">{i.label}</Text> },
    { key: 'color', header: 'Couleur', width: 140, render: (i) => <ColorSwatch color={i.color} /> },
    {
      key: 'actions', header: '', align: 'end', width: 80,
      render: (i) => (
        <Button size="1" variant="soft" onClick={() => openEdit(i)}><Pencil size={12} /></Button>
      ),
    },
  ], []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box mb="6">
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Content style={{ maxWidth: 400 }}>
          <Dialog.Title>Modifier le statut</Dialog.Title>
          <form onSubmit={handleEdit}>
            <Flex direction="column" gap="3" mt="4">
              <label>
                <Text size="2" weight="bold" mb="1" as="div">Libellé *</Text>
                <TextField.Root value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} required />
              </label>
              <label>
                <Text size="2" weight="bold" mb="1" as="div">Couleur</Text>
                <Flex align="center" gap="2">
                  <input type="color" value={form.color || '#3b82f6'} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                    style={{ width: 36, height: 32, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
                  <TextField.Root value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} placeholder="#3b82f6" style={{ flex: 1 }} />
                </Flex>
              </label>
            </Flex>
            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close><Button variant="soft" color="gray" type="button">Annuler</Button></Dialog.Close>
              <Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </Flex>
          </form>
        </Dialog.Content>
      </Dialog.Root>

      <DataTable
        headerProps={{ title: "Statuts d'intervention", count: items.length, showSearchInput: false }}
        columns={columns}
        data={items}
        loading={loading}
        emptyState={{ title: 'Aucun statut', description: '' }}
      />
    </Box>
  );
}

InterventionTypesSection.propTypes = {
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onToggleActive: PropTypes.func.isRequired,
};

InterventionStatusesSection.propTypes = {
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onUpdate: PropTypes.func.isRequired,
};
