/**
 * @fileoverview Sections référentiel actions (catégories, sous-catégories, facteurs)
 * @module components/admin/AdminRefActionsSection
 */

import { Fragment, useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Spinner, Table, Text, TextField, Dialog } from '@radix-ui/themes';
import { ChevronDown, ChevronRight, Lock, Plus, Pencil } from 'lucide-react';
import { usePermissions } from '@/auth/usePermissions';
import { PERM } from '@/auth/permissionCodes';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';
import DataTable from '@/components/ui/DataTable';
import ExpandableDetailsRow from '@/components/ui/ExpandableDetailsRow';
import {
  fetchActionSubcategories,
  createActionSubcategory,
  updateActionSubcategory,
} from '@/api/adminReferentiel';

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

// ---- Modal générique nom + couleur ----
function EditLabelColorModal({ open, onOpenChange, item, onSubmit, submitting, showColor = true }) {
  const [nameValue, setNameValue] = useState('');
  const [color, setColor] = useState('');

  useMemo(() => {
    if (item) { setNameValue(item.name || item.label || ''); setColor(item.color || ''); }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { name: nameValue };
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
              <TextField.Root value={nameValue} onChange={(e) => setNameValue(e.target.value)} required />
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

// ---- Section catégories d'actions (sous-catégories en dropdown, chargement lazy) ----
export function ActionCategoriesSection({ items, loading, onUpdate, onNotify }) {
  const { can } = usePermissions();
  // Edition catégorie
  const [editCatOpen, setEditCatOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [catSubmitting, setCatSubmitting] = useState(false);

  // Lignes expandées
  const [expanded, setExpanded] = useState({});

  // Sous-catégories : chargement lazy (une seule requête au 1er expand)
  const [allSubs, setAllSubs] = useState([]);
  const [subsLoaded, setSubsLoaded] = useState(false);
  const [subsLoading, setSubsLoading] = useState(false);

  // Création sous-catégorie
  const [createSubForCat, setCreateSubForCat] = useState(null);
  const [subCreateSubmitting, setSubCreateSubmitting] = useState(false);

  // Edition sous-catégorie
  const [editSubOpen, setEditSubOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [subEditSubmitting, setSubEditSubmitting] = useState(false);

  const loadSubs = useCallback(async () => {
    if (subsLoaded || subsLoading) return;
    setSubsLoading(true);
    try {
      const data = await fetchActionSubcategories();
      setAllSubs(Array.isArray(data) ? data : []);
      setSubsLoaded(true);
    } finally {
      setSubsLoading(false);
    }
  }, [subsLoaded, subsLoading]);

  const handleToggleExpand = useCallback((catId) => {
    const willOpen = !expanded[catId];
    setExpanded((p) => ({ ...p, [catId]: !p[catId] }));
    if (willOpen) loadSubs();
  }, [expanded, loadSubs]);

  const getSubsForCat = useCallback((catId) =>
    allSubs.filter((s) => Number(s.category_id) === Number(catId)), [allSubs]);

  const handleEditCat = useCallback(async (id, payload) => {
    setCatSubmitting(true);
    try { await onUpdate(id, payload); setEditCatOpen(false); }
    finally { setCatSubmitting(false); }
  }, [onUpdate]);

  const handleCreateSub = useCallback(async (form) => {
    setSubCreateSubmitting(true);
    try {
      const newSub = await createActionSubcategory(form);
      setAllSubs((p) => [...p, newSub]);
      setCreateSubForCat(null);
    } catch (err) {
      onNotify(extractApiErrorMessage(err, 'Erreur lors de la création'), 'error');
    } finally { setSubCreateSubmitting(false); }
  }, [onNotify]);

  const handleEditSub = useCallback(async (id, payload) => {
    setSubEditSubmitting(true);
    try {
      const updated = await updateActionSubcategory(id, payload);
      setAllSubs((p) => p.map((s) => s.id === id ? { ...s, ...updated } : s));
      setEditSubOpen(false);
    } catch (err) {
      onNotify(extractApiErrorMessage(err, 'Erreur lors de la modification'), 'error');
    } finally { setSubEditSubmitting(false); }
  }, [onNotify]);

  return (
    <Box mb="6">
      <EditLabelColorModal open={editCatOpen} onOpenChange={setEditCatOpen} item={selectedCat} onSubmit={handleEditCat} submitting={catSubmitting} showColor />
      <CreateSubcategoryModal
        open={!!createSubForCat}
        onOpenChange={(v) => { if (!v) setCreateSubForCat(null); }}
        category={createSubForCat}
        onSubmit={handleCreateSub}
        submitting={subCreateSubmitting}
      />
      <EditLabelColorModal open={editSubOpen} onOpenChange={setEditSubOpen} item={selectedSub} onSubmit={handleEditSub} submitting={subEditSubmitting} showColor={false} />

      <Flex justify="between" align="center" mb="3">
        <Flex align="center" gap="2">
          <Text size="3" weight="bold">Catégories d&apos;actions</Text>
          <Badge variant="soft" color="gray" size="1">{items.length}</Badge>
        </Flex>
        <Text size="1" color="gray">Cliquez sur une ligne pour voir les sous-catégories</Text>
      </Flex>

      {loading ? (
        <Text color="gray" size="2">Chargement...</Text>
      ) : (
        <Table.Root variant="surface" size="1">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell style={{ width: 52 }} />
              <Table.ColumnHeaderCell style={{ width: 110 }}>Code</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Nom</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ width: 150 }}>Couleur</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ width: 52 }} />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.map((cat) => {
              const isOpen = !!expanded[cat.id];
              const subs = getSubsForCat(cat.id);
              return (
                <Fragment key={cat.id}>
                  <Table.Row
                    style={{ cursor: 'pointer', background: isOpen ? 'var(--blue-2)' : undefined }}
                    onClick={() => handleToggleExpand(cat.id)}
                  >
                    <Table.Cell>
                      <Flex align="center" gap="1">
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {subsLoaded && <Badge size="1" variant="soft" color="gray">{subs.length}</Badge>}
                      </Flex>
                    </Table.Cell>
                    <Table.Cell><ImmutableCode code={cat.code} /></Table.Cell>
                    <Table.Cell><Text size="2" weight="medium">{cat.name}</Text></Table.Cell>
                    <Table.Cell><ColorSwatch color={cat.color} /></Table.Cell>
                    <Table.Cell>
                      {can(PERM.adminRef.patchCategory) && (
                        <Button size="1" variant="soft" onClick={(e) => { e.stopPropagation(); setSelectedCat(cat); setEditCatOpen(true); }}>
                          <Pencil size={12} />
                        </Button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                  {isOpen && (
                    <ExpandableDetailsRow colSpan={5} withCard={false}>
                      <Box pl="3" pr="3" pb="3">
                        <Flex justify="between" align="center" mb="2">
                          <Text size="1" weight="bold" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Sous-catégories — {cat.code}
                          </Text>
                          {can(PERM.adminRef.createSubcategory) && (
                            <Button size="1" onClick={(e) => { e.stopPropagation(); setCreateSubForCat(cat); }}>
                              <Plus size={11} /> Ajouter
                            </Button>
                          )}
                        </Flex>
                        {subsLoading ? (
                          <Flex align="center" gap="2"><Spinner size="1" /><Text size="1" color="gray">Chargement...</Text></Flex>
                        ) : subs.length === 0 ? (
                          <Text size="1" color="gray">Aucune sous-catégorie pour cette catégorie.</Text>
                        ) : (
                          <Table.Root size="1">
                            <Table.Body>
                              {subs.map((sub) => (
                                <Table.Row key={sub.id}>
                                  <Table.Cell style={{ width: 150 }}><ImmutableCode code={sub.code} /></Table.Cell>
                                  <Table.Cell><Text size="2">{sub.name}</Text></Table.Cell>
                                  <Table.Cell style={{ width: 52, textAlign: 'right' }}>
                                    {can(PERM.adminRef.patchSubcategory) && (
                                      <Button size="1" variant="soft" onClick={(e) => { e.stopPropagation(); setSelectedSub(sub); setEditSubOpen(true); }}>
                                        <Pencil size={12} />
                                      </Button>
                                    )}
                                  </Table.Cell>
                                </Table.Row>
                              ))}
                            </Table.Body>
                          </Table.Root>
                        )}
                      </Box>
                    </ExpandableDetailsRow>
                  )}
                </Fragment>
              );
            })}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  );
}

// ---- Modal création sous-catégorie (catégorie fixée par le contexte) ----
function CreateSubcategoryModal({ open, onOpenChange, category, onSubmit, submitting }) {
  const [form, setForm] = useState({ code: '', name: '' });

  useMemo(() => {
    if (category) setForm({ code: `${category.code}_`, name: '' });
    else setForm({ code: '', name: '' });
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ code: form.code.trim().toUpperCase(), name: form.name.trim(), category_id: category.id });
    setForm({ code: '', name: '' });
  };

  if (!category) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 400 }}>
        <Dialog.Title>Nouvelle sous-catégorie — {category.code}</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="4">
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Code *</Text>
              <TextField.Root value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} required />
            </label>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Libellé *</Text>
              <TextField.Root value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
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

// ---- Section facteurs de complexité (lecture seule : aucune route de modification) ----
export function ComplexityFactorsSection({ items, categories, loading }) {
  const getCategoryLabel = useCallback((id) => {
    const cat = categories.find((c) => c.id === id);
    return cat ? `${cat.code} — ${cat.name}` : id;
  }, [categories]);

  const columns = useMemo(() => [
    { key: 'code', header: 'Code', width: 120, render: (i) => <ImmutableCode code={i.code} /> },
    { key: 'label', header: 'Libellé', render: (i) => <Text size="2" weight="medium">{i.label || i.name}</Text> },
    { key: 'category', header: 'Catégorie', width: 180, render: (i) => <Text size="2" color="gray">{getCategoryLabel(i.category_id)}</Text> },
  ], [getCategoryLabel]);

  return (
    <Box mb="6">
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
  loading: PropTypes.bool,
  onUpdate: PropTypes.func.isRequired,
  onNotify: PropTypes.func.isRequired,
};

ComplexityFactorsSection.propTypes = {
  items: PropTypes.array.isRequired,
  categories: PropTypes.array.isRequired,
  loading: PropTypes.bool,
};
