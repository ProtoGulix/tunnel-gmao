/**
 * @fileoverview Tableau IP bloquées + modal blocage
 * @module components/admin/AdminSecurityBlocklist
 */

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Dialog, Flex, Text, TextField, Select } from '@radix-ui/themes';
import { Ban, Plus, Unlock } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

const DURATION_OPTIONS = [
  { value: 'permanent', label: 'Permanent' },
  { value: '1h', label: '1 heure' },
  { value: '24h', label: '24 heures' },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
];

function durationToExpiry(duration) {
  if (duration === 'permanent' || !duration) return null;
  const now = new Date();
  const map = { '1h': 3600, '24h': 86400, '7d': 604800, '30d': 2592000 };
  const seconds = map[duration];
  if (!seconds) return null;
  return new Date(now.getTime() + seconds * 1000).toISOString();
}

function BlockIpModal({ open, onOpenChange, onSubmit, submitting }) {
  const [form, setForm] = useState({ ip: '', reason: '', duration: 'permanent' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ip: form.ip, reason: form.reason || null, expires_at: durationToExpiry(form.duration) };
    await onSubmit(payload);
    setForm({ ip: '', reason: '', duration: 'permanent' });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 420 }}>
        <Dialog.Title>Bloquer une IP</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="4">
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Adresse IP *</Text>
              <TextField.Root value={form.ip} onChange={(e) => setForm((p) => ({ ...p, ip: e.target.value }))}
                placeholder="192.168.1.1" required />
            </label>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Raison</Text>
              <TextField.Root value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Attaque brute force..." />
            </label>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Durée</Text>
              <Select.Root value={form.duration} onValueChange={(v) => setForm((p) => ({ ...p, duration: v }))}>
                <Select.Trigger style={{ width: '100%' }} />
                <Select.Content>
                  {DURATION_OPTIONS.map((o) => <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>)}
                </Select.Content>
              </Select.Root>
            </label>
          </Flex>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close><Button variant="soft" color="gray" type="button">Annuler</Button></Dialog.Close>
            <Button type="submit" color="red" disabled={submitting}>{submitting ? 'Blocage...' : 'Bloquer'}</Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

BlockIpModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

function UnblockConfirmModal({ open, onOpenChange, item, onConfirm, submitting }) {
  if (!item) return null;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 380 }}>
        <Dialog.Title>Débloquer l'IP</Dialog.Title>
        <Text size="2" mt="3" as="p">
          Débloquer l'adresse IP <Text weight="bold">{item.ip}</Text> ?
        </Text>
        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close><Button variant="soft" color="gray">Annuler</Button></Dialog.Close>
          <Button color="green" disabled={submitting} onClick={onConfirm}>
            {submitting ? 'Déblocage...' : 'Débloquer'}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

UnblockConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  item: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

export default function AdminSecurityBlocklist({ items, loading, onBlock, onUnblock }) {
  const [blockOpen, setBlockOpen] = useState(false);
  const [unblockOpen, setUnblockOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleBlock = async (payload) => {
    setSubmitting(true);
    try { await onBlock(payload); setBlockOpen(false); }
    finally { setSubmitting(false); }
  };

  const handleUnblock = async () => {
    setSubmitting(true);
    try { await onUnblock(selected.id); setUnblockOpen(false); }
    finally { setSubmitting(false); }
  };

  const columns = useMemo(() => [
    { key: 'ip', header: 'IP', width: 140, render: (i) => <Text size="2" style={{ fontFamily: 'monospace' }}>{i.ip}</Text> },
    { key: 'reason', header: 'Raison', render: (i) => <Text size="2" color="gray">{i.reason || '—'}</Text> },
    {
      key: 'expires_at', header: 'Bloqué jusqu\'au', width: 160,
      render: (i) => (
        <Badge variant="soft" color={i.expires_at ? 'orange' : 'red'} size="1">
          {i.expires_at ? new Date(i.expires_at).toLocaleString('fr-FR') : 'Permanent'}
        </Badge>
      ),
    },
    { key: 'created_by', header: 'Créé par', width: 130, render: (i) => <Text size="2">{i.created_by || '—'}</Text> },
    {
      key: 'actions', header: '', align: 'end', width: 100,
      render: (i) => (
        <Button size="1" variant="soft" color="green" onClick={() => { setSelected(i); setUnblockOpen(true); }}>
          <Unlock size={12} /> Débloquer
        </Button>
      ),
    },
  ], []);

  return (
    <Box>
      <BlockIpModal open={blockOpen} onOpenChange={setBlockOpen} onSubmit={handleBlock} submitting={submitting} />
      <UnblockConfirmModal open={unblockOpen} onOpenChange={setUnblockOpen} item={selected} onConfirm={handleUnblock} submitting={submitting} />

      <DataTable
        headerProps={{
          icon: Ban,
          title: 'IP Bloquées',
          count: items.length,
          showSearchInput: false,
          actions: (
            <Button size="2" color="red" onClick={() => setBlockOpen(true)}>
              <Plus size={14} /> Bloquer une IP
            </Button>
          ),
        }}
        columns={columns}
        data={items}
        loading={loading}
        emptyState={{ icon: Ban, title: 'Aucune IP bloquée', description: '' }}
      />
    </Box>
  );
}

AdminSecurityBlocklist.propTypes = {
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onBlock: PropTypes.func.isRequired,
  onUnblock: PropTypes.func.isRequired,
};
