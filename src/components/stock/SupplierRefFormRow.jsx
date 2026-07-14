/**
 * @fileoverview Ligne de tableau — formulaire inline pour lier/modifier une ref fournisseur
 * @module components/stock/SupplierRefFormRow
 */

import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Box, Button, Flex, Table, Text, TextField } from '@radix-ui/themes';
import { addSupplierRef, updateSupplierRef } from '@/api/parts';
import { fetchSuppliers } from '@/api/suppliers';
import StatusCallout from '@/components/ui/StatusCallout';

export function buildSupplierRefPayload(form) {
  return {
    supplier_ref: form.supplier_ref.trim(),
    min_order_quantity: form.min_order_quantity !== '' ? parseInt(form.min_order_quantity, 10) : 1,
    delivery_time_days: form.delivery_time_days !== '' ? parseInt(form.delivery_time_days, 10) : null,
    is_preferred: form.is_preferred,
    product_url: form.product_url.trim() || null,
  };
}

function validateForm(form, isEdit) {
  if (!form.supplier_ref.trim()) return 'La référence fournisseur est obligatoire.';
  if (!isEdit && !form.supplier_id) return 'Sélectionnez ou liez un fournisseur.';
  return null;
}

async function submitForm({ form, isEdit, mfrRefId, initialId }) {
  const payload = buildSupplierRefPayload(form);
  if (isEdit) return updateSupplierRef(initialId, payload);
  return addSupplierRef(mfrRefId, { ...payload, supplier_id: form.supplier_id });
}

export function initialSupplierRefFormState(initial) {
  if (!initial) {
    return { supplier_id: '', supplier_ref: '', min_order_quantity: '1', delivery_time_days: '', is_preferred: false, product_url: '' };
  }
  return {
    supplier_id: initial.supplier_id || '',
    supplier_ref: initial.supplier_ref || '',
    min_order_quantity: initial.min_order_quantity != null ? String(initial.min_order_quantity) : '1',
    delivery_time_days: initial.delivery_time_days != null ? String(initial.delivery_time_days) : '',
    is_preferred: initial.is_preferred || false,
    product_url: initial.product_url || '',
  };
}

export function SupplierPicker({ suppliers, value, onChange }) {
  return (
    <Box>
      <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Fournisseur *</Text>
      <select
        value={value}
        onChange={onChange}
        style={{ width: '100%', maxWidth: 320, height: 32, padding: '0 8px', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-7)', fontSize: 'var(--font-size-2)', background: 'var(--color-background)' }}
      >
        <option value="">Sélectionner un fournisseur du catalogue…</option>
        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </Box>
  );
}

SupplierPicker.propTypes = {
  suppliers: PropTypes.array.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export function SupplierRefFields({ form, set }) {
  return (
    <>
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
    </>
  );
}

SupplierRefFields.propTypes = {
  form: PropTypes.object.isRequired,
  set: PropTypes.func.isRequired,
};

export default function SupplierRefFormRow({ mfrRefId, initial, colSpan, onSaved, onCancel }) {
  const isEdit = !!initial;
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(() => initialSupplierRefFormState(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEdit) return;
    fetchSuppliers({}).then((d) => setSuppliers(Array.isArray(d) ? d : [])).catch(() => {});
  }, [isEdit]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm(form, isEdit);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError(null);
    try {
      await submitForm({ form, isEdit, mfrRefId, initialId: initial?.id });
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Table.Row style={{ background: 'var(--blue-2)' }}>
      <Table.Cell colSpan={colSpan}>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="2" py="1">
            <Text size="1" weight="bold">
              {isEdit ? 'Modifier la référence fournisseur' : 'Lier un fournisseur existant du catalogue'}
            </Text>
            {error && <StatusCallout type="error">{error}</StatusCallout>}

            {!isEdit && (
              <SupplierPicker
                suppliers={suppliers}
                value={form.supplier_id}
                onChange={(e) => setForm((f) => ({ ...f, supplier_id: e.target.value }))}
              />
            )}

            <SupplierRefFields form={form} set={set} />

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
              <Button type="submit" size="1" color="blue" loading={saving}>{isEdit ? 'Enregistrer' : 'Lier'}</Button>
            </Flex>
          </Flex>
        </form>
      </Table.Cell>
    </Table.Row>
  );
}

SupplierRefFormRow.propTypes = {
  mfrRefId: PropTypes.string.isRequired,
  initial: PropTypes.object,
  colSpan: PropTypes.number.isRequired,
  onSaved: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
