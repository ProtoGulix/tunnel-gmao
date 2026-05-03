/**
 * @fileoverview Liste des domaines email autorisés
 * @module components/admin/AdminSecurityDomains
 */

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Callout, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { Globe, Plus, Trash2, Info } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

function AddDomainModal({ open, onOpenChange, onSubmit, submitting }) {
  const [form, setForm] = useState({ domain: '', allowed: true });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(form);
    setForm({ domain: '', allowed: true });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 380 }}>
        <Dialog.Title>Ajouter un domaine</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="4">
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Domaine *</Text>
              <TextField.Root value={form.domain} onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}
                placeholder="example.com" required />
            </label>
          </Flex>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close><Button variant="soft" color="gray" type="button">Annuler</Button></Dialog.Close>
            <Button type="submit" disabled={submitting}>{submitting ? 'Ajout...' : 'Ajouter'}</Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

AddDomainModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

function DeleteConfirmModal({ open, onOpenChange, item, onConfirm, submitting }) {
  if (!item) return null;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 360 }}>
        <Dialog.Title>Supprimer le domaine</Dialog.Title>
        <Text size="2" mt="3" as="p">
          Supprimer la règle pour le domaine <Text weight="bold">{item.domain}</Text> ?
        </Text>
        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close><Button variant="soft" color="gray">Annuler</Button></Dialog.Close>
          <Button color="red" disabled={submitting} onClick={onConfirm}>
            {submitting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

DeleteConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  item: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

export default function AdminSecurityDomains({ items, loading, onAdd, onRemove }) {
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (payload) => {
    setSubmitting(true);
    try { await onAdd(payload); setAddOpen(false); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try { await onRemove(selected.id); setDeleteOpen(false); }
    finally { setSubmitting(false); }
  };

  const columns = useMemo(() => [
    { key: 'domain', header: 'Domaine', render: (i) => <Text size="2" style={{ fontFamily: 'monospace' }}>{i.domain}</Text> },
    {
      key: 'status', header: 'Statut', width: 110,
      render: (i) => (
        <Badge variant="soft" color={i.allowed ? 'green' : 'red'} size="1">
          {i.allowed ? 'Autorisé' : 'Bloqué'}
        </Badge>
      ),
    },
    {
      key: 'actions', header: '', align: 'end', width: 80,
      render: (i) => (
        <Button size="1" variant="soft" color="red" onClick={() => { setSelected(i); setDeleteOpen(true); }}>
          <Trash2 size={12} />
        </Button>
      ),
    },
  ], []);

  return (
    <Box>
      <AddDomainModal open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAdd} submitting={submitting} />
      <DeleteConfirmModal open={deleteOpen} onOpenChange={setDeleteOpen} item={selected} onConfirm={handleDelete} submitting={submitting} />

      {items.length === 0 && !loading && (
        <Callout.Root color="blue" mb="3" size="1">
          <Callout.Icon><Info size={14} /></Callout.Icon>
          <Callout.Text>Si la liste est vide, tous les domaines sont acceptés.</Callout.Text>
        </Callout.Root>
      )}

      <DataTable
        headerProps={{
          icon: Globe,
          title: 'Domaines autorisés',
          count: items.length,
          showSearchInput: false,
          actions: (
            <Button size="2" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> Ajouter un domaine
            </Button>
          ),
        }}
        columns={columns}
        data={items}
        loading={loading}
        emptyState={{
          icon: Globe,
          title: 'Aucune règle de domaine',
          description: 'Tous les domaines email sont acceptés.',
        }}
      />
    </Box>
  );
}

AdminSecurityDomains.propTypes = {
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};
