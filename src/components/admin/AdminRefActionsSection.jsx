/**
 * @fileoverview Sections référentiel actions (catégories, sous-catégories, facteurs)
 * @module components/admin/AdminRefActionsSection
 */

import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Text, TextField, Select, Dialog } from '@radix-ui/themes';
import { Lock, Plus, Pencil } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

// ---- Badge couleur (hex ou nom de couleur CSS) ----
function ColorSwatch({ color }) {
  if (!color) return <Text color="gray">—</Text>;
  return (
    <Flex align="center" gap="2">
      <Box style={{ width: 14, height: 14, borderRadius: 3, background: color, border: '1px solid var(--gray-5)' }} />
      <Text size="1" color="gray">{color}</Text>
    </Flex>
  );
}

// ---- Code immuable avec cadenas ----
function ImmutableCode({ code }) {
  return (
    <Flex align="center" gap="1">
      <Text size="2" color="gray" style={{ fontFamily: 'monospace' }}>{code}</Text>
      <Lock size={11} color="var(--gray-8)" />
    </Flex>
  );
}

// ---- Modal générique label + couleur ----
function EditLabelColorModal({ open, onOpenChange, item, onSubmit, submitting, showColor = true }) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('');

  useMemo(() => {
    if (item) { setLabel(item.label || ''); setColor(item.color || ''); }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { label };
    if (showColor) payload.color = color;
    await onSubmit(item.id, payload);
  };

  if (!item) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 400 }}>
        <Dialog.Title>Modifier</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="4">
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Libellé *</Text>
              <TextField.Root value={label} onChange={(e) => setLabel(e.target.value)} required />
            </label>
            {showColor && (
              <label>
                <Text size="2" weight="bold" mb="1" as="div">Couleur</Text>
                <Flex align="center" gap="2">
                  <input type="color" value={color || '#3b82f6'} onChange={(e) => setColor(e.target.value)}
                    style={{ width: 36, height: 32, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
                  <TextField.Root value={color} onChange={(e) => setColor(e.target.value)} placeholder="#3b82f6" style={{ flex: 1 }} />
                </Flex>
              </label>
            )}
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

EditLabelColorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  item: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  showColor: PropTypes.bool,
};

// ---- Section catégories d'actions ----
export function ActionCategoriesSection({ items, loading, error, onUpdate, onToggleActive }) {
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleEdit = useCallback(async (id, payload) => {
    setSubmitting(true);
    try { await onUpdate(id, payload); setEditOpen(false); }
    finally { setSubmitting(false); }
  }, [onUpdate]);

  const columns = useMemo(() => [
    { key: 'code', header: 'Code', width: 120, render: (i) => <ImmutableCode code={i.code} /> },
    { key: 'label', header: 'Libellé', render: (i) => <Text size="2" weight="medium">{i.label}</Text> },
    { key: 'color', header: 'Couleur', width: 140, render: (i) => <ColorSwatch color={i.color} /> },
    {
      key: 'status', header: 'Statut', width: 90,
      render: (i) => <Badge variant="soft" color={i.is_active ? 'green' : 'red'}>{i.is_active ? 'Actif' : 'Inactif'}</Badge>,
    },
    {
      key: 'actions', header: '', align: 'end', width: 120,
      render: (i) => (
        <Flex gap="1">
          <Button size="1" variant="soft" onClick={() => { setSelected(i); setEditOpen(true); }}><Pencil size={12} /></Button>
          <Button size="1" variant="soft" color={i.is_active ? 'red' : 'green'} onClick={() => onToggleActive(i.id, !i.is_active)}>
            {i.is_active ? 'Désactiver' : 'Activer'}
          </Button>
        </Flex>
      ),
    },
  ], [onToggleActive]);

  return (
    <Box mb="6">
      <EditLabelColorModal open={editOpen} onOpenChange={setEditOpen} item={selected} onSubmit={handleEdit} submitting={submitting} />
      <DataTable
        headerProps={{ title: "Catégories d'actions", count: items.length, showSearchInput: false }}
        columns={columns}
        data={items}
        loading={loading}
        emptyState={{ title: 'Aucune catégorie', description: '' }}
      />
    </Box>
  );
}

// ---- Modal création sous-catégorie ----
function CreateSubcategoryModal({ open, onOpenChange, categories, onSubmit, submitting }) {
  const [form, setForm] = useState({ code: '', label: '', category_id: '' });

  const selectedCategory = categories.find((c) => c.id === form.category_id);
  const prefix = selectedCategory ? `${selectedCategory.code}_` : '';

  const handleCategoryChange = (id) => {
    const cat = categories.find((c) => c.id === id);
    setForm((p) => ({ ...p, category_id: id, code: cat ? `${cat.code}_` : '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(form);
    setForm({ code: '', label: '', category_id: '' });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 400 }}>
        <Dialog.Title>Nouvelle sous-catégorie</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="4">
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Catégorie parente *</Text>
              <Select.Root value={form.category_id} onValueChange={handleCategoryChange}>
                <Select.Trigger placeholder="Choisir..." style={{ width: '100%' }} />
                <Select.Content>
                  {categories.map((c) => <Select.Item key={c.id} value={c.id}>{c.code} — {c.label}</Select.Item>)}
                </Select.Content>
              </Select.Root>
            </label>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Code * <Text size="1" color="gray">(préfixe: {prefix || '—'})</Text></Text>
              <TextField.Root value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required />
            </label>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Libellé *</Text>
              <TextField.Root value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} required />
            </label>
          </Flex>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close><Button variant="soft" color="gray" type="button">Annuler</Button></Dialog.Close>
            <Button type="submit" disabled={submitting}>{submitting ? 'Création...' : 'Créer'}</Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

CreateSubcategoryModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  categories: PropTypes.array.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

// ---- Section sous-catégories d'actions ----
export function ActionSubcategoriesSection({ items, categories, loading, onCreate, onUpdate, onToggleActive }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = useCallback(async (payload) => {
    setSubmitting(true);
    try { await onCreate(payload); setCreateOpen(false); }
    finally { setSubmitting(false); }
  }, [onCreate]);

  const handleEdit = useCallback(async (id, payload) => {
    setSubmitting(true);
    try { await onUpdate(id, payload); setEditOpen(false); }
    finally { setSubmitting(false); }
  }, [onUpdate]);

  const getCategoryLabel = useCallback((id) => {
    const cat = categories.find((c) => c.id === id);
    return cat ? `${cat.code} — ${cat.label}` : id;
  }, [categories]);

  const columns = useMemo(() => [
    { key: 'code', header: 'Code', width: 140, render: (i) => <ImmutableCode code={i.code} /> },
    { key: 'label', header: 'Libellé', render: (i) => <Text size="2" weight="medium">{i.label}</Text> },
    { key: 'category', header: 'Catégorie parente', width: 180, render: (i) => <Text size="2" color="gray">{getCategoryLabel(i.category_id)}</Text> },
    {
      key: 'status', header: 'Statut', width: 90,
      render: (i) => <Badge variant="soft" color={i.is_active ? 'green' : 'red'}>{i.is_active ? 'Actif' : 'Inactif'}</Badge>,
    },
    {
      key: 'actions', header: '', align: 'end', width: 120,
      render: (i) => (
        <Flex gap="1">
          <Button size="1" variant="soft" onClick={() => { setSelected(i); setEditOpen(true); }}><Pencil size={12} /></Button>
          <Button size="1" variant="soft" color={i.is_active ? 'red' : 'green'} onClick={() => onToggleActive(i.id, !i.is_active)}>
            {i.is_active ? 'Désactiver' : 'Activer'}
          </Button>
        </Flex>
      ),
    },
  ], [getCategoryLabel, onToggleActive]);

  return (
    <Box mb="6">
      <CreateSubcategoryModal open={createOpen} onOpenChange={setCreateOpen} categories={categories} onSubmit={handleCreate} submitting={submitting} />
      <EditLabelColorModal open={editOpen} onOpenChange={setEditOpen} item={selected} onSubmit={handleEdit} submitting={submitting} showColor={false} />
      <DataTable
        headerProps={{
          title: "Sous-catégories d'actions",
          count: items.length,
          showSearchInput: false,
          actions: (
            <Button size="2" onClick={() => setCreateOpen(true)}><Plus size={14} /> Nouvelle sous-catégorie</Button>
          ),
        }}
        columns={columns}
        data={items}
        loading={loading}
        emptyState={{ title: 'Aucune sous-catégorie', description: '' }}
      />
    </Box>
  );
}

// ---- Section facteurs de complexité ----
export function ComplexityFactorsSection({ items, categories, loading, onUpdate, onToggleActive }) {
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({ label: '', category_id: '' });

  const openEdit = useCallback((item) => {
    setSelected(item);
    setEditForm({ label: item.label || '', category_id: item.category_id || '' });
    setEditOpen(true);
  }, []);

  const handleEdit = useCallback(async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onUpdate(selected.id, editForm); setEditOpen(false); }
    finally { setSubmitting(false); }
  }, [selected, editForm, onUpdate]);

  const getCategoryLabel = useCallback((id) => {
    const cat = categories.find((c) => c.id === id);
    return cat ? `${cat.code} — ${cat.label}` : id;
  }, [categories]);

  const columns = useMemo(() => [
    { key: 'code', header: 'Code', width: 120, render: (i) => <ImmutableCode code={i.code} /> },
    { key: 'label', header: 'Libellé', render: (i) => <Text size="2" weight="medium">{i.label}</Text> },
    { key: 'category', header: 'Catégorie', width: 180, render: (i) => <Text size="2" color="gray">{getCategoryLabel(i.category_id)}</Text> },
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
  ], [getCategoryLabel, onToggleActive, openEdit]);

  return (
    <Box mb="6">
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Content style={{ maxWidth: 400 }}>
          <Dialog.Title>Modifier le facteur</Dialog.Title>
          <form onSubmit={handleEdit}>
            <Flex direction="column" gap="3" mt="4">
              <label>
                <Text size="2" weight="bold" mb="1" as="div">Libellé *</Text>
                <TextField.Root value={editForm.label} onChange={(e) => setEditForm((p) => ({ ...p, label: e.target.value }))} required />
              </label>
              <label>
                <Text size="2" weight="bold" mb="1" as="div">Catégorie</Text>
                <Select.Root value={editForm.category_id || '__none__'} onValueChange={(v) => setEditForm((p) => ({ ...p, category_id: v === '__none__' ? '' : v }))}>
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="__none__">— Aucune —</Select.Item>
                    {categories.map((c) => <Select.Item key={c.id} value={c.id}>{c.code} — {c.label}</Select.Item>)}
                  </Select.Content>
                </Select.Root>
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
        headerProps={{ title: 'Facteurs de complexité', count: items.length, showSearchInput: false }}
        columns={columns}
        data={items}
        loading={loading}
        emptyState={{ title: 'Aucun facteur', description: '' }}
      />
    </Box>
  );
}

ActionCategoriesSection.propTypes = {
  items: PropTypes.array.isRequired,
  categories: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onUpdate: PropTypes.func.isRequired,
  onToggleActive: PropTypes.func.isRequired,
};

ActionSubcategoriesSection.propTypes = {
  items: PropTypes.array.isRequired,
  categories: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onToggleActive: PropTypes.func.isRequired,
};

ComplexityFactorsSection.propTypes = {
  items: PropTypes.array.isRequired,
  categories: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onUpdate: PropTypes.func.isRequired,
  onToggleActive: PropTypes.func.isRequired,
};
