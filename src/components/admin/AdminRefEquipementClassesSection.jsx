/**
 * @fileoverview Section référentiel — classes d'équipement
 * @module components/admin/AdminRefEquipementClassesSection
 */

import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Flex, Text, TextField, Dialog, AlertDialog } from '@radix-ui/themes';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

export function EquipementClassesSection({ items, loading, onCreate, onUpdate, onDelete }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ code: '', label: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setForm({ code: '', label: '', description: '' });
    setCreateOpen(true);
  };

  const openEdit = (item) => {
    setSelected(item);
    setForm({ code: item.code || '', label: item.label || '', description: item.description || '' });
    setEditOpen(true);
  };

  const openDelete = (item) => {
    setSelected(item);
    setDeleteOpen(true);
  };

  const handleCreate = useCallback(async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate({ code: form.code.trim().toUpperCase(), label: form.label.trim(), description: form.description.trim() || undefined });
      setCreateOpen(false);
    } finally {
      setSubmitting(false);
    }
  }, [form, onCreate]);

  const handleEdit = useCallback(async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onUpdate(selected.id, { code: form.code.trim().toUpperCase(), label: form.label.trim(), description: form.description.trim() || undefined });
      setEditOpen(false);
    } finally {
      setSubmitting(false);
    }
  }, [form, selected, onUpdate]);

  const handleDelete = useCallback(async () => {
    setSubmitting(true);
    try {
      await onDelete(selected.id);
      setDeleteOpen(false);
    } finally {
      setSubmitting(false);
    }
  }, [selected, onDelete]);

  const ClassForm = ({ onSubmit, submitLabel }) => (
    <form onSubmit={onSubmit}>
      <Flex direction="column" gap="3" mt="4">
        <label>
          <Text size="2" weight="bold" mb="1" as="div">Code * (ex: ELEC)</Text>
          <TextField.Root
            value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            placeholder="CODE"
            required
          />
        </label>
        <label>
          <Text size="2" weight="bold" mb="1" as="div">Libellé *</Text>
          <TextField.Root
            value={form.label}
            onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
            placeholder="Ex : Électrique"
            required
          />
        </label>
        <label>
          <Text size="2" weight="bold" mb="1" as="div">Description</Text>
          <TextField.Root
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description optionnelle"
          />
        </label>
      </Flex>
      <Flex gap="3" mt="4" justify="end">
        <Dialog.Close>
          <Button variant="soft" color="gray" type="button">Annuler</Button>
        </Dialog.Close>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'En cours...' : submitLabel}
        </Button>
      </Flex>
    </form>
  );

  const columns = useMemo(() => [
    {
      key: 'code',
      header: 'Code',
      width: 120,
      render: (i) => <Text size="2" style={{ fontFamily: 'monospace' }} color="gray">{i.code}</Text>,
    },
    {
      key: 'label',
      header: 'Libellé',
      render: (i) => <Text size="2" weight="medium">{i.label}</Text>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (i) => <Text size="2" color="gray">{i.description || '—'}</Text>,
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      width: 100,
      render: (i) => (
        <Flex gap="1">
          <Button size="1" variant="soft" onClick={() => openEdit(i)}>
            <Pencil size={12} />
          </Button>
          <Button size="1" variant="soft" color="red" onClick={() => openDelete(i)}>
            <Trash2 size={12} />
          </Button>
        </Flex>
      ),
    },
  ], []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box mb="6">
      {/* Création */}
      <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
        <Dialog.Content style={{ maxWidth: 420 }}>
          <Dialog.Title>Nouvelle classe d'équipement</Dialog.Title>
          <ClassForm onSubmit={handleCreate} submitLabel="Créer" />
        </Dialog.Content>
      </Dialog.Root>

      {/* Édition */}
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Content style={{ maxWidth: 420 }}>
          <Dialog.Title>Modifier la classe</Dialog.Title>
          <ClassForm onSubmit={handleEdit} submitLabel="Enregistrer" />
        </Dialog.Content>
      </Dialog.Root>

      {/* Confirmation suppression */}
      <AlertDialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialog.Content style={{ maxWidth: 420 }}>
          <AlertDialog.Title>Supprimer la classe</AlertDialog.Title>
          <AlertDialog.Description>
            Supprimer <strong>{selected?.label}</strong> ({selected?.code}) ? Cette action est irréversible.
            La suppression échouera si des équipements utilisent cette classe.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">Annuler</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="red" onClick={handleDelete} disabled={submitting}>
                {submitting ? 'Suppression...' : 'Supprimer'}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      <DataTable
        headerProps={{
          title: "Classes d'équipement",
          count: items.length,
          showSearchInput: false,
          actions: (
            <Button size="2" onClick={openCreate}>
              <Plus size={14} /> Nouvelle classe
            </Button>
          ),
        }}
        columns={columns}
        data={items}
        loading={loading}
        emptyState={{ title: 'Aucune classe', description: "Créez une première classe d'équipement" }}
      />
    </Box>
  );
}

EquipementClassesSection.propTypes = {
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
