/**
 * @fileoverview Section référentiel — classes d'équipement
 * @module components/admin/AdminRefEquipementClassesSection
 */

import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Flex, Text, Dialog, AlertDialog, Badge, Tooltip } from '@radix-ui/themes';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { usePermissions } from '@/auth/usePermissions';
import { PERM } from '@/auth/permissionCodes';
import { useInterventionTypeRefs } from '@/hooks/shared/useInterventionTypeRefs';
import { typeColumns } from '@/components/admin/classTypeColumns';
import ClassForm from '@/components/admin/AdminRefEquipementClassForm';

export function EquipementClassesSection({ items, loading, onCreate, onUpdate, onSaveTypes, onDelete }) {
  const { can } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toggling, setToggling] = useState(null);
  const { activeTypes } = useInterventionTypeRefs();
  const canSetTypes = can(PERM.adminRef.replaceClassInterventionTypes);
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

  // Enregistre à chaque clic ; la liste n'est mise à jour qu'après la réponse de l'API,
  // donc en cas d'erreur la case revient d'elle-même à l'état précédent (message dans la section).
  const handleToggleType = useCallback(async (item, code, on) => {
    const current = item.allowed_intervention_types ?? [];
    const next = on ? [...current, code] : current.filter((c) => c !== code);
    setToggling(`${item.id}:${code}`);
    try {
      await onSaveTypes(item.id, next);
    } finally {
      setToggling(null);
    }
  }, [onSaveTypes]);

  const handleDelete = useCallback(async () => {
    setSubmitting(true);
    try {
      await onDelete(selected.id);
      setDeleteOpen(false);
    } finally {
      setSubmitting(false);
    }
  }, [selected, onDelete]);

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
      render: (i) => (
        <Tooltip content={i.description || 'Aucune description'}>
          <Text size="2" color="gray" as="div"
            style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {i.description || '—'}
          </Text>
        </Tooltip>
      ),
    },
    ...typeColumns({ activeTypes, canSetTypes, toggling, onToggle: handleToggleType }),
    {
      key: 'all',
      header: '',
      width: 90,
      render: (i) => ((i.allowed_intervention_types ?? []).length === 0
        ? <Badge color="gray" variant="soft" size="1">tous permis</Badge> : null),
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      width: 100,
      render: (i) => (
        <Flex gap="1">
          {can(PERM.adminRef.updateEquipementClass) && (
            <Button size="1" variant="soft" onClick={() => openEdit(i)}>
              <Pencil size={12} />
            </Button>
          )}
          {can(PERM.adminRef.removeEquipementClass) && (
            <Button size="1" variant="soft" color="red" onClick={() => openDelete(i)}>
              <Trash2 size={12} />
            </Button>
          )}
        </Flex>
      ),
    },
  ], [can, activeTypes, canSetTypes, toggling, handleToggleType]);

  return (
    <Box mb="6">
      {/* Création */}
      <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
        <Dialog.Content style={{ maxWidth: 420 }}>
          <Dialog.Title>Nouvelle classe d&apos;équipement</Dialog.Title>
          <ClassForm form={form} setForm={setForm} submitting={submitting} onSubmit={handleCreate} submitLabel="Créer" />
        </Dialog.Content>
      </Dialog.Root>

      {/* Édition */}
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Content style={{ maxWidth: 420 }}>
          <Dialog.Title>Modifier la classe</Dialog.Title>
          <ClassForm
            form={form} setForm={setForm} submitting={submitting} onSubmit={handleEdit} submitLabel="Enregistrer"
          />
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

      <Text size="1" color="gray" as="p" mb="2">
        Aucune case cochée : tous les types sont permis.
      </Text>
      <DataTable
        headerProps={{
          title: "Classes d'équipement",
          count: items.length,
          showSearchInput: false,
          actions: can(PERM.adminRef.createEquipementClass) ? (
            <Button size="2" onClick={openCreate}>
              <Plus size={14} /> Nouvelle classe
            </Button>
          ) : null,
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
  onSaveTypes: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
