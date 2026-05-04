/**
 * @fileoverview Tableau catalogue des endpoints
 * @module components/admin/AdminEndpointsTable
 */

import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Button, Flex, Text, Select, Dialog, TextField, Switch } from '@radix-ui/themes';
import { RefreshCw, Shield, Database } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

const METHOD_COLORS = { GET: 'green', POST: 'blue', PATCH: 'orange', PUT: 'orange', DELETE: 'red' };

function EndpointEditModal({ open, onOpenChange, endpoint, onSubmit, submitting }) {
  const [form, setForm] = useState({ description: '', module: '', is_sensitive: false });

  useMemo(() => {
    if (endpoint) {
      setForm({
        description: endpoint.description || '',
        module: endpoint.module || '',
        is_sensitive: !!endpoint.is_sensitive,
      });
    }
  }, [endpoint]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(endpoint.id, form);
  };

  if (!endpoint) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 480 }}>
        <Dialog.Title>Modifier l'endpoint</Dialog.Title>
        <Text size="2" color="gray" mb="3" as="p">
          <Badge color={METHOD_COLORS[endpoint.method] ?? 'gray'} variant="soft">{endpoint.method}</Badge>
          {' '}{endpoint.path}
        </Text>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="2">
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Description</Text>
              <TextField.Root
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description de l'endpoint..."
              />
            </label>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Module</Text>
              <TextField.Root
                value={form.module}
                onChange={(e) => setForm((p) => ({ ...p, module: e.target.value }))}
                placeholder="Ex: interventions, stock..."
              />
            </label>
            <Flex align="center" gap="3">
              <Switch
                checked={form.is_sensitive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_sensitive: v }))}
                size="2"
              />
              <Text size="2">Sensible</Text>
            </Flex>
          </Flex>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">Annuler</Button>
            </Dialog.Close>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

EndpointEditModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  endpoint: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

export default function AdminEndpointsTable({
  endpoints,
  loading,
  filterModule,
  onFilterModuleChange,
  modules,
  onSync,
  onEditEndpoint,
  syncing,
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleEdit = async (id, payload) => {
    setSubmitting(true);
    try {
      await onEditEndpoint(id, payload);
      setEditOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(() => [
    {
      key: 'method',
      header: 'Méthode',
      width: 90,
      render: (e) => (
        <Badge color={METHOD_COLORS[e.method] ?? 'gray'} variant="soft">
          {e.method}
        </Badge>
      ),
    },
    {
      key: 'path',
      header: 'Path',
      render: (e) => <Text size="2" style={{ fontFamily: 'monospace' }}>{e.path}</Text>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (e) => <Text size="2" color="gray">{e.description || '—'}</Text>,
    },
    {
      key: 'module',
      header: 'Module',
      width: 120,
      render: (e) => e.module ? <Badge variant="outline" size="1">{e.module}</Badge> : <Text color="gray">—</Text>,
    },
    {
      key: 'sensitive',
      header: '',
      width: 40,
      render: (e) => e.is_sensitive
        ? <Shield size={14} color="var(--red-9)" title="Sensible" />
        : null,
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      width: 80,
      render: (e) => (
        <Button size="1" variant="soft" onClick={() => { setSelected(e); setEditOpen(true); }}>
          Éditer
        </Button>
      ),
    },
  ], []);

  return (
    <>
      <EndpointEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        endpoint={selected}
        onSubmit={handleEdit}
        submitting={submitting}
      />

      <DataTable
        headerProps={{
          icon: Database,
          title: 'Catalogue des endpoints',
          count: endpoints.length,
          showSearchInput: false,
          actions: (
            <Flex gap="2" align="center">
              <Select.Root value={filterModule || '__all__'} onValueChange={(v) => onFilterModuleChange(v === '__all__' ? '' : v)} size="2">
                <Select.Trigger placeholder="Tous les modules" />
                <Select.Content>
                  <Select.Item value="__all__">Tous les modules</Select.Item>
                  {modules.map((m) => (
                    <Select.Item key={m} value={m}>{m}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <Button size="2" variant="soft" onClick={onSync} disabled={syncing}>
                <RefreshCw size={14} />
                {syncing ? 'Synchronisation...' : 'Synchroniser'}
              </Button>
            </Flex>
          ),
        }}
        columns={columns}
        data={endpoints}
        loading={loading}
        emptyState={{
          icon: Database,
          title: 'Aucun endpoint',
          description: 'Lancez une synchronisation pour charger le catalogue.',
        }}
      />
    </>
  );
}

AdminEndpointsTable.propTypes = {
  endpoints: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  filterModule: PropTypes.string,
  onFilterModuleChange: PropTypes.func.isRequired,
  modules: PropTypes.array,
  onSync: PropTypes.func.isRequired,
  onEditEndpoint: PropTypes.func.isRequired,
  syncing: PropTypes.bool,
};
