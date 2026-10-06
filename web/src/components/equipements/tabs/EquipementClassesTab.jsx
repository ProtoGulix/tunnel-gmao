/**
 * @fileoverview Onglet CRUD des classes d'équipement
 * @module components/equipements/tabs/EquipementClassesTab
 */

import { useState, useMemo, useCallback } from 'react';
import { Box, Flex, Text, Button, Badge } from '@radix-ui/themes';
import { Layers, Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EquipementClassDialog from '@/components/equipements/EquipementClassDialog';
import { useEquipementClasses } from '@/hooks/equipements/useEquipementClasses';
import { useNotification } from '@/hooks/shared/useNotification';

const DEFAULT_FORM = { code: '', label: '', description: '' };

/**
 * Onglet de gestion des classes d'équipement
 * Design identique à V2
 */
export default function EquipementClassesTab() {
  const { classes, loading, error, createClass, updateClass, deleteClass } =
    useEquipementClasses();
  const { notify } = useNotification();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleOpen = useCallback((cls = null) => {
    if (cls) {
      setEditing(cls);
      setForm({
        code: cls.code || '',
        label: cls.label || '',
        description: cls.description || '',
      });
    } else {
      setEditing(null);
      setForm(DEFAULT_FORM);
    }
    setDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!form.code || !form.label) {
        notify('Code et libellé sont obligatoires', 'error');
        return;
      }
      try {
        setSubmitting(true);
        const payload = {
          code: form.code,
          label: form.label,
          description: form.description || null,
        };
        if (editing) {
          await updateClass(editing.id, payload);
          notify('Classe modifiée avec succès');
        } else {
          await createClass(payload);
          notify('Classe créée avec succès');
        }
        setDialogOpen(false);
      } catch (err) {
        notify(
          err.message || 'Erreur lors de la sauvegarde',
          'error'
        );
      } finally {
        setSubmitting(false);
      }
    },
    [form, editing, createClass, updateClass, notify]
  );

  const handleDelete = useCallback(
    async (cls) => {
      // eslint-disable-next-line no-alert
      if (
        !window.confirm(
          `Supprimer la classe "${cls.label}" ? Cette action est définitive.`
        )
      )
        return;
      try {
        await deleteClass(cls.id);
        notify('Classe supprimée avec succès');
      } catch (err) {
        if (err.response?.status === 409) {
          notify(
            'Impossible de supprimer une classe utilisée par des équipements',
            'error'
          );
        } else {
          notify(
            err.message || 'Erreur lors de la suppression',
            'error'
          );
        }
      }
    },
    [deleteClass, notify]
  );

  const columns = useMemo(
    () => [
      {
        key: 'code',
        header: 'Code',
        width: 150,
        render: (cls) => (
          <Badge variant="soft" size="2">
            {cls.code}
          </Badge>
        ),
      },
      {
        key: 'label',
        header: 'Libellé',
        render: (cls) => (
          <Text weight="medium" size="2">
            {cls.label}
          </Text>
        ),
      },
      {
        key: 'description',
        header: 'Description',
        render: (cls) => (
          <Text size="2" color="gray">
            {cls.description || '—'}
          </Text>
        ),
      },
      {
        key: 'actions',
        header: '',
        align: 'end',
        width: 100,
        render: (cls) => (
          <Flex gap="2">
            <Button
              size="1"
              variant="soft"
              color="gray"
              onClick={() => handleOpen(cls)}
            >
              <Pencil size={14} />
            </Button>
            <Button
              size="1"
              variant="soft"
              color="red"
              onClick={() => handleDelete(cls)}
            >
              <Trash2 size={14} />
            </Button>
          </Flex>
        ),
      },
    ],
    [handleOpen, handleDelete]
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <Box pt="4">
      <EquipementClassDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        form={form}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <DataTable
        headerProps={{
          icon: Layers,
          title: "Classes d'équipement",
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
          title: "Aucune classe d'équipement",
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
