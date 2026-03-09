/**
 * @fileoverview Formulaire d'ajout d'un fournisseur à une pièce
 * @module components/stock/AddSupplierForm
 */

import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { Box, Button, Callout, Checkbox, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { AlertCircle, X } from 'lucide-react';
import { createSupplierItemLink, fetchSuppliers } from '@/api/suppliers';
import { useApiStatus } from '@/hooks/shared/useApiStatus';
import { StatusButton } from '@/components/ui/StatusButton';

const EMPTY_FORM = {
  supplier_id: '',
  supplier_ref: '',
  unit_price: '',
  min_order_quantity: '',
  delivery_time_days: '',
  is_preferred: false,
};

export function AddSupplierForm({ stockItemId, onSuccess, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [supplierList, setSupplierList] = useState([]);
  const { status, error, wrap, reset } = useApiStatus();

  useEffect(() => {
    fetchSuppliers({})
      .then((data) => setSupplierList(Array.isArray(data) ? data : []))
      .catch(() => setSupplierList([]));
  }, []);

  const setField = (updates) => {
    setForm((f) => ({ ...f, ...updates }));
    if (status === 'error') reset();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.supplier_id || form.supplier_ref.length < 2) return;
    wrap(async () => {
      await createSupplierItemLink({
        stock_item_id: stockItemId,
        supplier_id: form.supplier_id,
        supplier_ref: form.supplier_ref,
        ...(form.unit_price !== '' && { unit_price: Number(form.unit_price) }),
        ...(form.min_order_quantity !== '' && { min_order_quantity: Number(form.min_order_quantity) }),
        ...(form.delivery_time_days !== '' && { delivery_time_days: Number(form.delivery_time_days) }),
        is_preferred: form.is_preferred,
      });
      onSuccess();
    });
  };

  // Level 2 : erreur de validation backend (400/409/422), pas les erreurs système
  const inlineError = status === 'error' && error?.response && error.response.status < 500
    ? (error.response.data?.detail || error.message)
    : null;

  return (
    <Box mt="3" p="3" style={{ border: '1px solid var(--gray-4)', borderRadius: 'var(--radius-3)', background: 'var(--gray-1)' }}>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="2">
          <Text size="1" weight="bold" color="gray">Nouveau fournisseur</Text>
          <Flex gap="2" wrap="wrap">
            <Box style={{ minWidth: 180, flex: '1 1 180px' }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>Fournisseur *</Text>
              <Select.Root value={form.supplier_id} onValueChange={(v) => setField({ supplier_id: v })}>
                <Select.Trigger placeholder="Sélectionner..." style={{ width: '100%' }} />
                <Select.Content>
                  {supplierList.map((s) => (
                    <Select.Item key={s.id} value={s.id}>{s.name}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
            <Box style={{ minWidth: 140, flex: '1 1 140px' }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>Réf. fournisseur *</Text>
              <TextField.Root
                size="2"
                value={form.supplier_ref}
                onChange={(e) => setField({ supplier_ref: e.target.value })}
                placeholder="ex: REF-001"
              />
            </Box>
            <Box style={{ minWidth: 110, flex: '1 1 110px' }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>Prix unitaire (€)</Text>
              <TextField.Root
                size="2" type="number" min="0" step="0.01"
                value={form.unit_price}
                onChange={(e) => setField({ unit_price: e.target.value })}
                placeholder="0.00"
              />
            </Box>
            <Box style={{ minWidth: 100, flex: '1 1 100px' }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>Qté min.</Text>
              <TextField.Root
                size="2" type="number" min="1" step="1"
                value={form.min_order_quantity}
                onChange={(e) => setField({ min_order_quantity: e.target.value })}
                placeholder="1"
              />
            </Box>
            <Box style={{ minWidth: 100, flex: '1 1 100px' }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>Délai (j)</Text>
              <TextField.Root
                size="2" type="number" min="0" step="1"
                value={form.delivery_time_days}
                onChange={(e) => setField({ delivery_time_days: e.target.value })}
                placeholder="7"
              />
            </Box>
          </Flex>
          <Flex align="center" gap="2">
            <Checkbox
              checked={form.is_preferred}
              onCheckedChange={(v) => setField({ is_preferred: !!v })}
            />
            <Text size="1">Définir comme fournisseur préféré</Text>
          </Flex>
          {inlineError && (
            <Callout.Root color="red" size="1">
              <Callout.Icon><AlertCircle size={14} /></Callout.Icon>
              <Callout.Text>{inlineError}</Callout.Text>
            </Callout.Root>
          )}
          <Flex gap="2" justify="end">
            <Button size="1" variant="soft" color="gray" type="button" onClick={onCancel}>
              <X size={12} /> Annuler
            </Button>
            <StatusButton
              size="1"
              type="submit"
              status={status}
              disabled={!form.supplier_id || form.supplier_ref.length < 2}
            >
              Ajouter
            </StatusButton>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
}

AddSupplierForm.propTypes = {
  stockItemId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
