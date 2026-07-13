/**
 * @fileoverview Refs fournisseur d'une ref fabricant — CRUD inline
 * @module components/stock/PartSupplierRefsPanel
 */

import PropTypes from 'prop-types';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Box, Button, Flex, Text, TextField } from '@radix-ui/themes';
import { ExternalLink, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { addSupplierRef, deleteSupplierRef, setPreferredSupplierRef, updateSupplierRef } from '@/api/parts';
import { fetchSuppliers } from '@/api/suppliers';
import StatusCallout from '@/components/ui/StatusCallout';

// ─── Formulaire inline ref fournisseur ───────────────────────────────────────

function SupplierRefForm({ mfrRefId, initial, onSaved, onCancel }) {
  const isEdit = !!initial;
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    supplier_id: initial?.supplier_id || '',
    supplier_ref: initial?.supplier_ref || '',
    min_order_quantity: initial?.min_order_quantity != null ? String(initial.min_order_quantity) : '1',
    delivery_time_days: initial?.delivery_time_days != null ? String(initial.delivery_time_days) : '',
    is_preferred: initial?.is_preferred || false,
    product_url: initial?.product_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) fetchSuppliers({}).then((d) => setSuppliers(Array.isArray(d) ? d : [])).catch(() => {});
  }, [isEdit]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier_ref.trim()) { setError('La référence fournisseur est obligatoire.'); return; }
    if (!isEdit && !form.supplier_id) { setError('Sélectionnez un fournisseur.'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        supplier_ref: form.supplier_ref.trim(),
        min_order_quantity: form.min_order_quantity !== '' ? parseInt(form.min_order_quantity, 10) : 1,
        delivery_time_days: form.delivery_time_days !== '' ? parseInt(form.delivery_time_days, 10) : null,
        is_preferred: form.is_preferred,
        product_url: form.product_url.trim() || null,
      };
      if (!isEdit) {
        payload.supplier_id = form.supplier_id;
        await addSupplierRef(mfrRefId, payload);
      } else {
        await updateSupplierRef(initial.id, payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box style={{ background: 'var(--blue-2)', border: '1px solid var(--blue-6)', borderRadius: 'var(--radius-2)', padding: 10, marginTop: 6 }}>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="2">
          <Text size="1" weight="bold">{isEdit ? 'Modifier la référence fournisseur' : 'Ajouter un fournisseur'}</Text>
          {error && <StatusCallout type="error">{error}</StatusCallout>}

          {!isEdit && (
            <Box>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Fournisseur *</Text>
              <select
                value={form.supplier_id}
                onChange={(e) => setForm((f) => ({ ...f, supplier_id: e.target.value }))}
                style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-7)', fontSize: 'var(--font-size-2)', background: 'var(--color-background)' }}
              >
                <option value="">Sélectionner un fournisseur…</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Box>
          )}

          <Flex gap="2" wrap="wrap">
            <Box style={{ flex: 2, minWidth: 120 }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Référence fournisseur *</Text>
              <TextField.Root value={form.supplier_ref} onChange={set('supplier_ref')} placeholder="ex: P1115070" />
            </Box>
            <Box style={{ flex: 1, minWidth: 70 }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Qté min.</Text>
              <TextField.Root value={form.min_order_quantity} onChange={set('min_order_quantity')} type="number" min="1" />
            </Box>
            <Box style={{ flex: 1, minWidth: 70 }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Délai (j)</Text>
              <TextField.Root value={form.delivery_time_days} onChange={set('delivery_time_days')} type="number" min="0" />
            </Box>
          </Flex>

          <Box>
            <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>URL fiche produit</Text>
            <TextField.Root value={form.product_url} onChange={set('product_url')} placeholder="https://…" type="url" />
          </Box>

          <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
            Le prix unitaire est calculé automatiquement à partir de l&apos;historique des commandes — il ne se saisit pas ici.
          </Text>

          <Flex align="center" gap="2">
            <input
              type="checkbox"
              id={`pref-${mfrRefId}`}
              checked={form.is_preferred}
              onChange={(e) => setForm((f) => ({ ...f, is_preferred: e.target.checked }))}
            />
            <Text size="1" as="label" htmlFor={`pref-${mfrRefId}`}>Fournisseur préféré pour cette référence</Text>
          </Flex>

          <Flex justify="end" gap="2">
            <Button type="button" size="1" variant="soft" color="gray" onClick={onCancel} disabled={saving}>Annuler</Button>
            <Button type="submit" size="1" color="blue" loading={saving}>{isEdit ? 'Enregistrer' : 'Ajouter'}</Button>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
}

SupplierRefForm.propTypes = {
  mfrRefId: PropTypes.string.isRequired,
  initial: PropTypes.object,
  onSaved: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

// ─── Panel fournisseurs ───────────────────────────────────────────────────────

export default function PartSupplierRefsPanel({ mfrRef, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const handleSetPreferred = useCallback(async (id) => {
    setActionError(null);
    try { await setPreferredSupplierRef(id); onRefresh(); }
    catch (e) { setActionError(e?.response?.data?.detail || 'Erreur'); }
  }, [onRefresh]);

  const handleDelete = useCallback(async (id) => {
    setActionError(null);
    try { await deleteSupplierRef(id); onRefresh(); }
    catch (e) { setActionError(e?.response?.data?.detail || 'Erreur'); }
  }, [onRefresh]);

  const supplierRefs = mfrRef.supplier_refs || [];

  return (
    <Box>
      <Flex justify="between" align="center" mb="1">
        <Text size="1" color="gray" weight="bold">Fournisseurs</Text>
        {!showForm && (
          <Button size="1" variant="ghost" color="blue" onClick={() => { setShowForm(true); setEditingId(null); }}>
            <Plus size={11} /> Ajouter
          </Button>
        )}
      </Flex>

      {actionError && <Text size="1" color="red" style={{ display: 'block', marginBottom: 4 }}>{actionError}</Text>}

      {supplierRefs.length === 0 && !showForm && (
        <Text size="1" color="gray">Aucun fournisseur.</Text>
      )}

      <Flex direction="column" gap="1">
        {supplierRefs.map((sup) => (
          <Box key={sup.id}>
            {editingId === sup.id ? (
              <SupplierRefForm
                mfrRefId={mfrRef.id}
                initial={sup}
                onSaved={() => { setEditingId(null); onRefresh(); }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <Flex align="center" gap="2" style={{ padding: '5px 8px', background: 'var(--gray-1)', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-4)' }}>
                {sup.is_preferred && <Star size={11} fill="var(--amber-9)" color="var(--amber-9)" />}
                <Text size="1" weight={sup.is_preferred ? 'bold' : 'regular'}>{sup.supplier_name || sup.supplier_id}</Text>
                <Badge variant="soft" color="indigo" size="1">{sup.supplier_ref}</Badge>
                {sup.unit_price != null && <Text size="1" color="gray">{sup.unit_price} €</Text>}
                {sup.delivery_time_days != null && <Text size="1" color="gray">{sup.delivery_time_days} j</Text>}
                {sup.product_url && /^https?:\/\//i.test(sup.product_url) && (
                  <a href={sup.product_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-9)', display: 'flex' }}>
                    <ExternalLink size={11} />
                  </a>
                )}
                <Box style={{ flex: 1 }} />
                <Flex gap="1">
                  {!sup.is_preferred && (
                    <Button size="1" variant="ghost" color="amber" onClick={() => handleSetPreferred(sup.id)}>
                      <Star size={11} />
                    </Button>
                  )}
                  <Button size="1" variant="ghost" color="blue" onClick={() => { setEditingId(sup.id); setShowForm(false); }}>
                    <Pencil size={11} />
                  </Button>
                  <Button size="1" variant="ghost" color="red" onClick={() => handleDelete(sup.id)}>
                    <Trash2 size={11} />
                  </Button>
                </Flex>
              </Flex>
            )}
          </Box>
        ))}
      </Flex>

      {showForm && (
        <SupplierRefForm
          mfrRefId={mfrRef.id}
          onSaved={() => { setShowForm(false); onRefresh(); }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </Box>
  );
}

PartSupplierRefsPanel.propTypes = {
  mfrRef: PropTypes.object.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
