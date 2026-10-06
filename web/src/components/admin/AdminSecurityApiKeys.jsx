/**
 * @fileoverview Gestion des cles API machine-to-machine
 * @module components/admin/AdminSecurityApiKeys
 */

import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Badge,
  Box,
  Button,
  Callout,
  Dialog,
  Flex,
  Text,
  TextField,
} from '@radix-ui/themes';
import { AlertTriangle, Copy, KeyRound, Plus, Power, Trash2 } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR');
}

function CreateApiKeyModal({ open, onOpenChange, onSubmit, submitting }) {
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ name: name.trim() });
    setName('');
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 460 }}>
        <Dialog.Title>Nouvelle cle API</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="4">
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Nom *</Text>
              <TextField.Root
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Serveur MCP production"
                required
              />
            </label>
          </Flex>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">Annuler</Button>
            </Dialog.Close>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? 'Creation...' : 'Creer'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

CreateApiKeyModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

function ConfirmRevokeModal({ open, onOpenChange, item, onConfirm, submitting }) {
  if (!item) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 420 }}>
        <Dialog.Title>Revoquer la cle API</Dialog.Title>
        <Text size="2" mt="3" as="p">
          Revoquer definitivement <Text weight="bold">{item.name}</Text> ({item.key_prefix}) ?
        </Text>
        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray" type="button">Annuler</Button>
          </Dialog.Close>
          <Button color="red" disabled={submitting} onClick={onConfirm}>
            {submitting ? 'Revoke...' : 'Revoquer'}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

ConfirmRevokeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  item: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

export default function AdminSecurityApiKeys({ items, loading, onCreate, onPatch, onRevoke }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdSecret, setCreatedSecret] = useState(null);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      const created = await onCreate(payload);
      setCreateOpen(false);
      setCreatedSecret(created?.secret || null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item) => {
    setSubmitting(true);
    try {
      await onPatch(item.id, { is_active: !item.is_active });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    setSubmitting(true);
    try {
      await onRevoke(selected.id);
      setRevokeOpen(false);
      setSelected(null);
    } finally {
      setSubmitting(false);
    }
  };

  const copySecret = async () => {
    if (!createdSecret || !navigator?.clipboard) return;
    await navigator.clipboard.writeText(createdSecret);
  };

  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Nom',
      render: (i) => (
        <Box>
          <Text size="2" weight="medium">{i.name}</Text>
          <Text size="1" color="gray" as="div" style={{ fontFamily: 'monospace' }}>{i.key_prefix}</Text>
        </Box>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      width: 90,
      render: (i) => (
        <Badge size="1" variant="soft" color="gray">{i.role_code || 'MCP'}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      width: 110,
      render: (i) => (
        <Badge size="1" variant="soft" color={i.is_active ? 'green' : 'red'}>
          {i.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'expires_at',
      header: 'Expiration',
      width: 170,
      render: (i) => <Text size="1">{formatDate(i.expires_at)}</Text>,
    },
    {
      key: 'last_used_at',
      header: 'Derniere utilisation',
      width: 170,
      render: (i) => <Text size="1">{formatDate(i.last_used_at)}</Text>,
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      width: 170,
      render: (i) => (
        <Flex justify="end" gap="2">
          <Button
            size="1"
            variant="soft"
            color={i.is_active ? 'orange' : 'green'}
            disabled={submitting}
            onClick={() => handleToggleActive(i)}
          >
            <Power size={12} /> {i.is_active ? 'Desactiver' : 'Activer'}
          </Button>
          <Button
            size="1"
            variant="soft"
            color="red"
            disabled={submitting}
            onClick={() => {
              setSelected(i);
              setRevokeOpen(true);
            }}
          >
            <Trash2 size={12} /> Revoquer
          </Button>
        </Flex>
      ),
    },
  ], [submitting]);

  return (
    <Box>
      <CreateApiKeyModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        submitting={submitting}
      />
      <ConfirmRevokeModal
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        item={selected}
        onConfirm={handleRevoke}
        submitting={submitting}
      />

      {createdSecret && (
        <Callout.Root color="amber" mb="3">
          <Callout.Icon><AlertTriangle size={14} /></Callout.Icon>
          <Callout.Text>
            Secret genere une seule fois. Copiez-le maintenant puis stockez-le dans un coffre.
          </Callout.Text>
          <Flex mt="2" gap="2" align="center" wrap="wrap">
            <Text size="1" style={{ fontFamily: 'monospace' }}>{createdSecret}</Text>
            <Button size="1" variant="soft" onClick={copySecret}><Copy size={12} /> Copier</Button>
            <Button size="1" variant="ghost" color="gray" onClick={() => setCreatedSecret(null)}>Masquer</Button>
          </Flex>
        </Callout.Root>
      )}

      <DataTable
        headerProps={{
          icon: KeyRound,
          title: 'Cles API',
          count: items.length,
          showSearchInput: false,
          actions: (
            <Button size="2" onClick={() => setCreateOpen(true)}>
              <Plus size={14} /> Nouvelle cle API
            </Button>
          ),
        }}
        columns={columns}
        data={items}
        loading={loading}
        emptyState={{
          icon: KeyRound,
          title: 'Aucune cle API',
          description: 'Creez une cle pour les integrations machine-to-machine.',
        }}
      />
    </Box>
  );
}

AdminSecurityApiKeys.propTypes = {
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
  onPatch: PropTypes.func.isRequired,
  onRevoke: PropTypes.func.isRequired,
};
