/**
 * @fileoverview Onglet CRUD des classes d'équipement
 * @module components/equipements/EquipementClassesTab
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Badge,
  Dialog,
  TextField,
  TextArea,
} from '@radix-ui/themes';
import { Layers, Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import ErrorDisplay from '@/components/ErrorDisplay';
import { useApiCall } from '@/hooks/useApiCall';
import { useError } from '@/contexts/ErrorContext';
import { getApiAdapter } from '@/lib/api/adapters/provider';

const adapter = getApiAdapter();
const DEFAULT_FORM = { code: '', label: '', description: '' };

export default function EquipementClassesTab() {
  const { showError } = useError();

  // Fetch classes
  const fetchFn = useCallback(() => adapter.equipementClasses.fetchEquipementClasses(), []);
  const { data: rawClasses, loading, error, execute } = useApiCall(fetchFn);

  useEffect(() => { execute(); }, [execute]);

  const classes = Array.isArray(rawClasses) ? rawClasses : [];

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleOpen = useCallback((cls = null) => {
    if (cls) {
      setEditing(cls);
      setForm({ code: cls.code || '', label: cls.label || '', description: cls.description || '' });
    } else {
      setEditing(null);
      setForm(DEFAULT_FORM);
    }
    setDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!form.code || !form.label) {
      showError(new Error('Code et libellé sont obligatoires'));
      return;
    }
    try {
      setSubmitting(true);
      const payload = { code: form.code, label: form.label, description: form.description || null };
      if (editing) {
        await adapter.equipementClasses.updateEquipementClass(editing.id, payload);
      } else {
        await adapter.equipementClasses.createEquipementClass(payload);
      }
      setDialogOpen(false);
      await execute();
    } catch (err) {
      showError(err instanceof Error ? err : new Error('Erreur lors de la sauvegarde'));
    } finally {
      setSubmitting(false);
    }
  }, [form, editing, execute, showError]);

  const handleDelete = useCallback(async (cls) => {
    if (!window.confirm(`Supprimer la classe "${cls.label}" ? Cette action est définitive.`)) return;
    try {
      await adapter.equipementClasses.deleteEquipementClass(cls.id);
      await execute();
    } catch (err) {
      showError(err instanceof Error ? err : new Error('Erreur lors de la suppression'));
    }
  }, [execute, showError]);

  const columns = useMemo(() => [
    {
      key: 'code',
      header: 'Code',
      width: 150,
      render: (cls) => <Badge variant="soft" size="2">{cls.code}</Badge>,
    },
    {
      key: 'label',
      header: 'Libellé',
      render: (cls) => <Text weight="medium" size="2">{cls.label}</Text>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (cls) => <Text size="2" color="gray">{cls.description || '—'}</Text>,
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      width: 100,
      render: (cls) => (
        <Flex gap="2">
          <Button size="1" variant="soft" color="gray" onClick={() => handleOpen(cls)}>
            <Pencil size={14} />
          </Button>
          <Button size="1" variant="soft" color="red" onClick={() => handleDelete(cls)}>
            <Trash2 size={14} />
          </Button>
        </Flex>
      ),
    },
  ], [handleOpen, handleDelete]);

  if (error) return <ErrorDisplay error={error} />;

  return (
    <Box pt="4">
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>{editing ? 'Modifier la classe' : 'Nouvelle classe'}</Dialog.Title>
          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="3" mt="4">
              <label>
                <Text size="2" weight="bold" mb="1" as="div">Code *</Text>
                <TextField.Root
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="Ex: SCIE, PONT, CONV..."
                  required
                />
              </label>
              <label>
                <Text size="2" weight="bold" mb="1" as="div">Libellé *</Text>
                <TextField.Root
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Ex: Scie, Pont roulant..."
                  required
                />
              </label>
              <label>
                <Text size="2" weight="bold" mb="1" as="div">Description</Text>
                <TextArea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description optionnelle..."
                  rows={3}
                />
              </label>
            </Flex>
            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray" type="button">Annuler</Button>
              </Dialog.Close>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Enregistrement...' : editing ? 'Modifier' : 'Créer'}
              </Button>
            </Flex>
          </form>
        </Dialog.Content>
      </Dialog.Root>

      <DataTable
        headerProps={{
          icon: Layers,
          title: 'Classes d\'équipement',
          count: classes.length,
          showSearchInput: false,
          showResetButton: false,
          showRefreshButton: false,
          actions: (
            <Button size="2" onClick={() => handleOpen()}>
              <Plus size={16} />
              Nouvelle classe
            </Button>
          ),
        }}
        columns={columns}
        data={classes}
        loading={loading}
        emptyState={{
          icon: Layers,
          title: 'Aucune classe d\'équipement',
          description: 'Créez des classes pour catégoriser vos équipements.',
          action: (
            <Button size="2" onClick={() => handleOpen()}>
              <Plus size={16} />
              Créer une classe
            </Button>
          ),
        }}
      />
    </Box>
  );
}
